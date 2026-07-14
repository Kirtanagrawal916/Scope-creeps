/**
 * app-error.ts — Typed application error for consistent HTTP responses.
 *
 * Throw AppError from any createServerFn handler to return a predictable
 * error with an HTTP status code. The message is preserved across the
 * server → client boundary by TanStack Start's serialization layer.
 */
export class AppError extends Error {
  public readonly statusCode: 400 | 401 | 403 | 404 | 500;

  constructor(statusCode: 400 | 401 | 403 | 404 | 500, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

/**
 * Type-guard that checks whether an unknown value is an AppError,
 * optionally narrowing by status code.
 */
export function isAppError(err: unknown, status?: number): err is AppError {
  if (!(err instanceof AppError)) return false;
  if (status !== undefined) return err.statusCode === status;
  return true;
}
