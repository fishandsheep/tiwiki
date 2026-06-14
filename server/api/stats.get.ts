import { getStats } from '../services/ti'

export default defineEventHandler(async () => {
  return getStats()
})
