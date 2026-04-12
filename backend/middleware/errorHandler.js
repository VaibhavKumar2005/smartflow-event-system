/**
 * backend/middleware/errorHandler.js
 * ─────────────────────────────────────────────────────────────
 * Centralized Express error-handling middleware.
 * All routes call next(err) — never res.status().json() directly
 * for error paths — so error shape is always consistent.
 */

/**
 * Express 4 error handler (4-arg signature required).
 * Mount LAST in server.js, after all routes.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status  = err.status  ?? 500;
  const code    = err.code    ?? 'INTERNAL_ERROR';
  const message = err.message ?? 'An unexpected error occurred.';

  // Always log to stdout so cloud log aggregators (GCP, Railway, Render) pick it up
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.path} → ${code}: ${message}`);

  // Stack trace in dev only
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(status).json({
    error: code,
    message,
    // Zod validation details visible in non-prod environments only
    ...(process.env.NODE_ENV !== 'production' && err.details
      ? { details: err.details }
      : {}),
  });
}

/**
 * Factory for typed application errors.
 * Use this instead of `new Error()` anywhere you want a specific
 * HTTP status code and machine-readable error code in the response.
 *
 * @param {string} message  Human-readable message
 * @param {string} code     Machine-readable code (e.g. 'INVALID_INPUT')
 * @param {number} status   HTTP status code (default 400)
 * @param {*}     details   Optional extra data (Zod issues, etc.)
 */
export function createError(message, code, status = 400, details = null) {
  const err   = new Error(message);
  err.code    = code;
  err.status  = status;
  err.details = details;
  return err;
}
