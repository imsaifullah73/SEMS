/* ==========================================================================
   SEMS Backend — ID Generator
   Same approach as the frontend's generateId (Phase 3), reimplemented here
   since the backend is a separate Node.js codebase and cannot import
   browser-side JS files directly.
   ========================================================================== */

export function generateId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}${random}`;
}