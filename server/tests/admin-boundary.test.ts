import test from 'node:test'
import assert from 'node:assert/strict'

import { isAdminRequestPath } from '../../shared/admin-path'

test('admin boundary covers page and API roots plus nested paths', () => {
  for (const path of ['/admin', '/admin/', '/admin/edit', '/api/admin', '/api/admin/', '/api/admin/teams']) {
    assert.equal(isAdminRequestPath(path), true, path)
  }
  for (const path of ['/', '/api/tournaments', '/administrator']) {
    assert.equal(isAdminRequestPath(path), false, path)
  }
})
