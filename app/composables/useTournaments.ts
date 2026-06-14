import type { TournamentSummary } from '~/types/ti'

export function useTournaments() {
  return useAsyncData<TournamentSummary[]>('tournaments', () => $fetch('/api/tournaments'), {
    default: () => [],
  })
}
