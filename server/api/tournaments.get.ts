import { listTournaments } from '../services/ti'

export default defineEventHandler(async () => {
  return listTournaments()
})
