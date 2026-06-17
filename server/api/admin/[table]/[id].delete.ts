import { adminService } from '../../../services/admin'
import { handleAdminError } from '../../../utils/admin-error'

export default defineEventHandler((event) => {
  try {
    const table = getRouterParam(event, 'table') || ''
    const id = getRouterParam(event, 'id') || ''
    return adminService.deleteRow(table, id)
  } catch (error) {
    handleAdminError(error)
  }
})

