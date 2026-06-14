from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.append(str(ROOT / "scripts" / "crawler"))

from parse import build_cancelled_2020, parse_infobox, parse_participants, parse_placements, parse_placements_from_html, parse_number  # noqa: E402
from refresh import load_seed_teams, load_seed_tournaments  # noqa: E402


def load_cached_wikitext(year: int) -> str:
    path = ROOT / ".cache" / "crawler" / f"liquipedia-The_International_{year}.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload["query"]["pages"][0]["revisions"][0]["slots"]["main"]["content"]


def load_cached_html(year: int) -> str:
    path = ROOT / ".cache" / "crawler" / f"liquipedia-parse-The_International_{year}.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload["parse"]["text"]["*"]


def load_cached_prizepool(year: int) -> str:
    path = ROOT / ".cache" / "crawler" / f"liquipedia-The_International_{year}_prizepool.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload["query"]["pages"][0]["revisions"][0]["slots"]["main"]["content"]


class ParseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.seed_teams = load_seed_teams()
        cls.seed_tournaments = load_seed_tournaments()

    def test_2011_old_format_parses(self) -> None:
        wikitext = load_cached_wikitext(2011)
        info = parse_infobox(wikitext)
        participants, alias_to_team_id, players, rosters, teams = parse_participants(wikitext, self.seed_teams)

        self.assertEqual(info["name"], "The International 2011")
        self.assertGreaterEqual(len(participants), 16)
        self.assertGreaterEqual(len(players), 80)
        self.assertGreaterEqual(len(rosters), 80)
        self.assertIn("navi", teams)
        self.assertIn("ig", teams)
        self.assertIn("navi", alias_to_team_id.values())

    def test_2016_teamcard_and_prizepool_parse(self) -> None:
        wikitext = load_cached_wikitext(2016)
        prize_pool_usd = parse_number(load_cached_prizepool(2016))
        participants, alias_to_team_id, players, rosters, teams = parse_participants(wikitext, self.seed_teams)
        placements = parse_placements(wikitext, prize_pool_usd, alias_to_team_id, teams, participants)
        if len(placements) < 16:
            placements = parse_placements_from_html(load_cached_html(2016), teams, participants, self.seed_teams)

        wings_roster = [row for row in rosters if row["team_id"] == "wings"]
        self.assertGreaterEqual(len(participants), 16)
        self.assertEqual(len(placements), 16)
        self.assertEqual(sum(1 for row in placements if row["rank"] == 1), 1)
        self.assertGreaterEqual(len(wings_roster), 5)
        self.assertTrue(any(player["handle"] == "shadow" for player in players))

    def test_2025_excludes_former_participants(self) -> None:
        wikitext = load_cached_wikitext(2025)
        participants, _, _, rosters, teams = parse_participants(wikitext, self.seed_teams)
        team_ids = {row["team_id"] for row in participants}

        self.assertEqual(len(participants), 16)
        self.assertNotIn("gaimin-gladiators", team_ids)
        self.assertIn("yakutou-brothers", team_ids)
        self.assertIn("team-falcons", teams)
        self.assertTrue(any(row["role"] == "教练" for row in rosters if row["team_id"] == "team-falcons"))

    def test_2020_cancelled_entry(self) -> None:
        tournament = build_cancelled_2020(self.seed_tournaments.get(2020))
        self.assertEqual(tournament["status"], "cancelled")
        self.assertEqual(tournament["year"], 2020)
        self.assertEqual(tournament["champion_team_id"], "")


if __name__ == "__main__":
    unittest.main()
