import { AdminConflictError, AdminValidationError } from '../services/admin'

export function handleAdminError(error: unknown): never {
  if (error instanceof AdminValidationError || error instanceof AdminConflictError) {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.message,
    })
  }
  throw error
}

