from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import requests

ROOT = Path(__file__).resolve().parents[3]
sys.path.append(str(ROOT / "scripts" / "crawler"))

from fetch import CacheMissError, WikiFetcher  # noqa: E402


class FakeResponse:
    def __init__(self, payload: dict) -> None:
        self.payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self.payload


class FakeSession:
    def __init__(self, payload: dict) -> None:
        self.payload = payload
        self.calls = 0
        self.headers: dict[str, str] = {}

    def get(self, *_args, **_kwargs) -> FakeResponse:
        self.calls += 1
        return FakeResponse(self.payload)


class FlakySession(FakeSession):
    def get(self, *_args, **_kwargs) -> FakeResponse:
        self.calls += 1
        if self.calls < 3:
            raise requests.ReadTimeout("temporary timeout")
        return FakeResponse(self.payload)


class FetchCacheTests(unittest.TestCase):
    def test_offline_mode_never_uses_network(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fetcher = WikiFetcher(cache_dir=Path(directory), cache_mode="offline")
            session = FakeSession({"new": True})
            fetcher.session = session  # type: ignore[assignment]

            with self.assertRaises(CacheMissError):
                fetcher._request("https://example.test/api", {}, "missing.json")

            self.assertEqual(session.calls, 0)

    def test_refresh_mode_replaces_stale_cache_with_network_response(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            cache_dir = Path(directory)
            cache_path = cache_dir / "page.json"
            cache_path.write_text(json.dumps({"old": True}), encoding="utf-8")
            fetcher = WikiFetcher(cache_dir=cache_dir, cache_mode="refresh")
            session = FakeSession({"new": True})
            fetcher.session = session  # type: ignore[assignment]

            payload = fetcher._request("https://example.test/api", {}, cache_path.name)

            self.assertEqual(payload, {"new": True})
            self.assertEqual(session.calls, 1)
            self.assertEqual(json.loads(cache_path.read_text(encoding="utf-8")), {"new": True})

    def test_refresh_mode_retries_transient_network_failures(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fetcher = WikiFetcher(cache_dir=Path(directory), cache_mode="refresh")
            session = FlakySession({"new": True})
            fetcher.session = session  # type: ignore[assignment]

            with patch("fetch.time.sleep"):
                payload = fetcher._request("https://example.test/api", {}, "retry.json")

            self.assertEqual(payload, {"new": True})
            self.assertEqual(session.calls, 3)

    def test_resume_mode_reuses_snapshot_without_network(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            cache_dir = Path(directory)
            cache_path = cache_dir / "page.json"
            cache_path.write_text(json.dumps({"snapshot": True}), encoding="utf-8")
            fetcher = WikiFetcher(cache_dir=cache_dir, cache_mode="resume")
            session = FakeSession({"network": True})
            fetcher.session = session  # type: ignore[assignment]

            payload = fetcher._request("https://example.test/api", {}, cache_path.name)

            self.assertEqual(payload, {"snapshot": True})
            self.assertEqual(session.calls, 0)

    def test_media_download_rejects_hosts_outside_allowlist(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            fetcher = WikiFetcher(
                cache_dir=Path(directory) / "cache",
                cache_mode="refresh",
                media_dir=Path(directory) / "media",
            )
            session = FakeSession({})
            fetcher.session = session  # type: ignore[assignment]

            with self.assertRaisesRegex(ValueError, "allowed Liquipedia host"):
                fetcher.download_media("https://example.test/avatar.png", "players", "test")

            self.assertEqual(session.calls, 0)


if __name__ == "__main__":
    unittest.main()
