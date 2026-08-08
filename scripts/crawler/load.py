from __future__ import annotations

import sqlite3
import sys
import json
from datetime import datetime, timezone
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))
from constants import DB_PATH

OVERRIDABLE_TOURNAMENT_FIELDS = {
    "start_date": "start_date",
    "end_date": "end_date",
    "country": "country",
    "city": "city",
    "venue": "venue",
    "prize_pool_usd": "prize_pool_usd",
    "champion_team_id": "champion_team_id",
    "runner_up_team_id": "runner_up_team_id",
}


def canonical_team_id(team_id: str, team_name: str, aliases: dict[str, str]) -> str:
    return aliases.get(team_id.strip().lower()) or aliases.get(team_name.strip().lower()) or team_id


def connect_db(db_path: Path = DB_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def upsert_dataset(tournaments: list[dict], teams: list[dict], players: list[dict], participants_by_tournament: dict[str, list[dict]], placements_by_tournament: dict[str, list[dict]], rosters_by_tournament: dict[str, list[dict]], db_path: Path = DB_PATH) -> None:
    now = datetime.now(timezone.utc).isoformat()
    conn = connect_db(db_path)
    cur = conn.cursor()
    team_aliases = {
        str(alias).strip().lower(): str(team_id)
        for alias, team_id in cur.execute("SELECT alias, team_id FROM team_aliases").fetchall()
    }

    for team in teams:
        if canonical_team_id(team["id"], team["name"], team_aliases) != team["id"]:
            continue
        cur.execute(
            """
            INSERT INTO teams (id, name, name_zh, region, country, logo, logo_source_url, description_zh, liquipedia_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              name_zh = CASE WHEN teams.name_zh IS NOT NULL AND teams.name_zh != '' THEN teams.name_zh ELSE excluded.name_zh END,
              region = COALESCE(NULLIF(teams.region, ''), excluded.region),
              country = COALESCE(NULLIF(teams.country, ''), excluded.country),
              logo = CASE
                WHEN excluded.logo LIKE '/media/%' THEN excluded.logo
                ELSE COALESCE(NULLIF(teams.logo, ''), excluded.logo)
              END,
              logo_source_url = CASE
                WHEN excluded.logo LIKE '/media/%' THEN excluded.logo_source_url
                ELSE COALESCE(NULLIF(teams.logo_source_url, ''), excluded.logo_source_url)
              END,
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
            INSERT INTO players (id, handle, real_name, country, region, avatar, avatar_source_url, position, homepage_url, liquipedia_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
              homepage_url = COALESCE(NULLIF(players.homepage_url, ''), excluded.homepage_url),
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
                player.get("homepage_url", player.get("liquipedia_url", "")),
                player["liquipedia_url"],
            ),
        )

    for tournament in tournaments:
        tournament["champion_team_id"] = canonical_team_id(
            tournament.get("champion_team_id", ""), "", team_aliases
        )
        tournament["runner_up_team_id"] = canonical_team_id(
            tournament.get("runner_up_team_id", ""), "", team_aliases
        )
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
                tournament.get("_fetched_at", now),
            ),
        )

        for field_name, column in OVERRIDABLE_TOURNAMENT_FIELDS.items():
            observed_value_json = json.dumps(tournament.get(column), ensure_ascii=False, separators=(",", ":"))
            existing = cur.execute(
                """
                SELECT value_json, verification_status
                FROM field_provenance
                WHERE entity_type = 'tournament' AND entity_id = ? AND field_name = ?
                  AND source_kind = 'liquipedia' AND source_url = ?
                """,
                (tournament["id"], field_name, tournament["liquipedia_url"]),
            ).fetchone()
            conflict = bool(
                existing
                and existing[1] == "verified"
                and existing[0] is not None
                and existing[0] != observed_value_json
            )
            value_json = existing[0] if conflict else observed_value_json
            verification_status = "pending" if conflict else (existing[1] if existing else "single-source")
            cur.execute(
                """
                INSERT INTO field_provenance (
                  entity_type, entity_id, field_name, source_kind, source_url,
                  source_revision, fetched_at, verification_status, value_json, observed_value_json, note
                ) VALUES ('tournament', ?, ?, 'liquipedia', ?, ?, ?, ?, ?, ?, 'Parsed and normalized from upstream wikitext by crawler-v2')
                ON CONFLICT(entity_type, entity_id, field_name, source_kind, source_url)
                DO UPDATE SET
                  source_revision = excluded.source_revision,
                  fetched_at = excluded.fetched_at,
                  verification_status = excluded.verification_status,
                  value_json = excluded.value_json,
                  observed_value_json = excluded.observed_value_json,
                  note = excluded.note
                """,
                (
                    tournament["id"],
                    field_name,
                    tournament["liquipedia_url"],
                    tournament.get("_source_revision", ""),
                    tournament.get("_fetched_at", now),
                    verification_status,
                    value_json,
                    observed_value_json,
                ),
            )
            if conflict:
                cur.execute(
                    f'UPDATE tournaments SET "{column}" = ? WHERE id = ?',
                    (json.loads(value_json), tournament["id"]),
                )

        overrides = cur.execute(
            """
            SELECT field_name, value_json, reason, source_url, updated_at
            FROM field_overrides
            WHERE entity_type = 'tournament' AND entity_id = ?
            """,
            (tournament["id"],),
        ).fetchall()
        for field_name, value_json, reason, source_url, updated_at in overrides:
            column = OVERRIDABLE_TOURNAMENT_FIELDS.get(field_name)
            if not column:
                continue
            value = json.loads(value_json)
            cur.execute(f'UPDATE tournaments SET "{column}" = ? WHERE id = ?', (value, tournament["id"]))
            cur.execute(
                """
                INSERT INTO field_provenance (
                  entity_type, entity_id, field_name, source_kind, source_url,
                  fetched_at, verification_status, note, value_json, observed_value_json
                ) VALUES ('tournament', ?, ?, 'curated', ?, ?, 'verified', ?, ?, ?)
                ON CONFLICT(entity_type, entity_id, field_name, source_kind, source_url)
                DO UPDATE SET fetched_at = excluded.fetched_at, verification_status = 'verified',
                  note = excluded.note, value_json = excluded.value_json,
                  observed_value_json = excluded.observed_value_json
                """,
                (tournament["id"], field_name, source_url, updated_at, reason, value_json, value_json),
            )

        cur.execute("DELETE FROM rosters WHERE tournament_id = ?", (tournament["id"],))
        cur.execute("DELETE FROM placements WHERE tournament_id = ?", (tournament["id"],))
        cur.execute("DELETE FROM participants WHERE tournament_id = ?", (tournament["id"],))

        final_team_ids = {
            canonical_team_id(row["team_id"], row.get("team_name", ""), team_aliases)
            for row in placements_by_tournament.get(tournament["id"], [])
        }
        seen_participants = set()
        for participant in participants_by_tournament.get(tournament["id"], []):
            participant_team_id = canonical_team_id(
                participant["team_id"], participant.get("team_name", ""), team_aliases
            )
            if final_team_ids and participant_team_id not in final_team_ids:
                continue
            if participant_team_id in seen_participants:
                continue
            seen_participants.add(participant_team_id)
            cur.execute(
                """
                INSERT INTO participants (tournament_id, team_id, display_name, region, country, invite_type, seed)
                VALUES (?, ?, ?, ?, ?, ?, '')
                """,
                (
                    tournament["id"],
                    participant_team_id,
                    participant.get("team_name", ""),
                    participant["region"],
                    participant["country"],
                    participant["invite_type"],
                ),
            )

        seen_placements = set()
        for placement in placements_by_tournament.get(tournament["id"], []):
            placement_team_id = canonical_team_id(
                placement["team_id"], placement.get("team_name", ""), team_aliases
            )
            placement_key = (tournament["id"], placement_team_id)
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
                    placement_team_id,
                    placement["rank"],
                    placement["prize_usd"],
                    1 if placement["is_china_team"] else 0,
                ),
            )

        seen = set()
        for roster in rosters_by_tournament.get(tournament["id"], []):
            roster_team_id = canonical_team_id(roster["team_id"], "", team_aliases)
            if final_team_ids and roster_team_id not in final_team_ids:
                continue
            key = (tournament["id"], roster_team_id, roster["player_id"], roster["role"])
            if key in seen:
                continue
            seen.add(key)
            cur.execute(
                """
                INSERT OR IGNORE INTO rosters (
                  tournament_id, team_id, player_id, role, player_country
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    tournament["id"],
                    roster_team_id,
                    roster["player_id"],
                    roster["role"],
                    roster.get("player_country", ""),
                ),
            )

    conn.commit()
    conn.close()
