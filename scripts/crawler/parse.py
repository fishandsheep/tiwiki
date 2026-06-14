from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import mwparserfromhell
from bs4 import BeautifulSoup

sys.path.append(str(Path(__file__).resolve().parent))
from constants import CHINA_TEAM_ALIASES, COMMON_WORDS, compact, slugify, strip_code


@dataclass
class SeedTeam:
    id: str
    name: str
    name_zh: str
    region: str
    country: str
    description_zh: str


def clean_template_name(template: Any) -> str:
    return str(template.name).strip().lower().replace("_", " ")


def get_param(template: Any, name: str, default: str = "") -> str:
    if template.has(name):
        return strip_code(str(template.get(name).value))
    return default


def parse_number(value: str) -> int:
    digits = re.sub(r"[^0-9]", "", value)
    return int(digits) if digits else 0


def sanitize_wikitext(wikitext: str) -> str:
    # Hide collapsed/archive sections marked out of LPDB parsing, like former participants.
    wikitext = re.sub(r"\{\{LPDB storage\|false\}\}.*?\{\{LPDB storage\|true\}\}", "", wikitext, flags=re.S)
    return wikitext


def prize_value_from_slot(raw_value: str, prize_pool_usd: int) -> int:
    match = re.search(r"\*\s*([0-9.]+)\s*round", raw_value)
    if match:
        return int(round(prize_pool_usd * float(match.group(1))))
    plain = parse_number(strip_code(raw_value))
    if plain and "{{" not in raw_value:
        return plain
    return 0


def team_aliases(team_name: str, team_id: str, team_name_zh: str = "") -> set[str]:
    aliases = {
        compact(team_name),
        compact(team_id),
        compact(team_name_zh),
    }
    tokens = [t for t in re.split(r"[^a-zA-Z0-9]+", team_name.lower()) if t]
    if tokens:
        aliases.add("".join(tokens))
        aliases.add("".join(token[0] for token in tokens))
        if tokens[0] in COMMON_WORDS:
            aliases.add("".join(token[0] for token in tokens))
        stripped = [t for t in tokens if t not in COMMON_WORDS]
        if stripped:
            aliases.add("".join(stripped))
            aliases.add("".join(token[0] for token in stripped))
            if len(stripped) > 1 and len(stripped[0]) <= 4:
                aliases.add(stripped[0] + stripped[1][0])
    return {alias for alias in aliases if alias}


def match_existing_team_id(team_name: str, teams: dict[str, dict[str, Any]]) -> str:
    candidate_aliases = team_aliases(team_name, slugify(team_name))
    for team_id, team in teams.items():
        if candidate_aliases & team_aliases(team["name"], team_id, team.get("name_zh", "")):
            return team_id
    return ""


def resolve_team(team_name: str, seed_teams: dict[str, SeedTeam]) -> tuple[str, SeedTeam | None]:
    key = compact(team_name)
    if key in seed_teams:
        seed = seed_teams[key]
        return seed.id, seed
    return slugify(team_name), None


def infer_region(qualifier: str, seed: SeedTeam | None, team_name: str) -> str:
    qualifier_lower = qualifier.lower()
    if "china" in qualifier_lower:
        return "中国"
    if "western europe" in qualifier_lower:
        return "欧洲"
    if "eastern europe" in qualifier_lower:
        return "独联体"
    if "europe" in qualifier_lower:
        return "欧洲"
    if "americas" in qualifier_lower or "north america" in qualifier_lower:
        return "北美"
    if "south america" in qualifier_lower:
        return "南美"
    if "southeast asia" in qualifier_lower or "sea" == qualifier_lower:
        return "东南亚"
    if "cis" in qualifier_lower or "eastern europe" in qualifier_lower:
        return "独联体"
    if "wild card" in qualifier_lower:
        return seed.region if seed and seed.region else ""
    if seed and seed.region:
        return seed.region
    aliases = team_aliases(team_name, team_name)
    if aliases & CHINA_TEAM_ALIASES:
        return "中国"
    return ""


def is_china_team(team_id: str, team_name: str, region: str) -> bool:
    if region == "中国":
        return True
    aliases = team_aliases(team_name, team_id)
    return bool(aliases & CHINA_TEAM_ALIASES)


def qualification_text(raw: str) -> str:
    text = strip_code(raw)
    if text and "{{" not in raw:
        return text
    text_match = re.search(r"text\s*=\s*([^|}]+)", raw)
    if text_match:
        return strip_code(text_match.group(1))
    match = re.search(r"method\s*=\s*([a-zA-Z ]+)", raw)
    if match:
        method = match.group(1).strip().lower()
        if method == "invite":
            return "Invited"
        if method == "qual":
            return "Qualified"
        return method.title()
    return ""


