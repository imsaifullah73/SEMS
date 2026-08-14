/* ==========================================================================
   SEMS Backend — Expense Controller
   Phase 14: every query scoped to req.user.id. createExpense/updateExpense
   also verify the given categoryId actually belongs to this user before
   accepting it, so a user can't attach their expense to someone else's
   category by guessing an id.
   ========================================================================== */

import { db } from '../data/prismaStore.js';

function validateExpenseInput(body) {
  const errors = {};

  if (!body.categoryId || typeof body.categoryId !== 'string') {
    errors.categoryId = 'Category is required.';
  }

  const amount = Number(body.amount);
  if (!body.amount || Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'Amount must be a positive number.';
  }

  if (!body.description || typeof body.description !== 'string') {
    errors.description = 'Description is required.';
  }

  if (!body.date) {
    errors.date = 'Date is required.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

async function assertCategoryOwnership(categoryId, userId) {
  const category = await db.getById('categories', categoryId, { userId });
  return Boolean(category);
}

export async function getExpenses(req, res, next) {
  try {
    const expenses = await db.getAll('expenses', { userId: req.user.id });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
}

export async function getExpenseById(req, res, next) {
  try {
    const expense = await db.getById('expenses', req.params.id, { userId: req.user.id });
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.json(expense);
  } catch (error) {
    next(error);
  }
}

export async function createExpense(req, res, next) {
  try {
    const { valid, errors } = validateExpenseInput(req.body);
    if (!valid) return res.status(400).json({ errors });

    const ownsCategory = await assertCategoryOwnership(req.body.categoryId, req.user.id);
    if (!ownsCategory) {
      return res.status(400).json({ errors: { categoryId: 'Selected category is invalid.' } });
    }

    const created = await db.create('expenses', {
      userId: req.user.id,
      categoryId: req.body.categoryId,
      amount: Number(req.body.amount),
      description: req.body.description.trim(),
      date: new Date(req.body.date),
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateExpense(req, res, next) {
  try {
    const { valid, errors } = validateExpenseInput(req.body);
    if (!valid) return res.status(400).json({ errors });

    const ownsCategory = await assertCategoryOwnership(req.body.categoryId, req.user.id);
    if (!ownsCategory) {
      return res.status(400).json({ errors: { categoryId: 'Selected category is invalid.' } });
    }

    const updated = await db.update(
      'expenses',
      req.params.id,
      {
        categoryId: req.body.categoryId,
        amount: Number(req.body.amount),
        description: req.body.description.trim(),
        date: new Date(req.body.date),
      },
      { userId: req.user.id }
    );

    if (!updated) return res.status(404).json({ error: 'Expense not found.' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const removed = await db.remove('expenses', req.params.id, { userId: req.user.id });
    if (!removed) return res.status(404).json({ error: 'Expense not found.' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}