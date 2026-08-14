/* ==========================================================================
   SEMS Backend — 404 Middleware
   Runs when a request doesn't match any defined route (e.g. a typo'd URL).
   Must be registered in app.js AFTER all real routes.
   ========================================================================== */

export function notFound(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}