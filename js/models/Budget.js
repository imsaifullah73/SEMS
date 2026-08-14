/* ==========================================================================
   SEMS — Budget Model
   Defines the shape of a Budget record. categoryId = null means it's the
   OVERALL monthly budget; a real categoryId means it's a per-category
   budget (e.g. "Food: Rs. 5000 for August 2026"). Budgets are scoped to a
   specific month + year, so they naturally reset each month.
   ========================================================================== */

import { generateId } from '../core/utils.js';

/**
 * Creates a Budget object with a consistent shape.
 * @param {Object} data
 * @param {string|null} data.categoryId - null for the overall monthly budget
 * @param {number} data.amount
 * @param {number} data.month - 0-based (0 = January)
 * @param {number} data.year
 */
export function createBudget({ categoryId = null, amount, month, year }) {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    throw new TypeError('createBudget: "amount" must be a positive number.');
  }
  if (typeof month !== 'number' || month < 0 || month > 11) {
    throw new TypeError('createBudget: "month" must be between 0 and 11.');
  }
  if (typeof year !== 'number' || year < 2000) {
    throw new TypeError('createBudget: "year" must be a valid year.');
  }

  return {
    id: generateId('bud'),
    categoryId,
    amount,
    month,
    year,
    createdAt: new Date().toISOString(),
  };
}