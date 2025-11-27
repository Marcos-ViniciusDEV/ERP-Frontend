/**
 * Base HTTP error interface with status code.
 */
export interface HttpError extends Error {
  statusCode: number;
}

/**
 * Factory function to create HTTP errors.
 * Throw this from route handlers to send specific HTTP errors.
 */
export const createHttpError = (statusCode: number, message: string): HttpError => {
  const error = new Error(message) as HttpError;
  error.name = "HttpError";
  error.statusCode = statusCode;
  return error;
};

// Convenience constructors
export const BadRequestError = (msg: string) => createHttpError(400, msg);
export const UnauthorizedError = (msg: string) => createHttpError(401, msg);
export const ForbiddenError = (msg: string) => createHttpError(403, msg);
export const NotFoundError = (msg: string) => createHttpError(404, msg);
