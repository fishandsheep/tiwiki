import { getRankings } from '../services/ti'

export default defineEventHandler(async () => {
  return getRankings()
})