def upsert_player(players: dict[str, dict[str, Any]], handle: str) -> str:
    player_id = slugify(handle)
    players[player_id] = {
        "id": player_id,
        "handle": handle,
        "real_name": "",
        "country": "",
        "region": "",
        "position": "",
        "liquipedia_url": f"https://liquipedia.net/dota2/{handle.replace(' ', '_')}",
    }
    return player_id


def parse_participants(wikitext: str, seed_teams: dict[str, SeedTeam]) -> tuple[list[dict[str, Any]], dict[str, str], list[dict[str, Any]], list[dict[str, Any]], dict[str, dict[str, Any]]]:
    code = mwparserfromhell.parse(sanitize_wikitext(wikitext))
    participants: list[dict[str, Any]] = []
    players: dict[str, dict[str, Any]] = {}
    rosters: list[dict[str, Any]] = []
    teams: dict[str, dict[str, Any]] = {}
    alias_to_team_id: dict[str, str] = {}

    for template in code.filter_templates(recursive=True):
        if clean_template_name(template) != "teamcard":
            continue
        team_name = get_param(template, "team")
        if not team_name:
            continue
        team_id, seed = resolve_team(team_name, seed_teams)
        qualifier = get_param(template, "qualifier")
        region = infer_region(qualifier, seed, team_name)
        country = seed.country if seed and seed.country else ("中国" if region == "中国" else "")
        invite_type = qualifier or "Invited"

        teams[team_id] = {
            "id": team_id,
            "name": team_name,
            "name_zh": seed.name_zh if seed and seed.name_zh else team_name,
            "region": seed.region if seed and seed.region else region,
            "country": seed.country if seed and seed.country else country,
            "logo": "",
            "description_zh": seed.description_zh if seed else "",
            "liquipedia_url": f"https://liquipedia.net/dota2/{team_name.replace(' ', '_')}",
        }
        for alias in team_aliases(team_name, team_id, teams[team_id]["name_zh"]):
            alias_to_team_id[alias] = team_id

        participants.append(
            {
                "team_id": team_id,
                "team_name": team_name,
                "region": region,
                "country": country,
                "invite_type": invite_type,
                "placement": get_param(template, "placement"),
            }
        )

        for idx in range(1, 6):
            handle = get_param(template, f"p{idx}")
            if not handle:
                continue
            player_id = upsert_player(players, handle)
            rosters.append({"team_id": team_id, "player_id": player_id, "role": f"{idx} 号位"})

        for coach_key in ("c", "c2", "coach", "coach2"):
            handle = get_param(template, coach_key)
            if not handle:
                continue
            player_id = upsert_player(players, handle)
            rosters.append({"team_id": team_id, "player_id": player_id, "role": "教练"})

        for sub_key in ("s1", "s2", "sub1", "sub2"):
            handle = get_param(template, sub_key)
            if not handle:
                continue
            player_id = upsert_player(players, handle)
            rosters.append({"team_id": team_id, "player_id": player_id, "role": "替补"})

    for template in code.filter_templates(recursive=True):
        if clean_template_name(template) != "teamparticipants":
            continue
        for param in template.params:
            nested = mwparserfromhell.parse(str(param.value)).filter_templates(recursive=True)
            opponents = [tpl for tpl in nested if clean_template_name(tpl) == "opponent"]
            if not opponents:
                continue
            opponent = opponents[0]
            team_name = strip_code(str(opponent.get(1).value)) if opponent.has(1) else ""
            if not team_name:
                continue
            team_id, seed = resolve_team(team_name, seed_teams)
            invite_type = qualification_text(str(opponent.get("qualification").value)) if opponent.has("qualification") else "Invited"
            region = infer_region(invite_type, seed, team_name)
            country = seed.country if seed and seed.country else ("中国" if region == "中国" else "")
            teams[team_id] = {
                "id": team_id,
                "name": team_name,
                "name_zh": seed.name_zh if seed and seed.name_zh else team_name,
                "region": seed.region if seed and seed.region else region,
                "country": seed.country if seed and seed.country else country,
                "logo": "",
                "description_zh": seed.description_zh if seed else "",
                "liquipedia_url": f"https://liquipedia.net/dota2/{team_name.replace(' ', '_')}",
            }
            for alias in team_aliases(team_name, team_id, teams[team_id]["name_zh"]):
                alias_to_team_id[alias] = team_id
            participants.append(
                {
                    "team_id": team_id,
                    "team_name": team_name,
                    "region": region,
                    "country": country,
                    "invite_type": invite_type or "Invited",
                    "placement": "",
                }
            )
            person_templates = []
            if opponent.has("players"):
                person_templates = [
                    tpl
                    for tpl in mwparserfromhell.parse(str(opponent.get("players").value)).filter_templates(recursive=True)
                    if clean_template_name(tpl) == "person"
                ]
            for person in person_templates:
                handle = ""
                for person_param in person.params:
                    if not str(person_param.name).strip().isdigit():
                        continue
                    handle = strip_code(str(person_param.value))
                    if handle:
                        break
                if not handle:
                    continue
                role = get_param(person, "role") or "选手"
                player_id = upsert_player(players, handle)
                if role == "coach":
                    role_label = "教练"
                elif role.isdigit():
                    role_label = f"{role} 号位"
                else:
                    role_label = role
                rosters.append({"team_id": team_id, "player_id": player_id, "role": role_label})

    return participants, alias_to_team_id, list(players.values()), rosters, teams


