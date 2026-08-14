/* ==========================================================================
   SEMS — Category Model
   Defines the shape of a Category record and provides the default set of
   categories every new user starts with. CategoryRepository seeds these
   into storage the first time the app runs.
   ========================================================================== */

import { generateId } from '../core/utils.js';

/**
 * Creates a Category object with a consistent shape.
 * @param {Object} data
 * @param {string} data.name
 * @param {'expense'|'income'} data.type
 * @param {string} [data.color] - CSS color value used for the category dot/badge.
 * @param {string} [data.icon]  - Reserved for a future icon key (Phase 5+ UI).
 */
export function createCategory({ name, type, color = '#6B7280', icon = 'tag' }) {
  if (!name || typeof name !== 'string') {
    throw new TypeError('createCategory: "name" is required and must be a string.');
  }
  if (type !== 'expense' && type !== 'income') {
    throw new TypeError('createCategory: "type" must be either "expense" or "income".');
  }

  return {
    id: generateId('cat'),
    name,
    type,
    color,
    icon,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Default categories seeded for every new local install.
 * Colors are chosen from the SEMS design tokens' primitive palette
 * (variables.css) so they stay visually consistent with the rest of the app.
 */
export const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Food',          type: 'expense', color: '#D97706' }, // amber-500
  { name: 'Transport',     type: 'expense', color: '#2563EB' }, // blue-600
  { name: 'Books & Fees',  type: 'expense', color: '#2B3467' }, // indigo-600
  { name: 'Rent',          type: 'expense', color: '#DC2626' }, // red-600
  { name: 'Entertainment', type: 'expense', color: '#D4A017' }, // gold-500
  { name: 'Other',         type: 'expense', color: '#6B7280' }, // slate-500

  // Income categories
  { name: 'Allowance',     type: 'income', color: '#15803D' }, // emerald-600
  { name: 'Scholarship',   type: 'income', color: '#1F9D5C' }, // emerald-500
  { name: 'Part-time Job', type: 'income', color: '#0F6B44' }, // emerald-700
  { name: 'Other Income',  type: 'income', color: '#6B7280' }, // slate-500
];