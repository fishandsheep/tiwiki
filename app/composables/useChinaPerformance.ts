import type { ChinaPerformance } from '~/types/ti'

export function useChinaPerformance(tournamentId: string) {
  return useAsyncData<ChinaPerformance | null>(
    `china:${tournamentId}`,
    () => $fetch(`/api/china/${encodeURIComponent(tournamentId)}`),
    {
      default: () => null,
    },
  )
}
