import type { TournamentDetail } from '~/types/ti'

export function useTournament(idOrNo: string) {
  return useAsyncData<TournamentDetail | null>(
    `tournament:${idOrNo}`,
    () => $fetch(`/api/tournaments/${encodeURIComponent(idOrNo)}`),
    {
      default: () => null,
    },
  )
}
