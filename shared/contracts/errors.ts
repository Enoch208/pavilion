export const ERROR_STATUS = {
  UNAUTHENTICATED: 401,
  INPUT_INVALID: 400,
  NOT_FOUND: 404,
  VERSION_CONFLICT: 409,
  OBJECT_LOCKED: 423,
  LAYOUT_INVALID: 422,
} as const;

export type PavilionErrorCode = keyof typeof ERROR_STATUS;

export const ERROR_CODES = Object.keys(ERROR_STATUS) as [
  PavilionErrorCode,
  ...PavilionErrorCode[],
];
