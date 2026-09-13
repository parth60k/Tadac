/**
 * Application error types and conventions.
 *
 * Rule: Errors should be useful and calm (Design §31).
 * Never surface raw database errors or stack traces to the UI.
 */

// ─── Error codes ──────────────────────────────────────────────────────────────

export type AppErrorCode =
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'EXTERNAL_UNAVAILABLE';

// ─── AppError class ───────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;

  constructor(
    code: AppErrorCode,
    userMessage: string,
    statusCode = 400,
    cause?: unknown
  ) {
    super(userMessage, cause ? { cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
  }
}

// ─── Convenience factory functions ───────────────────────────────────────────

export const Errors = {
  notFound: (entity: string) =>
    new AppError('NOT_FOUND', `${entity} not found.`, 404),

  alreadyExists: (entity: string) =>
    new AppError('ALREADY_EXISTS', `${entity} already exists.`, 409),

  validation: (message: string) =>
    new AppError('VALIDATION_ERROR', message, 400),

  conflict: (message: string) =>
    new AppError('CONFLICT', message, 409),

  internal: (cause?: unknown) =>
    new AppError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500, cause),

  externalUnavailable: (source: string) =>
    new AppError(
      'EXTERNAL_UNAVAILABLE',
      `${source} is currently unavailable. Your data is unaffected.`,
      503
    ),
};

// ─── API response helpers ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  code: AppErrorCode;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function fail(error: AppError): ApiError {
  return { success: false, code: error.code, message: error.userMessage };
}

/**
 * Wraps a server action/route handler.
 * Catches AppError and maps it; re-throws unknown errors as internal.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (err) {
    if (err instanceof AppError) {
      return fail(err);
    }
    console.error('[Internal Error]', err);
    return fail(Errors.internal(err));
  }
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** YYYY-MM-DD format check */
export function isValidDateString(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str + 'T00:00:00Z'));
}

export function assertDateString(str: string, field = 'date'): void {
  if (!isValidDateString(str)) {
    throw Errors.validation(`${field} must be a valid YYYY-MM-DD date string.`);
  }
}
