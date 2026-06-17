import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { db, schema } from '../db/client'
import type {
  ChinaAggregateRow,
  ChinaPerformance,
  Participant,
  Placement,
  PlayerChampionRow,
  RankingsData,
  RosterEntry,
  StatsData,
  TeamRoster,
  Tournament,
  TournamentDetail,
  TournamentSummary,
} from '../../app/types/ti'

function routeIdFor(t: Pick<Tournament, 'status' | 'year' | 'tiNo'>) {
  return t.status === 'cancelled' ? String(t.year) : String(t.tiNo)
}

function tournamentLabel(t: Pick<Tournament, 'status' | 'tiNo' | 'year'>) {
  return t.status === 'cancelled' ? `${t.year}（取消）` : `TI${t.tiNo}`
}

function dateRangeText(startDate: string, endDate: string, status: Tournament['status']) {
  if (status === 'cancelled') return '赛事取消'
  if (!startDate && !endDate) return '日期待定'
  if (startDate && endDate) return `${startDate} ~ ${endDate}`
  return startDate || endDate
}

function buildSummaryZh(t: Tournament) {
  if (t.summaryZh?.trim()) return t.summaryZh
  if (t.status === 'cancelled') {
    return `${t.year} 年国际邀请赛原定于 ${t.city || t.country || '原计划举办地'} 举行，后因疫情原因取消，未产生冠军与最终排名。`
  }
  return `${tournamentLabel(t)} 于 ${dateRangeText(t.startDate, t.endDate, t.status)} 在 ${t.city} ${t.venue} 举办，冠军为 ${t.champion}，总奖金池 ${t.prizePoolUsd.toLocaleString('en-US')} 美元。`
}

function placementLabel(rank: number): string {
  switch (rank) {
    case 1:
      return '冠军'
    case 2:
      return '亚军'
    case 3:
      return '季军'
    case 4:
      return '殿军'
    default:
      return `${rank} 名`
  }
}

function translateRegion(region?: string | null) {
  const value = (region || '').trim()
  if (!value) return ''
  const map: Record<string, string> = {
    'China': '中国',
    'Chinese': '中国',
    'Americas': '美洲',
    'Europe': '欧洲',
    'Western Europe': '西欧',
    'Eastern Europe': '东欧',
    'CIS': '独联体',
    'North America': '北美',
    'South America': '南美',
    'Southeast Asia': '东南亚',
    'SEA': '东南亚',
    'MENA': '中东与北非',
  }
  return map[value] || value
}

function translateInviteType(inviteType?: string | null, region?: string | null) {
  const value = (inviteType || '').trim()
  const regionZh = translateRegion(region)
  if (!value) return ''
  const lower = value.toLowerCase()
  if (lower === 'invited' || lower === 'direct invite' || lower === 'directly invited') {
    return regionZh ? `直邀（${regionZh}）` : '直邀'
  }
  if (lower === 'wild card' || lower === 'wildcard') return '外卡赛'
  if (lower === 'wildcard match') return '外卡加赛'
  if (lower === 'last chance qualifier') return '最后机会预选'
  if (lower.startsWith('dota pro circuit #')) {
    return value.replace('Dota Pro Circuit', 'DPC 积分排名')
  }
  if (lower === 'east qualifiers') return '东区预选'
  if (lower === 'west qualifiers') return '西区预选'
  if (lower.includes('qualifier')) {
    const label = regionZh || value.replace(/qualifier/gi, '').replace(/[-/]/g, ' ').trim()
    return label ? `${label}预选` : '预选赛'
  }
  const translatedRegion = translateRegion(value)
  if (translatedRegion !== value) return `${translatedRegion}预选`
  return value
}

function normalizeTournament(row: typeof schema.tournaments.$inferSelect): Tournament {
  return {
    id: row.id,
    routeId: routeIdFor({ status: row.status as Tournament['status'], year: row.year, tiNo: row.tiNo }),
    tiNo: row.tiNo,
    status: row.status as Tournament['status'],
    name: row.name,
    nameZh: row.nameZh || row.name,
    year: row.year,
    startDate: row.startDate || '',
    endDate: row.endDate || '',
    country: row.country || '',
    city: row.city || '',
    venue: row.venue || '',
    prizePoolUsd: row.prizePoolUsd || 0,
    champion: row.championTeamId ? '' : row.status === 'cancelled' ? '—' : '',
    runnerUp: row.runnerUpTeamId ? '' : row.status === 'cancelled' ? '—' : '',
    championTeamId: row.championTeamId || '',
    runnerUpTeamId: row.runnerUpTeamId || '',
    summaryZh: row.summaryZh || '',
    chinaSummary: row.chinaSummary || '',
    liquipediaUrl: row.liquipediaUrl || '',
  }
}

