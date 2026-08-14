/* ==========================================================================
   SEMS — Income Model
   Defines the shape of an Income record. Mirrors Expense.js exactly —
   uses categoryId (not a separate "source" concept), since CategoryRepository
   already stores both expense- and income-type categories in one collection.
   ========================================================================== */

import { generateId } from '../core/utils.js';

/**
 * Creates an Income object with a consistent shape.
 * @param {Object} data
 * @param {string} data.categoryId
 * @param {number} data.amount
 * @param {string} data.description
 * @param {string} data.date - ISO date string, e.g. "2026-08-07"
 */
export function createIncome({ categoryId, amount, description, date }) {
  if (!categoryId || typeof categoryId !== 'string') {
    throw new TypeError('createIncome: "categoryId" is required and must be a string.');
  }
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    throw new TypeError('createIncome: "amount" must be a positive number.');
  }
  if (!description || typeof description !== 'string') {
    throw new TypeError('createIncome: "description" is required and must be a string.');
  }
  if (!date || typeof date !== 'string') {
    throw new TypeError('createIncome: "date" is required and must be a date string.');
  }

  return {
    id: generateId('inc'),
    categoryId,
    amount,
    description,
    date,
    createdAt: new Date().toISOString(),
  };
}