/* ==========================================================================
   SEMS — Expense Model
   Defines the shape of an Expense record.
   ========================================================================== */

import { generateId } from '../core/utils.js';

/**
 * Creates an Expense object with a consistent shape.
 * @param {Object} data
 * @param {string} data.categoryId
 * @param {number} data.amount
 * @param {string} data.description
 * @param {string} data.date - ISO date string, e.g. "2026-08-07"
 */
export function createExpense({ categoryId, amount, description, date }) {
  if (!categoryId || typeof categoryId !== 'string') {
    throw new TypeError('createExpense: "categoryId" is required and must be a string.');
  }
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    throw new TypeError('createExpense: "amount" must be a positive number.');
  }
  if (!description || typeof description !== 'string') {
    throw new TypeError('createExpense: "description" is required and must be a string.');
  }
  if (!date || typeof date !== 'string') {
    throw new TypeError('createExpense: "date" is required and must be a date string.');
  }

  return {
    id: generateId('exp'),
    categoryId,
    amount,
    description,
    date,
    createdAt: new Date().toISOString(),
  };
}