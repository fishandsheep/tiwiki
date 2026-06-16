from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))
from constants import TEAMS_JSON, TOURNAMENTS_JSON, YEARS, compact
from fetch import WikiFetcher
from load import upsert_dataset
from parse import (
    SeedTeam,
    build_cancelled_2020,
    build_tournament,
    enrich_participant_media_from_html,
    parse_infobox,
    parse_number,
    parse_participants,
    parse_placements,
    parse_placements_from_html,
    parse_player_wikitext,
)


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


def resolve_media(fetcher: WikiFetcher, raw: str, kind: str, slug: str) -> tuple[str, str]:
    if not raw:
        return "", ""
    if raw.startswith("/media/"):
        return raw, ""
    try:
        source = raw if raw.startswith(("http://", "https://", "//", "/")) else fetcher.resolve_image_url(raw)
        return fetcher.download_media(source, kind, slug)
    except Exception as exc:  # noqa: BLE001
        print(f"warn: media fetch failed for {kind}/{slug}: {exc}", file=sys.stderr)
        return "", ""


def hydrate_media(fetcher: WikiFetcher, teams: dict[str, dict], participants: list[dict], players: list[dict], rosters: list[dict]) -> None:
    for participant in participants:
        team = teams.get(participant["team_id"])
        raw_logo = participant.get("team_logo") or (team or {}).get("logo", "")
        logo, source = resolve_media(fetcher, raw_logo, "teams", participant["team_id"])
        if logo:
            participant["team_logo"] = logo
            participant["team_logo_source_url"] = source
            if team is not None:
                team["logo"] = logo
                team["logo_source_url"] = source

    player_by_id = {player["id"]: player for player in players}
    for roster in rosters:
        player = player_by_id.get(roster["player_id"])
        if player is None:
            continue
        if not roster.get("player_avatar") or not roster.get("player_country"):
            try:
                raw = fetcher.fetch_wikitext(player["handle"].replace(" ", "_"))
                profile = parse_player_wikitext(raw)
                roster["player_avatar"] = roster.get("player_avatar") or profile.get("avatar", "")
                roster["player_country"] = roster.get("player_country") or profile.get("country", "")
                player["avatar"] = player.get("avatar") or profile.get("avatar", "")
                player["country"] = player.get("country") or profile.get("country", "")
            except Exception as exc:  # noqa: BLE001
                print(f"warn: profile fetch failed for {player['handle']}: {exc}", file=sys.stderr)
        raw_avatar = roster.get("player_avatar") or player.get("avatar", "")
        avatar, source = resolve_media(fetcher, raw_avatar, "players", roster["player_id"])
        if avatar:
            roster["player_avatar"] = avatar
            roster["player_avatar_source_url"] = source
            player["avatar"] = avatar
            player["avatar_source_url"] = source
        if roster.get("player_country"):
            player["country"] = player.get("country") or roster["player_country"]


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    ensure_migrated(root)

    seed_tournaments = load_seed_tournaments()
    seed_teams = load_seed_teams()
    fetcher = WikiFetcher()

    refreshed = 0

    ti_no = 1
    for year in YEARS:
        if year == 2020:
            tournament = build_cancelled_2020(seed_tournaments.get(year))
            upsert_dataset(
                tournaments=[tournament],
                teams=[],
                players=[],
                participants_by_tournament={tournament["id"]: []},
                placements_by_tournament={tournament["id"]: []},
                rosters_by_tournament={tournament["id"]: []},
            )
            refreshed += 1
            print(f"refreshed {tournament['id']} ({year})")
            continue

        print(f"fetching TI{ti_no} ({year})")
        wikitext = fetcher.fetch_wikitext(f"The International/{year}")
        if not wikitext:
            print(f"skip {year}: no wikitext", file=sys.stderr)
            continue

        info = parse_infobox(wikitext)
        prize_pool_usd = fetch_prize_pool(fetcher, year)
        participants, alias_to_team_id, players, rosters, teams = parse_participants(wikitext, seed_teams)
        placements = parse_placements(wikitext, prize_pool_usd, alias_to_team_id, teams, participants)
        html = ""
        participant_count = unique_team_count(participants)
        placement_count = unique_team_count(placements)
        if placement_count < participant_count:
            html = fetcher.fetch_parsed_html(f"The International/{year}")
            html_placements = parse_placements_from_html(html, teams, participants, seed_teams)
            if unique_team_count(html_placements) >= placement_count:
                placements = html_placements
        if not html:
            html = fetcher.fetch_parsed_html(f"The International/{year}")
        enrich_participant_media_from_html(html, teams, participants)
        hydrate_media(fetcher, teams, participants, players, rosters)
        tournament = build_tournament(year, ti_no, prize_pool_usd, info, placements, seed_tournaments.get(year))

        upsert_dataset(
            tournaments=[tournament],
            teams=list(teams.values()),
            players=players,
            participants_by_tournament={tournament["id"]: participants},
            placements_by_tournament={tournament["id"]: placements},
            rosters_by_tournament={tournament["id"]: rosters},
        )
        refreshed += 1
        print(
            f"refreshed {tournament['id']} ({year}): "
            f"{len(participants)} teams, {len(rosters)} roster rows, {len(placements)} placements"
        )
        ti_no += 1

    print(f"refreshed {refreshed} tournaments into local sqlite")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
