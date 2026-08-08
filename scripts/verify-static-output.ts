import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import Database from 'better-sqlite3'

export interface StaticOutputReport {
  ok: boolean
  errors: string[]
}

export interface StaticOutputExpectations {
  expectedTournamentCount?: number
  requiredFiles?: string[]
  checkInternalLinks?: boolean
  checkTournamentSeo?: boolean
}

function walkFiles(root: string, directory = root): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? walkFiles(root, path) : [relative(root, path)]
  })
}

function internalLinkErrors(root: string, files: string[]) {
  const errors: string[] = []
  const localOrigin = 'https://tiwiki.invalid'
  for (const htmlFile of files.filter((file) => file.endsWith('.html'))) {
    const html = readFileSync(resolve(root, htmlFile), 'utf8')
    for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
      const raw = match[1]
      if (!raw || ['#', 'data:', 'mailto:', 'tel:', 'javascript:'].some((prefix) => raw.startsWith(prefix))) continue
      let url: URL
      try {
        url = new URL(raw, `${localOrigin}/${htmlFile}`)
      } catch {
        errors.push(`${htmlFile} has invalid link ${raw}`)
        continue
      }
      if (url.origin !== localOrigin) continue
      const decoded = decodeURIComponent(url.pathname).replace(/^\/+/, '')
      const candidates = extname(decoded)
        ? [resolve(root, decoded)]
        : [resolve(root, decoded, 'index.html'), resolve(root, `${decoded}.html`)]
      if (!candidates.some(existsSync)) errors.push(`${htmlFile} links to missing /${decoded}`)
    }
  }
  return errors
}

export function verifyStaticOutput(
  root: string,
  expectations: StaticOutputExpectations = {},
): StaticOutputReport {
  const errors: string[] = []
  if (!existsSync(resolve(root, 'index.html'))) errors.push('static output has no /index.html')
  for (const forbidden of ['admin', 'api']) {
    if (existsSync(resolve(root, forbidden))) errors.push(`static output must not publish /${forbidden}`)
  }
  const files = walkFiles(root)
  for (const file of files) {
    const segments = file.split(sep)
    if (segments.some((segment) => ['admin', 'api', 'server'].includes(segment))) {
      errors.push(`static output contains forbidden runtime path /${file}`)
    }
    if (['.db', '.sqlite', '.sqlite3'].includes(extname(file)) || file.endsWith('nitro.json')) {
      errors.push(`static output contains database artifact /${file}`)
    }
  }
  for (const file of expectations.requiredFiles ?? []) {
    if (!existsSync(resolve(root, file))) errors.push(`static output has no /${file}`)
  }
  if (expectations.expectedTournamentCount !== undefined) {
    const tiRoot = resolve(root, 'ti')
    const count = existsSync(tiRoot)
      ? readdirSync(tiRoot, { withFileTypes: true }).filter(
          (entry) => entry.isDirectory() && existsSync(resolve(tiRoot, entry.name, 'index.html')),
        ).length
      : 0
    if (count !== expectations.expectedTournamentCount) {
      errors.push(`expected ${expectations.expectedTournamentCount} tournament pages, found ${count}`)
    }
  }
  if (expectations.checkTournamentSeo) {
    const tiRoot = resolve(root, 'ti')
    const sitemap = existsSync(resolve(root, 'sitemap.xml'))
      ? readFileSync(resolve(root, 'sitemap.xml'), 'utf8')
      : ''
    const routes = existsSync(tiRoot)
      ? readdirSync(tiRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
      : []
    for (const route of routes) {
      const pagePath = resolve(tiRoot, route, 'index.html')
      if (!existsSync(pagePath)) continue
      const html = readFileSync(pagePath, 'utf8')
      if (!html.includes('rel="canonical"')) errors.push(`/ti/${route} has no canonical metadata`)
      if (!html.includes('name="description"')) errors.push(`/ti/${route} has no description metadata`)
      if (!html.includes('property="og:title"')) errors.push(`/ti/${route} has no Open Graph metadata`)
      if (!html.includes('application/ld+json')) errors.push(`/ti/${route} has no structured data`)
      if (!sitemap.includes(`/ti/${route}`)) errors.push(`/ti/${route} is missing from sitemap`)
    }
  }
  if (expectations.checkInternalLinks) errors.push(...internalLinkErrors(root, files))
  return { ok: errors.length === 0, errors }
}

function runCli() {
  const root = resolve(process.cwd(), process.argv[2] || '.output/public')
  const db = new Database(
    resolve(process.env.TIWIKI_DB_PATH || resolve(process.cwd(), 'data/ti.db')),
    { readonly: true },
  )
  const expectedTournamentCount = Number(
    (db.prepare('SELECT COUNT(*) AS count FROM tournaments').get() as { count: number }).count,
  )
  db.close()
  const report = verifyStaticOutput(root, {
    expectedTournamentCount,
    requiredFiles: ['search-index.json', 'sitemap.xml'],
    checkInternalLinks: true,
    checkTournamentSeo: true,
  })
  for (const error of report.errors) console.error(`error: ${error}`)
  if (!report.ok) process.exitCode = 1
  else console.log('static output verification passed')
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) runCli()
