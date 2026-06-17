import { adminService } from '../../services/admin'
import { handleAdminError } from '../../utils/admin-error'

export default defineEventHandler(async (event) => {
  try {
    const table = getRouterParam(event, 'table') || ''
    const body = await readBody<Record<string, unknown>>(event)
    return await adminService.createRow(table, body || {})
  } catch (error) {
    handleAdminError(error)
  }
})
