import test from 'node:test'
import assert from 'node:assert/strict'

import { getChinaPerformance, getRankings, getStats, getTournamentDetail, listTournaments } from '../services/ti'

test('listTournaments includes cancelled 2020 entry', async () => {
  const tournaments = await listTournaments()
  assert.ok(tournaments.length >= 15)
  const cancelled = tournaments.find((t) => t.status === 'cancelled' && t.year === 2020)
  assert.ok(cancelled)
  assert.equal(cancelled?.routeId, '2020')
})

test('Ti15 ongoing entry can exist without final placements', async () => {
  const tournaments = await listTournaments()
  const ti15 = tournaments.find((t) => t.tiNo === 15)
  assert.ok(ti15)
  assert.equal(ti15?.status, 'ongoing')
  assert.equal(ti15?.champion, '—')
  assert.equal(ti15?.runnerUp, '—')
  assert.equal(ti15?.bestChinaRank, null)
})

test('Ti15 detail shows all qualified teams while final ranking pending', async () => {
  const detail = await getTournamentDetail('15')
  assert.ok(detail)
  assert.equal(detail?.status, 'ongoing')
  assert.equal(detail?.placements.length, 16)
  assert.ok(detail?.placements.every((placement) => placement.rank === 0))
  assert.ok(detail?.placements.every((placement) => placement.region))
  assert.ok(detail?.rosters.some((team) => team.teamId === 'lgd-gaming' && team.players.some((player) => player.handle === 'fcr' && player.role === '助理教练')))
})

test('TI6 detail has placements and rosters', async () => {
  const detail = await getTournamentDetail('6')
  assert.ok(detail)
  assert.equal(detail?.tiNo, 6)
  assert.ok((detail?.placements.length || 0) >= 16)
  assert.ok((detail?.rosters.length || 0) >= 16)
  assert.ok(detail?.participants.some((participant) => participant.teamLogo))
  assert.ok(detail?.placements.some((placement) => placement.teamLogo))
  assert.ok(detail?.rosters.some((team) => team.teamLogo))
  assert.ok(detail?.rosters.some((team) => team.players.some((player) => player.avatar)))
})

test('rankings and stats return core aggregates', async () => {
  const rankings = await getRankings()
  const stats = await getStats()
  assert.ok(rankings.champions.length >= 14)
  assert.ok(rankings.playerChampions.length >= 1)
  assert.ok(rankings.prizePools.length >= 14)
  assert.ok(stats.totalTIs >= 15)
  assert.ok(stats.maxPrizePool > 0)
})

test('china performance exists for TI6', async () => {
  const detail = await getTournamentDetail('6')
  assert.ok(detail)
  const china = await getChinaPerformance(detail!.id)
  assert.ok(china)
  assert.equal(china?.bestRank, 1)
  assert.ok((china?.teams.length || 0) >= 1)
})
