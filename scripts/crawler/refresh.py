from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))
from constants import TEAMS_JSON, TOURNAMENTS_JSON, YEARS, compact
from fetch import WikiFetcher
from load import upsert_dataset
from parse import SeedTeam, build_cancelled_2020, build_tournament, parse_infobox, parse_number, parse_participants, parse_placements, parse_placements_from_html


def load_seed_tournaments() -> dict[int, dict]:
    payload = json.loads(TOURNAMENTS_JSON.read_text(encoding="utf-8"))
    return {item["year"]: item for item in payload}


def load_seed_teams() -> dict[str, SeedTeam]:
    payload = json.loads(TEAMS_JSON.read_text(encoding="utf-8"))
    result: dict[str, SeedTeam] = {}
    for item in payload:
        seed = SeedTeam(
            id=item["id"],
            name=item["name"],
            name_zh=item.get("nameZh", item["name"]),
            region=item.get("region", ""),
            country=item.get("country", ""),
            description_zh=item.get("descriptionZh", ""),
        )
        result[compact(item["name"])] = seed
        result[compact(item.get("nameZh", ""))] = seed
    return result


def fetch_prize_pool(fetcher: WikiFetcher, year: int) -> int:
    raw = fetcher.fetch_wikitext(f"The International/{year}/prizepool")
    return parse_number(raw)


def ensure_migrated(root: Path) -> None:
    subprocess.run(["npm", "run", "db:migrate"], cwd=root, check=True)


def unique_team_count(rows: list[dict]) -> int:
    return len({row["team_id"] for row in rows})


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    ensure_migrated(root)

    seed_tournaments = load_seed_tournaments()
    seed_teams = load_seed_teams()
    fetcher = WikiFetcher()

    tournaments: list[dict] = []
    all_teams: dict[str, dict] = {}
    all_players: dict[str, dict] = {}
    participants_by_tournament: dict[str, list[dict]] = {}
    placements_by_tournament: dict[str, list[dict]] = {}
    rosters_by_tournament: dict[str, list[dict]] = {}

    ti_no = 1
    for year in YEARS:
        if year == 2020:
            tournament = build_cancelled_2020(seed_tournaments.get(year))
            tournaments.append(tournament)
            participants_by_tournament[tournament["id"]] = []
            placements_by_tournament[tournament["id"]] = []
            rosters_by_tournament[tournament["id"]] = []
            continue

        wikitext = fetcher.fetch_wikitext(f"The International/{year}")
        if not wikitext:
            print(f"skip {year}: no wikitext", file=sys.stderr)
            continue

        info = parse_infobox(wikitext)
        prize_pool_usd = fetch_prize_pool(fetcher, year)
        participants, alias_to_team_id, players, rosters, teams = parse_participants(wikitext, seed_teams)
        placements = parse_placements(wikitext, prize_pool_usd, alias_to_team_id, teams, participants)
        participant_count = unique_team_count(participants)
        placement_count = unique_team_count(placements)
        if placement_count < participant_count:
            html = fetcher.fetch_parsed_html(f"The International/{year}")
            html_placements = parse_placements_from_html(html, teams, participants, seed_teams)
            if unique_team_count(html_placements) >= placement_count:
                placements = html_placements
        tournament = build_tournament(year, ti_no, prize_pool_usd, info, placements, seed_tournaments.get(year))

        tournaments.append(tournament)
        participants_by_tournament[tournament["id"]] = participants
        placements_by_tournament[tournament["id"]] = placements
        rosters_by_tournament[tournament["id"]] = rosters

        for team_id, team in teams.items():
            all_teams[team_id] = team
        for player in players:
            all_players[player["id"]] = player
        ti_no += 1

    upsert_dataset(
        tournaments=tournaments,
        teams=list(all_teams.values()),
        players=list(all_players.values()),
        participants_by_tournament=participants_by_tournament,
        placements_by_tournament=placements_by_tournament,
        rosters_by_tournament=rosters_by_tournament,
    )
    print(f"refreshed {len(tournaments)} tournaments into local sqlite")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
