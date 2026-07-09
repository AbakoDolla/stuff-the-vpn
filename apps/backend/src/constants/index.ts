export const HTTP_STATUS = {
  OK:                 200,
  CREATED:            201,
  NO_CONTENT:         204,
  BAD_REQUEST:        400,
  UNAUTHORIZED:       401,
  FORBIDDEN:          403,
  NOT_FOUND:          404,
  CONFLICT:           409,
  UNPROCESSABLE:      422,
  TOO_MANY_REQUESTS:  429,
  INTERNAL:           500,
  SERVICE_UNAVAILABLE:503,
} as const;

/**
 * Aligné sur l'enum Prisma UserRole :
 * CLIENT | SUPPORT | RESELLER | ADMIN | SUPER_ADMIN
 */
export const ROLES = {
  CLIENT:     "CLIENT",
  SUPPORT:    "SUPPORT",
  RESELLER:   "RESELLER",
  ADMIN:      "ADMIN",
  SUPER_ADMIN:"SUPER_ADMIN",
} as const;

export const VOUCHER_CODE_LENGTH = 12;
export const DEFAULT_DEVICE_LIMIT = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
