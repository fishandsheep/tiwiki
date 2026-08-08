from __future__ import annotations

import argparse
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

sys.path.append(str(Path(__file__).resolve().parent))
from constants import DB_PATH, TEAMS_JSON, TOURNAMENTS_JSON, YEARS, compact
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
    parse_player_profile,
    parse_placements,
    parse_placements_from_html,
    parse_team_wikitext,
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


def ensure_migrated(root: Path, db_path: Path) -> None:
    env = os.environ.copy()
    env["TIWIKI_DB_PATH"] = str(db_path)
    subprocess.run(["npm", "run", "db:migrate"], cwd=root, check=True, env=env)


def validate_static_snapshot_and_replace(root: Path, candidate: Path, destination: Path) -> None:
    env = os.environ.copy()
    env["TIWIKI_DB_PATH"] = str(candidate)
    subprocess.run(["npx", "tsx", "scripts/db/audit.ts", str(candidate)], cwd=root, check=True, env=env)
    subprocess.run(["npm", "run", "generate"], cwd=root, check=True, env=env)
    subprocess.run(["npm", "run", "verify:static"], cwd=root, check=True, env=env)
    os.replace(candidate, destination)


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
        if team and (not team.get("logo") or not team.get("region") or not team.get("country")):
            try:
                raw = fetcher.fetch_wikitext(team["name"].replace(" ", "_"))
                profile = parse_team_wikitext(raw)
                team["logo"] = team.get("logo") or profile.get("image", "")
                team["region"] = team.get("region") or profile.get("region", "")
                team["country"] = team.get("country") or profile.get("country", "")
            except Exception as exc:  # noqa: BLE001
                print(f"warn: team profile fetch failed for {team['name']}: {exc}", file=sys.stderr)
        raw_logo = (team or {}).get("logo", "")
        logo, source = resolve_media(fetcher, raw_logo, "teams", participant["team_id"])
        if team is not None and source:
            team["logo"] = logo
            team["logo_source_url"] = source

    player_by_id = {player["id"]: player for player in players}
    for roster in rosters:
        player = player_by_id.get(roster["player_id"])
        if player is None:
            continue
        if not player.get("avatar") or (not roster.get("player_country") and not player.get("country")):
            try:
                title = player.get("liquipedia_url", "").rsplit("/", 1)[-1] or player["handle"].replace(" ", "_")
                raw = fetcher.fetch_wikitext(title)
                profile = parse_player_wikitext(raw)
                roster["player_country"] = roster.get("player_country") or profile.get("country", "")
                player["avatar"] = player.get("avatar") or profile.get("avatar", "")
                player["country"] = player.get("country") or profile.get("country", "")
                if not player.get("avatar") or not roster.get("player_country"):
                    html = fetcher.fetch_parsed_html(title)
                    html_profile = parse_player_profile(html)
                    roster["player_country"] = roster.get("player_country") or html_profile.get("country", "")
                    player["avatar"] = player.get("avatar") or html_profile.get("avatar", "")
                    player["country"] = player.get("country") or html_profile.get("country", "")
            except Exception as exc:  # noqa: BLE001
                print(f"warn: profile fetch failed for {player['handle']}: {exc}", file=sys.stderr)
        raw_avatar = player.get("avatar", "")
        avatar, source = resolve_media(fetcher, raw_avatar, "players", roster["player_id"])
        if source:
            player["avatar"] = avatar
            player["avatar_source_url"] = source
        player["country"] = player.get("country") or roster.get("player_country", "")
        roster["player_country"] = roster.get("player_country") or player.get("country", "")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refresh TiWiki through a validated temporary database")
    parser.add_argument("--year", type=int, action="append", choices=YEARS, help="refresh only selected year; repeatable")
    parser.add_argument("--offline", action="store_true", help="read committed/local fixtures only; never use network")
    parser.add_argument("--resume-cache", action="store_true", help="resume one interrupted refresh from already fetched snapshots")
    parser.add_argument("--review-media", action="store_true", help="download unverified media into data/media-review; never publish it")
    return parser.parse_args(argv)


