import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { verifyStaticOutput } from '../../scripts/verify-static-output'

test('static output verifier rejects admin and runtime API artifacts', () => {
  const root = mkdtempSync(join(tmpdir(), 'tiwiki-static-'))
  try {
    mkdirSync(join(root, 'admin'), { recursive: true })
    mkdirSync(join(root, 'api'), { recursive: true })
    writeFileSync(join(root, 'index.html'), '<main>Ti</main>')
    writeFileSync(join(root, 'admin/index.html'), '<main>Admin</main>')
    writeFileSync(join(root, 'api/meta.json'), '{}')

    const report = verifyStaticOutput(root)
    assert.equal(report.ok, false)
    assert.ok(report.errors.some((error) => error.includes('/admin')))
    assert.ok(report.errors.some((error) => error.includes('/api')))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('static output verifier accepts public pages and data assets', () => {
  const root = mkdtempSync(join(tmpdir(), 'tiwiki-static-'))
  try {
    mkdirSync(join(root, 'ti/1'), { recursive: true })
    writeFileSync(join(root, 'index.html'), '<main>Ti</main>')
    writeFileSync(join(root, 'ti/1/index.html'), '<main>Ti1</main>')
    writeFileSync(join(root, 'search-index.json'), '[]')

    const report = verifyStaticOutput(root)
    assert.equal(report.ok, true, report.errors.join('\n'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('static output verifier checks required assets and tournament page count', () => {
  const root = mkdtempSync(join(tmpdir(), 'tiwiki-static-'))
  try {
    mkdirSync(join(root, 'ti/1'), { recursive: true })
    writeFileSync(join(root, 'index.html'), '<main>Ti</main>')
    writeFileSync(join(root, 'ti/1/index.html'), '<main>Ti1</main>')

    const report = verifyStaticOutput(root, {
      expectedTournamentCount: 2,
      requiredFiles: ['search-index.json', 'sitemap.xml'],
    })

    assert.equal(report.ok, false)
    assert.ok(report.errors.some((error) => error.includes('expected 2 tournament pages')))
    assert.ok(report.errors.some((error) => error.includes('search-index.json')))
    assert.ok(report.errors.some((error) => error.includes('sitemap.xml')))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('static output verifier rejects nested runtime artifacts and broken internal links', () => {
  const root = mkdtempSync(join(tmpdir(), 'tiwiki-static-'))
  try {
    mkdirSync(join(root, 'assets/private'), { recursive: true })
    writeFileSync(join(root, 'index.html'), '<a href="/missing">missing</a>')
    writeFileSync(join(root, 'assets/private/ti.db'), 'not really sqlite')

    const report = verifyStaticOutput(root, { checkInternalLinks: true })

    assert.equal(report.ok, false)
    assert.ok(report.errors.some((error) => error.includes('database artifact')))
    assert.ok(report.errors.some((error) => error.includes('/missing')))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('static output verifier rejects incomplete tournament SEO metadata', () => {
  const root = mkdtempSync(join(tmpdir(), 'tiwiki-static-'))
  try {
    mkdirSync(join(root, 'ti/1'), { recursive: true })
    writeFileSync(join(root, 'index.html'), '<main>Ti</main>')
    writeFileSync(join(root, 'ti/1/index.html'), '<title>Ti1</title>')
    writeFileSync(join(root, 'sitemap.xml'), '<urlset></urlset>')

    const report = verifyStaticOutput(root, { checkTournamentSeo: true })

    assert.equal(report.ok, false)
    assert.ok(report.errors.some((error) => error.includes('canonical')))
    assert.ok(report.errors.some((error) => error.includes('structured data')))
    assert.ok(report.errors.some((error) => error.includes('sitemap')))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
