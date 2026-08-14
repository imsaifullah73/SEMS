/* ==========================================================================
   SEMS Backend — Income Controller
   Phase 14: mirrors expenseController.js exactly, pointed at "income".
   ========================================================================== */

import { db } from '../data/prismaStore.js';

function validateIncomeInput(body) {
  const errors = {};

  if (!body.categoryId || typeof body.categoryId !== 'string') {
    errors.categoryId = 'Source is required.';
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

export async function getIncome(req, res, next) {
  try {
    const income = await db.getAll('income', { userId: req.user.id });
    res.json(income);
  } catch (error) {
    next(error);
  }
}

export async function getIncomeById(req, res, next) {
  try {
    const income = await db.getById('income', req.params.id, { userId: req.user.id });
    if (!income) return res.status(404).json({ error: 'Income entry not found.' });
    res.json(income);
  } catch (error) {
    next(error);
  }
}

export async function createIncome(req, res, next) {
  try {
    const { valid, errors } = validateIncomeInput(req.body);
    if (!valid) return res.status(400).json({ errors });

    const ownsCategory = await assertCategoryOwnership(req.body.categoryId, req.user.id);
    if (!ownsCategory) {
      return res.status(400).json({ errors: { categoryId: 'Selected source is invalid.' } });
    }

    const created = await db.create('income', {
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

export async function updateIncome(req, res, next) {
  try {
    const { valid, errors } = validateIncomeInput(req.body);
    if (!valid) return res.status(400).json({ errors });

    const ownsCategory = await assertCategoryOwnership(req.body.categoryId, req.user.id);
    if (!ownsCategory) {
      return res.status(400).json({ errors: { categoryId: 'Selected source is invalid.' } });
    }

    const updated = await db.update(
      'income',
      req.params.id,
      {
        categoryId: req.body.categoryId,
        amount: Number(req.body.amount),
        description: req.body.description.trim(),
        date: new Date(req.body.date),
      },
      { userId: req.user.id }
    );

    if (!updated) return res.status(404).json({ error: 'Income entry not found.' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteIncome(req, res, next) {
  try {
    const removed = await db.remove('income', req.params.id, { userId: req.user.id });
    if (!removed) return res.status(404).json({ error: 'Income entry not found.' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}