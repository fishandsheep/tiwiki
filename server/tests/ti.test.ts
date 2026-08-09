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
  assert.equal(ti15?.champion, '待定')
  assert.equal(ti15?.runnerUp, '待定')
  assert.equal(ti15?.bestChinaRank, null)
})

test('Ti15 detail shows all qualified teams while final ranking pending', async () => {
  const detail = await getTournamentDetail('15')
  assert.ok(detail)
  assert.equal(detail?.status, 'ongoing')
  assert.equal(detail?.placements.length, 16)
  assert.ok(detail?.placements.every((placement) => placement.rank === 0))
  assert.ok(detail?.placements.every((placement) => placement.teamName))
  assert.ok(detail?.rosters.some((team) => team.teamId === 'lgd-gaming' && team.players.some((player) => player.handle === 'fcr' && player.role === '助理教练')))
})

test('TI6 detail exposes local team logos and player avatars', async () => {
  const detail = await getTournamentDetail('6')
  assert.ok(detail)
  assert.equal(detail?.tiNo, 6)
  assert.ok((detail?.placements.length || 0) >= 16)
  assert.ok((detail?.rosters.length || 0) >= 16)
  const teamLogos = [
    ...(detail?.participants.map((participant) => participant.teamLogo) || []),
    ...(detail?.placements.map((placement) => placement.teamLogo || '') || []),
    ...(detail?.rosters.map((team) => team.teamLogo) || []),
  ].filter(Boolean)
  assert.ok(teamLogos.length > 0)
  assert.ok(teamLogos.every((logo) => logo.startsWith('/media/')))
  const avatars = detail?.rosters.flatMap((team) => team.players.map((player) => player.avatar).filter(Boolean)) || []
  assert.ok(avatars.length > 0)
  assert.ok(avatars.every((avatar) => avatar.startsWith('/media/')))
})

test('rankings and stats return core aggregates', async () => {
  const tournaments = await listTournaments()
  const rankings = await getRankings()
  const stats = await getStats()
  assert.ok(rankings.champions.length >= 14)
  assert.ok(rankings.playerChampions.length >= 1)
  assert.ok(rankings.prizePools.length >= 14)
  assert.equal(stats.totalTIs, tournaments.filter((t) => t.status !== 'cancelled').length)
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
