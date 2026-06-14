import type { RankingsData, StatsData } from '~/types/ti'

export function useRankings() {
  return useAsyncData<RankingsData>('rankings', () => $fetch('/api/rankings'), {
    default: () => ({ champions: [], playerChampions: [], prizePools: [], chinaTeams: [] }),
  })
}

export function useStats() {
  return useAsyncData<StatsData>('stats', () => $fetch('/api/stats'), {
    default: () => ({
      totalTIs: 0,
      championsCount: 0,
      chinaChampionsCount: 0,
      maxPrizePool: 0,
      maxPrizeTiNo: 0,
    }),
  })
}
