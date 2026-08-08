from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.append(str(ROOT / "scripts" / "crawler"))

from parse import build_cancelled_2020, parse_infobox, parse_participants, parse_placements, parse_placements_from_html, parse_number  # noqa: E402
from refresh import load_seed_teams, load_seed_tournaments  # noqa: E402
from load import canonical_team_id  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"


def read_fixture_json(name: str) -> dict:
    path = FIXTURES / name
    if not path.exists():
        raise AssertionError(f"missing committed crawler fixture: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_cached_wikitext(year: int) -> str:
    payload = read_fixture_json(f"liquipedia-The_International_{year}.json")
    return payload["query"]["pages"][0]["revisions"][0]["slots"]["main"]["content"]


def load_cached_html(year: int) -> str:
    payload = read_fixture_json(f"liquipedia-parse-The_International_{year}.json")
    return payload["parse"]["text"]["*"]


def load_cached_prizepool(year: int) -> str:
    payload = read_fixture_json(f"liquipedia-The_International_{year}_prizepool.json")
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
        self.assertTrue(all(player.get("homepage_url", "").startswith("https://liquipedia.net/dota2/") for player in players))
        self.assertTrue(all("team_logo" not in row and "team_logo_source_url" not in row for row in participants))
        self.assertTrue(all("player_avatar" not in row and "player_avatar_source_url" not in row for row in rosters))

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

    def test_2026_parses_participants_without_final_placements(self) -> None:
        wikitext = load_cached_wikitext(2026)
        prize_pool_usd = parse_number(load_cached_prizepool(2026))
        participants, alias_to_team_id, players, rosters, teams = parse_participants(wikitext, self.seed_teams)
        placements = parse_placements(wikitext, prize_pool_usd, alias_to_team_id, teams, participants)

        self.assertEqual(len(participants), 16)
        self.assertGreaterEqual(len(players), 80)
        self.assertGreaterEqual(len(rosters), 80)
        self.assertEqual(len(placements), 0)
        self.assertIn("xtreme-gaming", teams)
        self.assertIn("team-resilience", teams)
        self.assertTrue(any(row["role"] == "教练" for row in rosters if row["team_id"] == "xtreme-gaming"))
        self.assertTrue(any(player["handle"] == "Corrupted" and player["liquipedia_url"].endswith("/Vazya") for player in players))
        self.assertTrue(any(row["role"] == "助理教练" for row in rosters if row["team_id"] == "lgd-gaming"))

    def test_current_table2_prize_pool_html_parses(self) -> None:
        html = """
        <table class="prizepooltable prizepooltable-placement">
          <tr class="prizepooltable-header"><th>Place</th><th>Participant</th><th>USD</th></tr>
          <tr class="table2__row--body">
            <td class="prizepooltable-place"><span>1</span></td>
            <td class="prizepooltable-col-team"><span class="block-team"><span class="name"><a title="Team Spirit">Team Spirit</a></span></span></td>
            <td data-align="right">$1,000,000</td>
          </tr>
          <tr class="table2__row--body">
            <td class="prizepooltable-place"><span>2</span></td>
            <td class="prizepooltable-col-team"><span class="block-team"><span class="name"><a title="PSG.LGD">PSG.LGD</a></span></span></td>
            <td data-align="right">$500,000</td>
          </tr>
        </table>
        """
        teams = {
            "team-spirit": {"name": "Team Spirit", "name_zh": "Team Spirit", "region": "欧洲"},
            "psglgd": {"name": "PSG.LGD", "name_zh": "PSG.LGD", "region": "中国"},
        }
        participants = [
            {"team_id": "team-spirit", "region": "欧洲"},
            {"team_id": "psglgd", "region": "中国"},
        ]

        placements = parse_placements_from_html(html, teams, participants, self.seed_teams)

        self.assertEqual([(row["team_id"], row["rank"], row["prize_usd"]) for row in placements], [
            ("team-spirit", 1, 1000000),
            ("psglgd", 2, 500000),
        ])

    def test_persisted_aliases_normalize_historical_team_ids(self) -> None:
        aliases = {
            "made-in-thailand": "mith-trust",
            "mortal teamwork": "mtw",
        }
        self.assertEqual(canonical_team_id("made-in-thailand", "Made in Thailand", aliases), "mith-trust")
        self.assertEqual(canonical_team_id("mortal-teamwork", "Mortal Teamwork", aliases), "mtw")
        self.assertEqual(canonical_team_id("wings", "Wings Gaming", aliases), "wings")

    def test_exact_team_name_wins_over_colliding_initials(self) -> None:
        html = """
        <table class="prizepooltable-placement">
          <tr class="prizepooltable-header"><th>Place</th><th>Participant</th></tr>
          <tr class="table2__row--body">
            <td class="prizepooltable-place">1</td>
            <td class="prizepooltable-col-team"><span class="block-team"><span class="name"><a title="OG">OG</a></span></span></td>
            <td data-align="right">$1</td>
          </tr>
        </table>
        """
        teams = {
            "og": {"name": "OG", "name_zh": "OG", "region": "欧洲"},
            "optic": {"name": "OpTic Gaming", "name_zh": "OpTic Gaming", "region": "北美"},
        }
        placements = parse_placements_from_html(html, teams, [], self.seed_teams)
        self.assertEqual(placements[0]["team_id"], "og")

    def test_2020_cancelled_entry(self) -> None:
        tournament = build_cancelled_2020(self.seed_tournaments.get(2020))
        self.assertEqual(tournament["status"], "cancelled")
        self.assertEqual(tournament["year"], 2020)
        self.assertEqual(tournament["champion_team_id"], "")


if __name__ == "__main__":
    unittest.main()