async function enrichTournamentNames(rows: typeof schema.tournaments.$inferSelect[]) {
  const tournaments = rows.map(normalizeTournament)
  const teamIds = Array.from(
    new Set(
      tournaments.flatMap((t) => [t.championTeamId, t.runnerUpTeamId]).filter(Boolean),
    ),
  )
  const teams = teamIds.length
    ? await db
        .select({ id: schema.teams.id, name: schema.teams.name })
        .from(schema.teams)
        .where(inArray(schema.teams.id, teamIds))
    : []
  const teamMap = new Map(teams.map((t) => [t.id, t.name]))

  return tournaments.map((t) => ({
    ...t,
    champion: teamMap.get(t.championTeamId) || (t.status === 'cancelled' ? '—' : ''),
    runnerUp: teamMap.get(t.runnerUpTeamId) || (t.status === 'cancelled' ? '—' : ''),
  }))
}

export async function listTournaments(): Promise<TournamentSummary[]> {
  const rows = await db.select().from(schema.tournaments).orderBy(desc(schema.tournaments.year))
  const tournaments = await enrichTournamentNames(rows)

  const participantRows = await db
    .select({
      tournamentId: schema.participants.tournamentId,
      teamName: schema.teams.name,
    })
    .from(schema.participants)
    .innerJoin(schema.teams, eq(schema.participants.teamId, schema.teams.id))

  const placementRows = await db
    .select({
      tournamentId: schema.placements.tournamentId,
      rank: schema.placements.rank,
      isChinaTeam: schema.placements.isChinaTeam,
    })
    .from(schema.placements)

  const participantMap = new Map<string, string[]>()
  for (const row of participantRows) {
    participantMap.set(row.tournamentId, [...(participantMap.get(row.tournamentId) || []), row.teamName])
  }

  const bestChinaMap = new Map<string, number>()
  for (const row of placementRows) {
    if (!row.isChinaTeam) continue
    const current = bestChinaMap.get(row.tournamentId)
    if (current == null || row.rank < current) bestChinaMap.set(row.tournamentId, row.rank)
  }

  return tournaments.map((t) => ({
    ...t,
    summaryZh: buildSummaryZh(t),
    bestChinaRank: t.status === 'cancelled' ? null : bestChinaMap.get(t.id) ?? null,
    participantTeamNames: participantMap.get(t.id) || [],
  }))
}

