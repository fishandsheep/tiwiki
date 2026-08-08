import test from 'node:test'
import assert from 'node:assert/strict'

import { formatPrizePool } from '../../shared/ti-values'

test('prize pool presentation distinguishes unknown, pending, not applicable, and zero', () => {
  assert.equal(formatPrizePool(null, 'completed'), '未知')
  assert.equal(formatPrizePool(null, 'ongoing'), '待定')
  assert.equal(formatPrizePool(null, 'cancelled'), '不适用')
  assert.equal(formatPrizePool(0, 'completed'), '$0')
  assert.equal(formatPrizePool(1_600_000, 'completed'), '$1,600,000')
})
