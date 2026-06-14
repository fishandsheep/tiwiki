from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any

import requests

sys.path.append(str(Path(__file__).resolve().parent))
from constants import CACHE_DIR, LIQUIPEDIA_API, REQUEST_INTERVAL_SECONDS, USER_AGENT, WIKIPEDIA_API


class WikiFetcher:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept-Encoding": "gzip",
            }
        )
        self.last_request_at = 0.0
        self.last_parse_at = 0.0
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def _throttle(self) -> None:
        wait = REQUEST_INTERVAL_SECONDS - (time.time() - self.last_request_at)
        if wait > 0:
            time.sleep(wait)

    def _request(self, base_url: str, params: dict[str, Any], cache_name: str) -> dict[str, Any]:
        cache_path = CACHE_DIR / cache_name
        if cache_path.exists():
            return json.loads(cache_path.read_text(encoding="utf-8"))

        self._throttle()
        resp = self.session.get(base_url, params=params, timeout=30)
        resp.raise_for_status()
        payload = resp.json()
        cache_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        self.last_request_at = time.time()
        return payload

    def fetch_parsed_html(self, title: str, source: str = "liquipedia") -> str:
        base_url = LIQUIPEDIA_API if source == "liquipedia" else WIKIPEDIA_API
        cache_name = f"{source}-parse-{title.replace('/', '_').replace(' ', '_')}.json"
        cache_path = CACHE_DIR / cache_name
        if cache_path.exists():
            return json.loads(cache_path.read_text(encoding="utf-8")).get("parse", {}).get("text", {}).get("*", "")

        wait = 30.5 - (time.time() - self.last_parse_at)
        if wait > 0:
            time.sleep(wait)
        resp = self.session.get(
            base_url,
            params={"action": "parse", "page": title, "prop": "text", "format": "json"},
            timeout=30,
        )
        resp.raise_for_status()
        payload = resp.json()
        cache_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        self.last_parse_at = time.time()
        return payload.get("parse", {}).get("text", {}).get("*", "")

    def fetch_wikitext(self, title: str, source: str = "liquipedia") -> str:
        base_url = LIQUIPEDIA_API if source == "liquipedia" else WIKIPEDIA_API
        params = {
            "action": "query",
            "prop": "revisions",
            "rvprop": "content",
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
            return ""
        revisions = pages[0].get("revisions", [])
        if not revisions:
            return ""
        return revisions[0].get("slots", {}).get("main", {}).get("content", "")