export async function getTournamentDetail(idOrNo: string): Promise<TournamentDetail | null> {
  const numeric = Number(idOrNo)
  const all = await db.select().from(schema.tournaments)
  const row = all.find((t) => {
    if (t.id === idOrNo) return true
    if (!Number.isNaN(numeric) && t.tiNo === numeric) return true
    if (!Number.isNaN(numeric) && t.status === 'cancelled' && t.year === numeric) return true
    return false
  })
  if (!row) return null

  const [tournament] = await enrichTournamentNames([row])

  const participantRows = await db
    .select({
      tournamentId: schema.participants.tournamentId,
      teamId: schema.participants.teamId,
      teamName: schema.teams.name,
      teamLogo: schema.teams.logo,
      teamLiquipediaUrl: schema.teams.liquipediaUrl,
      region: schema.participants.region,
      teamRegion: schema.teams.region,
      country: schema.participants.country,
      inviteType: schema.participants.inviteType,
    })
    .from(schema.participants)
    .innerJoin(schema.teams, eq(schema.participants.teamId, schema.teams.id))
    .where(eq(schema.participants.tournamentId, tournament.id))
    .orderBy(asc(schema.teams.name))

  const participants: Participant[] = participantRows.map((row) => ({
    tournamentId: row.tournamentId,
    teamId: row.teamId,
    teamName: row.teamName,
    teamLogo: row.teamLogo || '',
    teamLiquipediaUrl: row.teamLiquipediaUrl || '',
    region: translateRegion(row.region || row.teamRegion || ''),
    country: row.country || '',
    inviteType: translateInviteType(row.inviteType || '', row.region || row.teamRegion || ''),
  }))

  const participantMap = new Map(participants.map((p) => [p.teamId, p]))

  const placementRows = await db
    .select({
      tournamentId: schema.placements.tournamentId,
      rank: schema.placements.rank,
      teamId: schema.placements.teamId,
      teamName: schema.teams.name,
      teamLogo: schema.teams.logo,
      teamLiquipediaUrl: schema.teams.liquipediaUrl,
      prizeUsd: schema.placements.prizeUsd,
      isChinaTeam: schema.placements.isChinaTeam,
    })
    .from(schema.placements)
    .innerJoin(schema.teams, eq(schema.placements.teamId, schema.teams.id))
    .leftJoin(
      schema.participants,
      and(
        eq(schema.placements.tournamentId, schema.participants.tournamentId),
        eq(schema.placements.teamId, schema.participants.teamId),
      ),
    )
    .where(eq(schema.placements.tournamentId, tournament.id))
    .orderBy(asc(schema.placements.rank), asc(schema.teams.name))

  const placements: Placement[] = placementRows.map((row) => ({
    tournamentId: row.tournamentId,
    rank: row.rank,
    teamId: row.teamId,
    teamName: row.teamName,
    teamLogo: row.teamLogo || participantMap.get(row.teamId)?.teamLogo || '',
    teamLiquipediaUrl: row.teamLiquipediaUrl || participantMap.get(row.teamId)?.teamLiquipediaUrl || '',
    prizeUsd: row.prizeUsd || 0,
    isChinaTeam: !!row.isChinaTeam,
    region: participantMap.get(row.teamId)?.region || '',
    inviteType: participantMap.get(row.teamId)?.inviteType || '',
  }))

  const rosterRows = await db
    .select({
      teamId: schema.rosters.teamId,
      teamName: schema.teams.name,
      teamLogo: schema.teams.logo,
      teamLiquipediaUrl: schema.teams.liquipediaUrl,
      handle: schema.players.handle,
      playerId: schema.players.id,
      role: schema.rosters.role,
      avatar: schema.players.avatar,
      playerLiquipediaUrl: schema.players.liquipediaUrl,
      playerCountry: schema.rosters.playerCountry,
      fallbackCountry: schema.players.country,
    })
    .from(schema.rosters)
    .innerJoin(schema.teams, eq(schema.rosters.teamId, schema.teams.id))
    .innerJoin(schema.players, eq(schema.rosters.playerId, schema.players.id))
    .leftJoin(
      schema.participants,
      and(
        eq(schema.rosters.tournamentId, schema.participants.tournamentId),
        eq(schema.rosters.teamId, schema.participants.teamId),
      ),
    )
    .where(eq(schema.rosters.tournamentId, tournament.id))
    .orderBy(asc(schema.teams.name), asc(schema.rosters.id))

  const rosterMap = new Map<string, TeamRoster>()
  for (const row of rosterRows) {
    if (!rosterMap.has(row.teamId)) {
      const participant = participantMap.get(row.teamId)
      rosterMap.set(row.teamId, {
        teamId: row.teamId,
        teamName: row.teamName,
        inviteType: participant?.inviteType || '',
        region: participant?.region || '',
        teamLogo: row.teamLogo || participant?.teamLogo || '',
        teamLiquipediaUrl: row.teamLiquipediaUrl || participant?.teamLiquipediaUrl || '',
        players: [],
      })
    }
    const players = rosterMap.get(row.teamId)!.players
    players.push({
      playerId: row.playerId,
      handle: row.handle,
      role: row.role || '',
      country: row.playerCountry || row.fallbackCountry || '',
      avatar: row.avatar || '',
      liquipediaUrl: row.playerLiquipediaUrl || '',
    } satisfies RosterEntry)
  }

  return {
    ...tournament,
    summaryZh: buildSummaryZh(tournament),
    placements,
    participants,
    rosters: Array.from(rosterMap.values()),
  }
}

