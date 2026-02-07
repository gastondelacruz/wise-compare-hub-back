/**
 * Technical/Infrastructure Constants
 * Business rule constants go in domain layer of each context
 */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const RATE_LIMITS = {
  AUTH_ATTEMPTS: 5,
  API_CALLS_PER_MINUTE: 100,
} as const;

export const TIMEOUTS = {
  DEFAULT: 5000,
  DATABASE: 10000,
  EXTERNAL_API: 30000,
} as const;

export const HTTP_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;
