from __future__ import annotations

import json
import re
import sys
import time
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
from typing import Any

import requests
from PIL import Image, UnidentifiedImageError

sys.path.append(str(Path(__file__).resolve().parent))
from constants import CACHE_DIR, LIQUIPEDIA_API, MEDIA_DIR, REQUEST_INTERVAL_SECONDS, USER_AGENT, WIKIPEDIA_API, slugify


class CacheMissError(RuntimeError):
    pass


class WikiFetcher:
    def __init__(self, cache_dir: Path = CACHE_DIR, cache_mode: str = "refresh", media_dir: Path = MEDIA_DIR) -> None:
        if cache_mode not in {"refresh", "offline", "resume"}:
            raise ValueError("cache_mode must be 'refresh', 'offline', or 'resume'")
        self.cache_dir = cache_dir
        self.cache_mode = cache_mode
        self.media_dir = media_dir
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept-Encoding": "gzip",
            }
        )
        self.last_request_at = 0.0
        self.last_parse_at = 0.0
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _reset_session(self) -> None:
        headers = dict(self.session.headers)
        self.session.close()
        self.session = requests.Session()
        self.session.headers.update(headers)

    def _throttle(self) -> None:
        wait = REQUEST_INTERVAL_SECONDS - (time.time() - self.last_request_at)
        if wait > 0:
            time.sleep(wait)

    def _request(self, base_url: str, params: dict[str, Any], cache_name: str) -> dict[str, Any]:
        cache_path = self.cache_dir / cache_name
        if self.cache_mode in {"offline", "resume"}:
            if not cache_path.exists():
                raise CacheMissError(f"offline cache miss: {cache_name}")
            return json.loads(cache_path.read_text(encoding="utf-8"))

        for attempt in range(3):
            self._throttle()
            try:
                resp = self.session.get(base_url, params=params, timeout=30)
                break
            except requests.RequestException as exc:
                if attempt == 2:
                    raise
                if isinstance(exc, requests.exceptions.SSLError):
                    self._reset_session()
                time.sleep(2 ** attempt)
        resp.raise_for_status()
        payload = resp.json()
        cache_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        self.last_request_at = time.time()
        return payload

    def fetch_parsed_html(self, title: str, source: str = "liquipedia") -> str:
        base_url = LIQUIPEDIA_API if source == "liquipedia" else WIKIPEDIA_API
        cache_name = f"{source}-parse-{title.replace('/', '_').replace(' ', '_')}.json"
        cache_path = self.cache_dir / cache_name
        if self.cache_mode in {"offline", "resume"}:
            if not cache_path.exists():
                raise CacheMissError(f"offline cache miss: {cache_name}")
            return json.loads(cache_path.read_text(encoding="utf-8")).get("parse", {}).get("text", {}).get("*", "")

        wait = 30.5 - (time.time() - self.last_parse_at)
        if wait > 0:
            time.sleep(wait)
        for attempt in range(3):
            try:
                resp = self.session.get(
                    base_url,
                    params={"action": "parse", "page": title, "prop": "text", "format": "json"},
                    timeout=30,
                )
                break
            except requests.RequestException as exc:
                if attempt == 2:
                    raise
                if isinstance(exc, requests.exceptions.SSLError):
                    self._reset_session()
                time.sleep(2 ** attempt)
        resp.raise_for_status()
        payload = resp.json()
        cache_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        self.last_parse_at = time.time()
        return payload.get("parse", {}).get("text", {}).get("*", "")

    def fetch_wikitext(self, title: str, source: str = "liquipedia") -> str:
        content, _metadata = self.fetch_wikitext_with_meta(title, source)
        return content

    def fetch_wikitext_with_meta(self, title: str, source: str = "liquipedia") -> tuple[str, dict[str, Any]]:
        base_url = LIQUIPEDIA_API if source == "liquipedia" else WIKIPEDIA_API
        params = {
            "action": "query",
            "prop": "revisions",
            "rvprop": "content|ids|timestamp",
            "rvslots": "main",
            "titles": title,
            "redirects": 1,
            "format": "json",
            "formatversion": 2,
        }
        cache_name = f"{source}-{title.replace('/', '_').replace(' ', '_')}.json"
        payload = self._request(base_url, params, cache_name)
        pages = payload.get("query", {}).get("pages", [])
        if not pages or "missing" in pages[0]:
            return "", {}
        revisions = pages[0].get("revisions", [])
        if not revisions:
            return "", {}
        revision = revisions[0]
        cache_path = self.cache_dir / cache_name
        return revision.get("slots", {}).get("main", {}).get("content", ""), {
            "revision": str(revision.get("revid", "")),
            "source_timestamp": revision.get("timestamp", ""),
            "fetched_at": datetime.fromtimestamp(cache_path.stat().st_mtime, timezone.utc).isoformat(),
        }

    def resolve_image_url(self, image_name: str) -> str:
        name = image_name.strip()
        if not name:
            return ""
        if name.startswith("//"):
            return f"https:{name}"
        if name.startswith("http://") or name.startswith("https://"):
            return name
        name = re.sub(r"^(File|Image):", "", name, flags=re.I).strip()
        if not name:
            return ""
        payload = self._request(
            LIQUIPEDIA_API,
            {
                "action": "query",
                "titles": f"File:{name}",
                "prop": "imageinfo",
                "iiprop": "url",
                "format": "json",
                "formatversion": 2,
            },
            f"liquipedia-image-{slugify(name)}.json",
        )
        pages = payload.get("query", {}).get("pages", [])
        if not pages:
            return ""
        imageinfo = pages[0].get("imageinfo", [])
        return imageinfo[0].get("url", "") if imageinfo else ""

    def download_media(self, source_url: str, kind: str, slug: str) -> tuple[str, str]:
        if not source_url:
            return "", ""
        url = source_url.strip()
        if url.startswith("//"):
            url = f"https:{url}"
        elif url.startswith("/"):
            url = urljoin("https://liquipedia.net", url)
        for redirect_count in range(4):
            parsed = urlparse(url)
            allowed_host = parsed.hostname == "liquipedia.net" or bool(parsed.hostname and parsed.hostname.endswith(".liquipedia.net"))
            if parsed.scheme != "https" or not allowed_host:
                raise ValueError("media URL must use HTTPS on an allowed Liquipedia host")
            self._throttle()
            resp = self.session.get(url, timeout=30, allow_redirects=False)
            if not 300 <= resp.status_code < 400:
                break
            location = resp.headers.get("location")
            if not location:
                raise ValueError("media redirect has no destination")
            url = urljoin(url, location)
        else:
            raise ValueError("media redirect limit exceeded")
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "").split(";", 1)[0].strip().lower()
        if content_type not in {"image/png", "image/jpeg", "image/webp", "image/gif"}:
            raise ValueError("media response is not an allowed raster image")
        content = resp.content
        if len(content) > 8 * 1024 * 1024:
            raise ValueError("media response exceeds 8MB")
        try:
            with Image.open(BytesIO(content)) as image:
                width, height = image.size
                image.verify()
        except (UnidentifiedImageError, OSError) as exc:
            raise ValueError("media response cannot be decoded") from exc
        if width > 8192 or height > 8192 or width * height > 16_000_000:
            raise ValueError("media dimensions exceed review limits")

        ext = Path(unquote(parsed.path)).suffix.lower()
        extension_by_type = {
            "image/png": ".png",
            "image/jpeg": ".jpg",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }
        if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
            ext = extension_by_type[content_type]
        media_dir = self.media_dir / kind
        media_dir.mkdir(parents=True, exist_ok=True)
        file_path = media_dir / f"{slugify(slug)}{ext}"
        if not file_path.exists():
            file_path.write_bytes(content)
            self.last_request_at = time.time()
        return "", url