export async function getRankings(): Promise<RankingsData> {
  const tournaments = (await listTournaments()).filter((t) => t.status === 'completed')
  const tournamentMap = new Map(tournaments.map((t) => [t.id, t]))

  const placementRows = await db
    .select({
      tournamentId: schema.placements.tournamentId,
      rank: schema.placements.rank,
      teamName: schema.teams.name,
      teamLiquipediaUrl: schema.teams.liquipediaUrl,
      isChinaTeam: schema.placements.isChinaTeam,
    })
    .from(schema.placements)
    .innerJoin(schema.teams, eq(schema.placements.teamId, schema.teams.id))

  const placementsByTournament = new Map<string, typeof placementRows>()
  for (const row of placementRows) {
    placementsByTournament.set(row.tournamentId, [...(placementsByTournament.get(row.tournamentId) || []), row])
  }

  const champions = tournaments.map((t) => {
    const champion = (placementsByTournament.get(t.id) || []).find((p) => p.rank === 1)
    return {
      tiNo: t.tiNo,
      year: t.year,
      teamName: champion?.teamName || t.champion,
      isChinaTeam: champion?.isChinaTeam || false,
      routeId: t.routeId,
    }
  })

  const prizePools = tournaments
    .map((t) => ({
      tiNo: t.tiNo,
      year: t.year,
      prizePoolUsd: t.prizePoolUsd,
      routeId: t.routeId,
    }))
    .sort((a, b) => b.prizePoolUsd - a.prizePoolUsd)

  const chinaTeams: ChinaAggregateRow[] = tournaments
    .map((t) => {
      const china = (placementsByTournament.get(t.id) || [])
        .filter((p) => p.isChinaTeam)
        .sort((a, b) => a.rank - b.rank)
      const best = china[0]
      return {
        tiNo: t.tiNo,
        year: t.year,
        bestTeamName: best?.teamName || '—',
        bestRank: best?.rank || 99,
        bestPlacement: best ? placementLabel(best.rank) : '未参赛',
        routeId: t.routeId,
      }
    })
    .sort((a, b) => a.bestRank - b.bestRank)

  const championTournamentIds = Array.from(
    new Set(
      placementRows
        .filter((row) => row.rank === 1)
        .map((row) => row.tournamentId),
    ),
  )
  const championRosters = championTournamentIds.length
    ? await db
        .select({
          tournamentId: schema.rosters.tournamentId,
          playerId: schema.players.id,
          handle: schema.players.handle,
          country: schema.players.country,
          region: schema.players.region,
          avatar: schema.players.avatar,
          liquipediaUrl: schema.players.liquipediaUrl,
        })
        .from(schema.rosters)
        .innerJoin(schema.players, eq(schema.rosters.playerId, schema.players.id))
        .innerJoin(
          schema.placements,
          and(
            eq(schema.rosters.tournamentId, schema.placements.tournamentId),
            eq(schema.rosters.teamId, schema.placements.teamId),
          ),
        )
        .where(and(inArray(schema.rosters.tournamentId, championTournamentIds), eq(schema.placements.rank, 1)))
    : []

  const playerChampionMap = new Map<string, PlayerChampionRow>()
  for (const row of championRosters) {
    const tournament = tournamentMap.get(row.tournamentId)
    if (!tournament) continue
    const tiNo = tournament.tiNo
    const current = playerChampionMap.get(row.playerId) || {
      playerId: row.playerId,
      handle: row.handle,
      country: row.country || '',
      region: row.region || '',
      avatar: row.avatar || '',
      liquipediaUrl: row.liquipediaUrl || '',
      championshipCount: 0,
      championshipTiNos: [],
      championshipYears: [],
      championships: [],
    }
    if (!current.championshipTiNos.includes(tiNo)) {
      current.championshipTiNos.push(tiNo)
      current.championshipTiNos.sort((a, b) => a - b)
      current.championshipYears.push(tournament.year)
      current.championshipYears.sort((a, b) => a - b)
      current.championships.push({ tiNo, year: tournament.year, routeId: tournament.routeId })
      current.championships.sort((a, b) => a.tiNo - b.tiNo)
      current.championshipCount += 1
    }
    playerChampionMap.set(row.playerId, current)
  }

  const playerChampions = Array.from(playerChampionMap.values()).sort((a, b) => {
    if (b.championshipCount !== a.championshipCount) return b.championshipCount - a.championshipCount
    return a.handle.localeCompare(b.handle)
  })

  return { champions, playerChampions, prizePools, chinaTeams }
}

export async function getStats(): Promise<StatsData> {
  const tournaments = await listTournaments()
  const rankings = await getRankings()
  const max = [...rankings.prizePools].sort((a, b) => b.prizePoolUsd - a.prizePoolUsd)[0]
  return {
    totalTIs: tournaments.length,
    championsCount: rankings.champions.length,
    chinaChampionsCount: rankings.champions.filter((row) => row.isChinaTeam).length,
    maxPrizePool: max?.prizePoolUsd || 0,
    maxPrizeTiNo: max?.tiNo || 0,
  }
}

export async function getChinaPerformance(tournamentId: string): Promise<ChinaPerformance | null> {
  const detail = await getTournamentDetail(tournamentId)
  if (!detail) return null
  const chinaPlacements = detail.placements
    .filter((p) => p.isChinaTeam)
    .sort((a, b) => a.rank - b.rank)

  if (!chinaPlacements.length) {
    return {
      tournamentId: detail.id,
      tiNo: detail.tiNo,
      bestTeamName: '—',
      bestRank: 99,
      bestPlacement: '未参赛',
      summary:
        detail.status === 'cancelled'
          ? '该届赛事已取消，未产生中国战队成绩。'
          : '本届无中国战队进入最终排名记录。',
      teams: [],
    }
  }

  const best = chinaPlacements[0]
  return {
    tournamentId: detail.id,
    tiNo: detail.tiNo,
    bestTeamName: best.teamName,
    bestRank: best.rank,
    bestPlacement: placementLabel(best.rank),
    summary: detail.chinaSummary || `${best.teamName} 取得中国战队本届最佳成绩：${placementLabel(best.rank)}。`,
    teams: chinaPlacements.map((p) => ({
      teamId: p.teamId,
      teamName: p.teamName,
      rank: p.rank,
      placement: placementLabel(p.rank),
      prizeUsd: p.prizeUsd,
      teamLiquipediaUrl: p.teamLiquipediaUrl || '',
    })),
  }
}
