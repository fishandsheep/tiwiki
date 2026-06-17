import { adminService } from '../../services/admin'
import { handleAdminError } from '../../utils/admin-error'

export default defineEventHandler((event) => {
  try {
    const table = getRouterParam(event, 'table') || ''
    const query = getQuery(event)
    return adminService.listRows(table, {
      page: Number(query.page || 1),
      pageSize: Number(query.pageSize || 25),
      search: String(query.search || ''),
      sort: query.sort ? String(query.sort) : undefined,
      dir: query.dir ? String(query.dir) : undefined,
    })
  } catch (error) {
    handleAdminError(error)
  }
})
