import { defineActionErrors } from "@agent-native/core/action";

import {
  ERROR_CODES,
  ERROR_STATUS,
  type PavilionErrorCode,
} from "../../shared/contracts/errors.js";

export const pavilionErrors = defineActionErrors(...ERROR_CODES);

export function reject(
  code: PavilionErrorCode,
  message: string,
  details?: Record<string, unknown>,
): never {
  return pavilionErrors.noWrite(message, code, {
    statusCode: ERROR_STATUS[code],
    ...(details ? { details } : {}),
  });
}
