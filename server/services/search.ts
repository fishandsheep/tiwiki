import { asc, eq } from 'drizzle-orm'
import { db, schema } from '../db/client'
import type { SearchEntry } from '../../shared/types/ti'
import { listTournaments } from './ti'

export async function getStaticSearchIndex(): Promise<SearchEntry[]> {
  const tournaments = await listTournaments()
  const routeById = new Map(tournaments.map((t) => [t.id, t.routeId]))
  const yearById = new Map(tournaments.map((t) => [t.id, t.year]))
  const entries: SearchEntry[] = tournaments.map((t) => ({
    id: t.id,
    kind: 'tournament',
    label: t.status === 'cancelled' ? `${t.year} 国际邀请赛（取消）` : `Ti${t.tiNo} · ${t.nameZh}`,
    description: `${t.year} · ${t.champion} · ${t.city}`,
    href: `/ti/${t.routeId}`,
    keywords: [t.id, t.tiNo, t.year, t.name, t.nameZh, t.champion, t.runnerUp, ...t.participantTeamNames]
      .join(' ')
      .toLowerCase(),
  }))

  const teamRows = await db
    .select({
      id: schema.teams.id,
      name: schema.teams.name,
      nameZh: schema.teams.nameZh,
      tournamentId: schema.participants.tournamentId,
      alias: schema.teamAliases.alias,
    })
    .from(schema.teams)
    .leftJoin(schema.participants, eq(schema.teams.id, schema.participants.teamId))
    .leftJoin(schema.teamAliases, eq(schema.teams.id, schema.teamAliases.teamId))
    .orderBy(asc(schema.teams.name))
  const teams = new Map<string, { name: string; nameZh: string; aliases: Set<string>; tournamentIds: Set<string> }>()
  for (const row of teamRows) {
    const current = teams.get(row.id) || {
      name: row.name,
      nameZh: row.nameZh || '',
      aliases: new Set<string>(),
      tournamentIds: new Set<string>(),
    }
    if (row.alias) current.aliases.add(row.alias)
    if (row.tournamentId) current.tournamentIds.add(row.tournamentId)
    teams.set(row.id, current)
  }
  for (const [id, team] of teams) {
    const tournamentId = [...team.tournamentIds].sort((a, b) => (yearById.get(b) || 0) - (yearById.get(a) || 0))[0]
    if (!tournamentId) continue
    entries.push({
      id: `team:${id}`,
      kind: 'team',
      label: team.nameZh || team.name,
      description: `战队 · 最近收录 Ti${tournaments.find((t) => t.id === tournamentId)?.tiNo || ''}`,
      href: `/ti/${routeById.get(tournamentId)}#roster-${id}`,
      keywords: [id, team.name, team.nameZh, ...team.aliases].join(' ').toLowerCase(),
    })
  }

  const playerRows = await db
    .select({
      id: schema.players.id,
      handle: schema.players.handle,
      realName: schema.players.realName,
      tournamentId: schema.rosters.tournamentId,
      teamId: schema.rosters.teamId,
      alias: schema.playerAliases.alias,
    })
    .from(schema.players)
    .leftJoin(schema.rosters, eq(schema.players.id, schema.rosters.playerId))
    .leftJoin(schema.playerAliases, eq(schema.players.id, schema.playerAliases.playerId))
    .orderBy(asc(schema.players.handle))
  const players = new Map<string, { handle: string; realName: string; aliases: Set<string>; appearances: Array<{ tournamentId: string; teamId: string }> }>()
  for (const row of playerRows) {
    const current = players.get(row.id) || {
      handle: row.handle,
      realName: row.realName || '',
      aliases: new Set<string>(),
      appearances: [],
    }
    if (row.alias) current.aliases.add(row.alias)
    if (row.tournamentId && row.teamId) current.appearances.push({ tournamentId: row.tournamentId, teamId: row.teamId })
    players.set(row.id, current)
  }
  for (const [id, player] of players) {
    const appearance = player.appearances.sort(
      (a, b) => (yearById.get(b.tournamentId) || 0) - (yearById.get(a.tournamentId) || 0),
    )[0]
    if (!appearance) continue
    entries.push({
      id: `player:${id}`,
      kind: 'player',
      label: player.handle,
      description: `选手 · ${player.realName || '本名未收录'}`,
      href: `/ti/${routeById.get(appearance.tournamentId)}#roster-${appearance.teamId}`,
      keywords: [id, player.handle, player.realName, ...player.aliases].join(' ').toLowerCase(),
    })
  }

  return entries
}
