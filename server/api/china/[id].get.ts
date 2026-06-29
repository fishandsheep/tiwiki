import { getRouterParam, createError } from 'h3'
import { getChinaPerformance } from '../../services/ti'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing tournament id' })
  }

  const perf = await getChinaPerformance(id)
  if (!perf) {
    throw createError({ statusCode: 404, statusMessage: '未找到该届 Ti' })
  }
  return perf
})