def parse_placements(wikitext: str, prize_pool_usd: int, alias_to_team_id: dict[str, str], teams: dict[str, dict[str, Any]], participants: list[dict[str, Any]]) -> list[dict[str, Any]]:
    code = mwparserfromhell.parse(sanitize_wikitext(wikitext))
    team_prize_pool = None
    for template in code.filter_templates(recursive=True):
        if clean_template_name(template) == "teamprizepool":
            team_prize_pool = template
            break

    if team_prize_pool is None:
        return []

    participant_by_team = {row["team_id"]: row for row in participants}
    place_to_prize: dict[str, int] = {}
    placements: list[dict[str, Any]] = []
    current_rank = 1

    slots = [
        tpl
        for tpl in mwparserfromhell.parse(str(team_prize_pool)).filter_templates(recursive=True)
        if clean_template_name(tpl) == "slot"
    ]

    for slot in slots:
        opponents: list[str] = []
        for slot_param in slot.params:
            slot_nested = mwparserfromhell.parse(str(slot_param.value)).filter_templates(recursive=True)
            for tpl in slot_nested:
                if clean_template_name(tpl) == "opponent":
                    raw_alias = strip_code(str(tpl.get(1).value)) if tpl.has(1) else ""
                    if raw_alias:
                        opponents.append(raw_alias)
        if not opponents:
            place = get_param(slot, "place")
            if place:
                place_to_prize[place] = prize_value_from_slot(
                    str(slot.get("usdprize").value) if slot.has("usdprize") else "", prize_pool_usd
                )
            continue

        prize_usd = prize_value_from_slot(str(slot.get("usdprize").value) if slot.has("usdprize") else "", prize_pool_usd)
        seen = 0
        for alias in opponents:
            key = compact(alias)
            team_id = alias_to_team_id.get(key) or match_existing_team_id(alias, teams)
            if not team_id:
                continue
            team = teams[team_id]
            participant = participant_by_team.get(team_id)
            placements.append(
                {
                    "team_id": team_id,
                    "team_name": team["name"],
                    "rank": current_rank,
                    "prize_usd": prize_usd,
                    "is_china_team": is_china_team(team_id, team["name"], participant["region"] if participant else team["region"]),
                }
            )
            seen += 1
        current_rank += max(seen, len(opponents))

    if placements:
        return placements

    for participant in participants:
        place = participant.get("placement", "")
        if not place:
            continue
        rank = int(place.split("-")[0]) if re.match(r"^\d+", place) else 0
        if not rank:
            continue
        team = teams[participant["team_id"]]
        placements.append(
            {
                "team_id": participant["team_id"],
                "team_name": team["name"],
                "rank": rank,
                "prize_usd": place_to_prize.get(place, place_to_prize.get(str(rank), 0)),
                "is_china_team": is_china_team(participant["team_id"], team["name"], participant["region"]),
            }
        )

    return placements


