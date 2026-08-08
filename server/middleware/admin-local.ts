import { isAdminRequestPath } from '../../shared/admin-path'

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!isAdminRequestPath(path)) return
  if (import.meta.dev) return
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
})
