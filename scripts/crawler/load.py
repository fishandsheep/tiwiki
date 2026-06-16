from __future__ import annotations

import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))
from constants import DB_PATH


def connect_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def upsert_dataset(tournaments: list[dict], teams: list[dict], players: list[dict], participants_by_tournament: dict[str, list[dict]], placements_by_tournament: dict[str, list[dict]], rosters_by_tournament: dict[str, list[dict]]) -> None:
    now = datetime.now(timezone.utc).isoformat()
    conn = connect_db()
    cur = conn.cursor()

    for team in teams:
        cur.execute(
            """
            INSERT INTO teams (id, name, name_zh, region, country, logo, logo_source_url, description_zh, liquipedia_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              name_zh = CASE WHEN teams.name_zh IS NOT NULL AND teams.name_zh != '' THEN teams.name_zh ELSE excluded.name_zh END,
              region = COALESCE(NULLIF(teams.region, ''), excluded.region),
              country = COALESCE(NULLIF(teams.country, ''), excluded.country),
              logo = COALESCE(NULLIF(excluded.logo, ''), teams.logo),
              logo_source_url = COALESCE(NULLIF(excluded.logo_source_url, ''), teams.logo_source_url),
              description_zh = CASE WHEN teams.description_zh IS NOT NULL AND teams.description_zh != '' THEN teams.description_zh ELSE excluded.description_zh END,
              liquipedia_url = excluded.liquipedia_url
            """,
            (
                team["id"],
                team["name"],
                team["name_zh"],
                team["region"],
                team["country"],
                team.get("logo", ""),
                team.get("logo_source_url", ""),
                team["description_zh"],
                team["liquipedia_url"],
            ),
        )

    for player in players:
        cur.execute(
            """
            INSERT INTO players (id, handle, real_name, country, region, avatar, avatar_source_url, position, liquipedia_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              handle = excluded.handle,
              real_name = COALESCE(NULLIF(players.real_name, ''), excluded.real_name),
              country = COALESCE(NULLIF(players.country, ''), excluded.country),
              region = COALESCE(NULLIF(players.region, ''), excluded.region),
              avatar = CASE
                WHEN excluded.avatar LIKE '/media/%' THEN excluded.avatar
                ELSE COALESCE(NULLIF(players.avatar, ''), excluded.avatar)
              END,
              avatar_source_url = CASE
                WHEN excluded.avatar LIKE '/media/%' THEN excluded.avatar_source_url
                ELSE COALESCE(NULLIF(players.avatar_source_url, ''), excluded.avatar_source_url)
              END,
              position = COALESCE(NULLIF(players.position, ''), excluded.position),
              liquipedia_url = excluded.liquipedia_url
            """,
            (
                player["id"],
                player["handle"],
                player["real_name"],
                player["country"],
                player["region"],
                player.get("avatar", ""),
                player.get("avatar_source_url", ""),
                player["position"],
                player["liquipedia_url"],
            ),
        )

    for tournament in tournaments:
        cur.execute(
            """
            INSERT INTO tournaments (
              id, status, ti_no, name, name_zh, year, start_date, end_date, country, city, venue,
              prize_pool_usd, champion_team_id, runner_up_team_id, summary_zh, china_summary,
              liquipedia_url, wikipedia_url, fetched_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              status = excluded.status,
              ti_no = excluded.ti_no,
              name = excluded.name,
              name_zh = CASE WHEN tournaments.name_zh IS NOT NULL AND tournaments.name_zh != '' THEN tournaments.name_zh ELSE excluded.name_zh END,
              year = excluded.year,
              start_date = excluded.start_date,
              end_date = excluded.end_date,
              country = excluded.country,
              city = excluded.city,
              venue = excluded.venue,
              prize_pool_usd = excluded.prize_pool_usd,
              champion_team_id = excluded.champion_team_id,
              runner_up_team_id = excluded.runner_up_team_id,
              summary_zh = CASE WHEN tournaments.summary_zh IS NOT NULL AND tournaments.summary_zh != '' THEN tournaments.summary_zh ELSE excluded.summary_zh END,
              china_summary = CASE WHEN tournaments.china_summary IS NOT NULL AND tournaments.china_summary != '' THEN tournaments.china_summary ELSE excluded.china_summary END,
              liquipedia_url = excluded.liquipedia_url,
              wikipedia_url = excluded.wikipedia_url,
              fetched_at = excluded.fetched_at
            """,
            (
                tournament["id"],
                tournament["status"],
                tournament["ti_no"],
                tournament["name"],
                tournament["name_zh"],
                tournament["year"],
                tournament["start_date"],
                tournament["end_date"],
                tournament["country"],
                tournament["city"],
                tournament["venue"],
                tournament["prize_pool_usd"],
                tournament["champion_team_id"],
                tournament["runner_up_team_id"],
                tournament["summary_zh"],
                tournament["china_summary"],
                tournament["liquipedia_url"],
                tournament["wikipedia_url"],
                now,
            ),
        )

        cur.execute("DELETE FROM rosters WHERE tournament_id = ?", (tournament["id"],))
        cur.execute("DELETE FROM placements WHERE tournament_id = ?", (tournament["id"],))
        cur.execute("DELETE FROM participants WHERE tournament_id = ?", (tournament["id"],))

        for participant in participants_by_tournament.get(tournament["id"], []):
            cur.execute(
                """
                INSERT INTO participants (tournament_id, team_id, region, country, team_logo, team_logo_source_url, invite_type, seed)
                VALUES (?, ?, ?, ?, ?, ?, ?, '')
                """,
                (
                    tournament["id"],
                    participant["team_id"],
                    participant["region"],
                    participant["country"],
                    participant.get("team_logo", ""),
                    participant.get("team_logo_source_url", ""),
                    participant["invite_type"],
                ),
            )

        seen_placements = set()
        for placement in placements_by_tournament.get(tournament["id"], []):
            placement_key = (tournament["id"], placement["team_id"])
            if placement_key in seen_placements:
                continue
            seen_placements.add(placement_key)
            cur.execute(
                """
                INSERT INTO placements (tournament_id, team_id, rank, prize_usd, is_china_team)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    tournament["id"],
                    placement["team_id"],
                    placement["rank"],
                    placement["prize_usd"],
                    1 if placement["is_china_team"] else 0,
                ),
            )

        seen = set()
        for roster in rosters_by_tournament.get(tournament["id"], []):
            key = (tournament["id"], roster["team_id"], roster["player_id"], roster["role"])
            if key in seen:
                continue
            seen.add(key)
            cur.execute(
                """
                INSERT OR IGNORE INTO rosters (
                  tournament_id, team_id, player_id, role,
                  player_avatar, player_avatar_source_url, player_country
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    tournament["id"],
                    roster["team_id"],
                    roster["player_id"],
                    roster["role"],
                    roster.get("player_avatar", ""),
                    roster.get("player_avatar_source_url", ""),
                    roster.get("player_country", ""),
                ),
            )

    conn.commit()
    conn.close()
