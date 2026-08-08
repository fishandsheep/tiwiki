export type TournamentStatus = 'completed' | 'ongoing' | 'cancelled'

export function formatPrizePool(amount: number | null, status: TournamentStatus): string {
  if (amount == null) {
    if (status === 'cancelled') return '不适用'
    if (status === 'ongoing') return '待定'
    return '未知'
  }
  return `$${amount.toLocaleString('en-US')}`
}
