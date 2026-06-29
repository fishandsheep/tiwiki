export type TournamentStatus = 'completed' | 'ongoing' | 'cancelled'

export interface Tournament {
  id: string
  routeId: string
  tiNo: number
  status: TournamentStatus
  name: string
  nameZh: string
  year: number
  startDate: string
  endDate: string
  country: string
  city: string
  venue: string
  prizePoolUsd: number
  champion: string
  runnerUp: string
  championTeamId: string
  runnerUpTeamId: string
  summaryZh: string
  chinaSummary: string
  liquipediaUrl?: string
}

export interface Team {
  id: string
  name: string
  nameZh: string
  region: string
  country: string
  logo: string
  logoSourceUrl?: string
  descriptionZh: string
  liquipediaUrl?: string
}

export interface Placement {
  tournamentId: string
  rank: number
  teamId: string
  teamName: string
  prizeUsd: number
  isChinaTeam: boolean
  region?: string
  inviteType?: string
  teamLogo?: string
  teamLiquipediaUrl?: string
}

export interface Participant {
  tournamentId: string
  teamId: string
  teamName: string
  region: string
  country: string
  inviteType: string
  teamLogo: string
}

export interface RosterEntry {
  playerId: string
  handle: string
  role: string
  country: string
  avatar: string
  liquipediaUrl?: string
}

export interface TeamRoster {
  teamId: string
  teamName: string
  inviteType: string
  region: string
  teamLogo: string
  teamLiquipediaUrl?: string
  players: RosterEntry[]
}

export interface TournamentDetail extends Tournament {
  placements: Placement[]
  participants: Participant[]
  rosters: TeamRoster[]
}

export interface ChinaTeamResult {
  teamId: string
  teamName: string
  rank: number
  placement: string
  prizeUsd: number
  teamLiquipediaUrl?: string
}

export interface ChinaPerformance {
  tournamentId: string
  tiNo: number
  bestTeamName: string
  bestRank: number
  bestPlacement: string
  summary: string
  teams: ChinaTeamResult[]
}

export interface TournamentSummary extends Tournament {
  bestChinaRank: number | null
  participantTeamNames: string[]
}

export interface ChampionRow {
  tiNo: number
  year: number
  teamName: string
  isChinaTeam: boolean
  routeId: string
}

export interface PlayerChampionRow {
  playerId: string
  handle: string
  country: string
  region: string
  avatar: string
  liquipediaUrl?: string
  championshipCount: number
  championshipTiNos: number[]
  championshipYears: number[]
  championships: Array<{
    tiNo: number
    year: number
    routeId: string
  }>
}

export interface PrizePoolRow {
  tiNo: number
  year: number
  prizePoolUsd: number
  routeId: string
}

export interface ChinaAggregateRow {
  tiNo: number
  year: number
  bestTeamName: string
  bestRank: number
  bestPlacement: string
  routeId: string
}

export interface RankingsData {
  champions: ChampionRow[]
  playerChampions: PlayerChampionRow[]
  prizePools: PrizePoolRow[]
  chinaTeams: ChinaAggregateRow[]
}

export interface StatsData {
  totalTIs: number
  championsCount: number
  chinaChampionsCount: number
  maxPrizePool: number
  maxPrizeTiNo: number
}
