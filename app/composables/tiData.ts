import type { Tournament } from '~/types/ti'

export function placementLabel(rank: number): string {
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

export function formatUsd(amount: number): string {
  return '$' + amount.toLocaleString('en-US')
}

export function formatDate(iso: string): string {
  if (!iso) return '待定'
  return iso
}

export function formatDateRange(a: string, b: string, status: Tournament['status'] = 'completed'): string {
  if (status === 'cancelled') return '赛事取消'
  if (!a && !b) return '日期待定'
  if (a && b) return `${a} ~ ${b}`
  return a || b
}

export function formatTiLabel(no: number | string) {
  return `ti ${no}`
}

export function tournamentLabel(t: Pick<Tournament, 'status' | 'tiNo' | 'year'>) {
  return t.status === 'cancelled' ? `${t.year}` : formatTiLabel(t.tiNo)
}
