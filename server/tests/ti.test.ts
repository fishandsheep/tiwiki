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

test('TI6 detail has placements and rosters', async () => {
  const detail = await getTournamentDetail('6')
  assert.ok(detail)
  assert.equal(detail?.tiNo, 6)
  assert.ok((detail?.placements.length || 0) >= 16)
  assert.ok((detail?.rosters.length || 0) >= 16)
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