def record_refresh_run(db_path: Path, revisions: dict[int, str], refreshed: int) -> None:
    now = datetime.now(timezone.utc).isoformat()
    manifest = {"years": sorted(revisions), "revisions": revisions, "tournaments": refreshed}
    conn = sqlite3.connect(db_path)
    try:
        conn.execute(
            """
            INSERT INTO refresh_runs (
              id, started_at, completed_at, source_revision, parser_version, status, manifest_json
            ) VALUES (?, ?, ?, ?, ?, 'passed', ?)
            """,
            (
                str(uuid4()),
                now,
                now,
                ",".join(value for value in revisions.values() if value),
                "crawler-v2",
                json.dumps(manifest, ensure_ascii=False, sort_keys=True),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    root = Path(__file__).resolve().parents[2]
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary_name = tempfile.mkstemp(prefix="ti-refresh-", suffix=".db", dir=DB_PATH.parent)
    os.close(handle)
    temporary_db = Path(temporary_name)
    shutil.copy2(DB_PATH, temporary_db)

    seed_tournaments = load_seed_tournaments()
    seed_teams = load_seed_teams()
    if args.offline and args.resume_cache:
        raise ValueError("--offline and --resume-cache are mutually exclusive")
    fetcher = WikiFetcher(cache_mode="offline" if args.offline else "resume" if args.resume_cache else "refresh")

    refreshed = 0
    revisions: dict[int, str] = {}
    selected_years = set(args.year or YEARS)

    try:
        ensure_migrated(root, temporary_db)
        for year in YEARS:
            if year not in selected_years:
                continue
            if year == 2020:
                tournament = build_cancelled_2020(seed_tournaments.get(year))
                upsert_dataset(
                    tournaments=[tournament],
                    teams=[],
                    players=[],
                    participants_by_tournament={tournament["id"]: []},
                    placements_by_tournament={tournament["id"]: []},
                    rosters_by_tournament={tournament["id"]: []},
                    db_path=temporary_db,
                )
                refreshed += 1
                revisions[year] = "cancelled"
                print(f"refreshed {tournament['id']} ({year})")
                continue

            ti_no = [candidate for candidate in YEARS if candidate != 2020].index(year) + 1
            print(f"fetching TI{ti_no} ({year})")
            wikitext, source_meta = fetcher.fetch_wikitext_with_meta(f"The International/{year}")
            if not wikitext:
                raise RuntimeError(f"no wikitext for {year}")

            fetched_at = source_meta.get("fetched_at") or datetime.now(timezone.utc).isoformat()
            revisions[year] = source_meta.get("revision", "")
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
            if args.review_media:
                if not html:
                    html = fetcher.fetch_parsed_html(f"The International/{year}")
                enrich_participant_media_from_html(html, teams, participants)
                hydrate_media(fetcher, teams, participants, players, rosters)
            tournament = build_tournament(year, ti_no, prize_pool_usd, info, placements, seed_tournaments.get(year))
            tournament["_fetched_at"] = fetched_at
            tournament["_source_revision"] = source_meta.get("revision", "")

            upsert_dataset(
                tournaments=[tournament],
                teams=list(teams.values()),
                players=players,
                participants_by_tournament={tournament["id"]: participants},
                placements_by_tournament={tournament["id"]: placements},
                rosters_by_tournament={tournament["id"]: rosters},
                db_path=temporary_db,
            )
            refreshed += 1
            print(
                f"refreshed {tournament['id']} ({year}): "
                f"{len(participants)} teams, {len(rosters)} roster rows, {len(placements)} placements"
            )

        if refreshed != len(selected_years):
            raise RuntimeError(f"refreshed {refreshed} of {len(selected_years)} requested tournaments")
        record_refresh_run(temporary_db, revisions, refreshed)
        validate_static_snapshot_and_replace(root, temporary_db, DB_PATH)
        print(f"atomically replaced local sqlite after refreshing {refreshed} tournaments")
        return 0
    finally:
        temporary_db.unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())
