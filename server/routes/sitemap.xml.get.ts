import { listTournaments } from '../services/ti'

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] || character)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const origin = String(config.public.siteUrl).replace(/\/$/, '')
  const tournaments = await listTournaments()
  const staticPaths = ['/', '/ti', '/china', '/rankings', '/search', '/about']
  const urls = [
    ...staticPaths.map((path) => ({ path, lastmod: '' })),
    ...tournaments.map((tournament) => ({
      path: `/ti/${tournament.routeId}`,
      lastmod: tournament.fetchedAt,
    })),
  ]
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ path, lastmod }) => `  <url><loc>${escapeXml(`${origin}${path}`)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`
})
