/* ==========================================================================
   SEMS Backend — Budget Controller
   Phase 14: every query scoped to req.user.id. If a categoryId is given,
   ownership is verified the same way as expenses/income.
   ========================================================================== */

import { db } from '../data/prismaStore.js';

function validateBudgetInput(body) {
  const errors = {};

  const amount = Number(body.amount);
  if (!body.amount || Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'Amount must be a positive number.';
  }

  if (typeof body.month !== 'number' || body.month < 0 || body.month > 11) {
    errors.month = 'Month must be between 0 and 11.';
  }

  if (typeof body.year !== 'number' || body.year < 2000) {
    errors.year = 'Year is invalid.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

async function assertCategoryOwnership(categoryId, userId) {
  if (!categoryId) return true; // null categoryId = overall budget, always allowed
  const category = await db.getById('categories', categoryId, { userId });
  return Boolean(category);
}

export async function getBudgets(req, res, next) {
  try {
    const { year, month } = req.query;
    const where = { userId: req.user.id };
    if (year !== undefined && month !== undefined) {
      where.year = Number(year);
      where.month = Number(month);
    }
    const budgets = await db.getAll('budgets', where);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
}

export async function createBudget(req, res, next) {
  try {
    const { valid, errors } = validateBudgetInput(req.body);
    if (!valid) return res.status(400).json({ errors });

    const ownsCategory = await assertCategoryOwnership(req.body.categoryId, req.user.id);
    if (!ownsCategory) {
      return res.status(400).json({ errors: { categoryId: 'Selected category is invalid.' } });
    }

    const created = await db.create('budgets', {
      userId: req.user.id,
      categoryId: req.body.categoryId || null,
      amount: Number(req.body.amount),
      month: Number(req.body.month),
      year: Number(req.body.year),
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateBudget(req, res, next) {
  try {
    const { valid, errors } = validateBudgetInput(req.body);
    if (!valid) return res.status(400).json({ errors });

    const updated = await db.update(
      'budgets',
      req.params.id,
      { amount: Number(req.body.amount) },
      { userId: req.user.id }
    );

    if (!updated) return res.status(404).json({ error: 'Budget not found.' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteBudget(req, res, next) {
  try {
    const removed = await db.remove('budgets', req.params.id, { userId: req.user.id });
    if (!removed) return res.status(404).json({ error: 'Budget not found.' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}