def parse_placements_from_html(html: str, teams: dict[str, dict[str, Any]], participants: list[dict[str, Any]], seed_teams: dict[str, SeedTeam]) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    candidates = []
    for candidate in soup.select(".prizepooltable-placement"):
        header = candidate.select_one(".prizepooltable-header")
        rows = candidate.select(".csstable-widget-row")
        header_text = header.get_text(" ", strip=True) if header else ""
        if "Participant" not in header_text or "Place" not in header_text:
            continue
        candidates.append((len(rows), candidate))

    if not candidates:
        return []
    _, table = max(candidates, key=lambda item: item[0])

    team_map = {participant["team_id"]: participant for participant in participants}
    name_map: dict[str, str] = {}
    for team_id, team in teams.items():
        for alias in team_aliases(team["name"], team_id, team["name_zh"]):
            name_map[alias] = team_id

    placements: list[dict[str, Any]] = []
    for row in table.select(".csstable-widget-row"):
        cells = row.select(".csstable-widget-cell")
        if len(cells) < 4:
            continue
        place_text = cells[0].get_text(" ", strip=True)
        if not re.search(r"\d", place_text):
            continue
        rank = int(re.search(r"\d+", place_text).group())
        prize_usd = parse_number(cells[1].get_text(" ", strip=True))
        team_names: list[str] = []
        for team_cell in cells[3:]:
            names = [
                anchor.get("title", "").strip()
                for anchor in team_cell.select(".block-team .name a")
                if anchor.get("title")
            ]
            if names:
                team_names.extend(names)
                continue
            fallback_name = team_cell.get_text(" ", strip=True)
            if fallback_name and fallback_name != "Participant":
                team_names.append(fallback_name)
        for team_name in team_names:
            team_key = compact(team_name)
            team_id = name_map.get(team_key) or match_existing_team_id(team_name, teams)
            if not team_id:
                team_id, seed = resolve_team(team_name, seed_teams)
                if team_id not in teams:
                    teams[team_id] = {
                        "id": team_id,
                        "name": team_name,
                        "name_zh": seed.name_zh if seed and seed.name_zh else team_name,
                        "region": seed.region if seed and seed.region else "",
                        "country": seed.country if seed and seed.country else "",
                        "logo": "",
                        "description_zh": seed.description_zh if seed else "",
                        "liquipedia_url": f"https://liquipedia.net/dota2/{team_name.replace(' ', '_')}",
                    }
            participant = team_map.get(team_id)
            placements.append(
                {
                    "team_id": team_id,
                    "team_name": team_name,
                    "rank": rank,
                    "prize_usd": prize_usd,
                    "is_china_team": is_china_team(team_id, team_name, participant["region"] if participant else teams[team_id]["region"]),
                }
            )
    return placements


def parse_infobox(wikitext: str) -> dict[str, Any]:
    code = mwparserfromhell.parse(wikitext)
    infobox = None
    for template in code.filter_templates(recursive=True):
        if clean_template_name(template) == "infobox league":
            infobox = template
            break
    if infobox is None:
        raise ValueError("Infobox league not found")

    return {
        "name": get_param(infobox, "name"),
        "start_date": get_param(infobox, "sdate"),
        "end_date": get_param(infobox, "edate"),
        "country": get_param(infobox, "country"),
        "city": get_param(infobox, "city"),
        "venue": get_param(infobox, "venue"),
    }


def build_tournament(year: int, ti_no: int, prize_pool_usd: int, info: dict[str, Any], placements: list[dict[str, Any]], seed: dict[str, Any] | None) -> dict[str, Any]:
    champion = next((row for row in placements if row["rank"] == 1), None)
    runner_up = next((row for row in placements if row["rank"] == 2), None)
    name_zh = seed["nameZh"] if seed and seed.get("nameZh") else f"第{ti_no}届 Dota2 国际邀请赛"
    summary_zh = seed["summaryZh"] if seed and seed.get("summaryZh") else ""
    china_summary = seed["chinaSummary"] if seed and seed.get("chinaSummary") else ""
    return {
        "id": f"ti{ti_no}",
        "status": "completed",
        "ti_no": ti_no,
        "name": info["name"] or f"The International {year}",
        "name_zh": name_zh,
        "year": year,
        "start_date": info["start_date"],
        "end_date": info["end_date"],
        "country": info["country"],
        "city": info["city"],
        "venue": info["venue"],
        "prize_pool_usd": prize_pool_usd,
        "champion_team_id": champion["team_id"] if champion else "",
        "runner_up_team_id": runner_up["team_id"] if runner_up else "",
        "summary_zh": summary_zh,
        "china_summary": china_summary,
        "liquipedia_url": f"https://liquipedia.net/dota2/The_International/{year}",
        "wikipedia_url": f"https://en.wikipedia.org/wiki/The_International_{year}",
    }


def build_cancelled_2020(seed: dict[str, Any] | None) -> dict[str, Any]:
    return {
        "id": "ti2020-cancelled",
        "status": "cancelled",
        "ti_no": 0,
        "name": "The International 2020",
        "name_zh": seed["nameZh"] if seed and seed.get("nameZh") else "2020 国际邀请赛（取消）",
        "year": 2020,
        "start_date": "",
        "end_date": "",
        "country": "瑞典",
        "city": "斯德哥尔摩",
        "venue": "Ericsson Globe",
        "prize_pool_usd": 0,
        "champion_team_id": "",
        "runner_up_team_id": "",
        "summary_zh": seed["summaryZh"] if seed and seed.get("summaryZh") else "",
        "china_summary": seed["chinaSummary"] if seed and seed.get("chinaSummary") else "",
        "liquipedia_url": "https://liquipedia.net/dota2/The_International",
        "wikipedia_url": "https://en.wikipedia.org/wiki/The_International_(esports)",
    }
