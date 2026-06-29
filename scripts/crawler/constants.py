from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = ROOT / ".cache" / "crawler"
DB_PATH = ROOT / "data" / "ti.db"
MEDIA_DIR = ROOT / "public" / "media" / "liquipedia"
TOURNAMENTS_JSON = ROOT / "app" / "data" / "tournaments.json"
TEAMS_JSON = ROOT / "app" / "data" / "teams.json"

LIQUIPEDIA_API = "https://liquipedia.net/dota2/api.php"
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
USER_AGENT = "ti-wiki/1.0 (https://local.ti-wiki.invalid; zdx@local)"
REQUEST_INTERVAL_SECONDS = 2.1
YEARS = list(range(2011, 2027))

COMMON_WORDS = {
    "team",
    "gaming",
    "esports",
    "club",
    "pro",
    "gg",
}

CHINA_TEAM_ALIASES = {
    "ehome",
    "invictusgaming",
    "ig",
    "lgdgaming",
    "lgd",
    "psglgd",
    "newbee",
    "wingsgaming",
    "wings",
    "vigaming",
    "vici",
    "vicigamingreborn",
    "vgr",
    "rng",
    "royalnevergiveup",
    "teamaster",
    "aster",
    "xtremegaming",
    "xg",
    "azureray",
    "teamzero",
    "serenity",
    "teamserenity",
    "cdecgaming",
    "cdc",
}


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"\(.*?\)", "", value)
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "unknown"


def compact(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"\(.*?\)", "", value)
    return re.sub(r"[^a-z0-9]+", "", value)


def strip_code(value: str) -> str:
    value = value.replace("'''", "").replace("''", "")
    value = re.sub(r"\[\[[^|\]]+\|([^\]]+)\]\]", r"\1", value)
    value = re.sub(r"\[\[([^\]]+)\]\]", r"\1", value)
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\{\{[Ff]lag\|[^}]+\}\}", "", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()
