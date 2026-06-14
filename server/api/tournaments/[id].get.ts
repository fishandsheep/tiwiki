import { getRouterParam, createError } from 'h3'
import { getTournamentDetail } from '../../services/ti'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing tournament id' })
  }

  const detail = await getTournamentDetail(id)
  if (!detail) {
    throw createError({ statusCode: 404, statusMessage: '未找到该届 TI' })
  }
  return detail
})
