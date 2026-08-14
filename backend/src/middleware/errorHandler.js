/* ==========================================================================
   SEMS Backend — Centralized Error Handler
   Catches any error thrown/passed to next() anywhere in the app and
   returns a consistent JSON error shape instead of leaking a stack trace
   to the client or crashing the server.
   ========================================================================== */

export function errorHandler(err, req, res, next) {
  console.error('[SEMS API] Error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Something went wrong on the server.',
  });
}