/* ==========================================================================
   SEMS — User Model
   Defines the shape of a User record. Real authentication doesn't exist
   until Phase 14, so for now this supports a single local "profile" — no
   password, no email verification, just a name to personalize the UI.
   ========================================================================== */

import { generateId } from '../core/utils.js';

/**
 * Creates a User object with a consistent shape.
 * @param {Object} data
 * @param {string} data.name
 * @param {string} [data.email]
 */
export function createUser({ name, email = '' }) {
  if (!name || typeof name !== 'string') {
    throw new TypeError('createUser: "name" is required and must be a string.');
  }

  return {
    id: generateId('user'),
    name,
    email,
    createdAt: new Date().toISOString(),
  };
}