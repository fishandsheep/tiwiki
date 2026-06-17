import { adminService } from '../../../services/admin'
import { handleAdminError } from '../../../utils/admin-error'

export default defineEventHandler(async (event) => {
  try {
    const table = getRouterParam(event, 'table') || ''
    const id = getRouterParam(event, 'id') || ''
    const body = await readBody<Record<string, unknown>>(event)
    return await adminService.updateRow(table, id, body || {})
  } catch (error) {
    handleAdminError(error)
  }
})
