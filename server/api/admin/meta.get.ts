import { adminService } from '../../services/admin'

export default defineEventHandler(() => {
  return adminService.getMeta()
})

