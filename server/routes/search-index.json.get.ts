import { getStaticSearchIndex } from '../services/search'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, stale-while-revalidate=86400')
  return getStaticSearchIndex()
})
