import { db } from '../data/prismaStore.js';

export async function getCategories(req, res, next) {
  try {
    const { type } = req.query;
    const where = { userId: req.user.id };
    if (type) where.type = type;
    const categories = await db.getAll('categories', where);
    res.json(categories);
  } catch (error) {
    next(error);
  }
}

export async function getCategoryById(req, res, next) {
  try {
    const category = await db.getById('categories', req.params.id, { userId: req.user.id });
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    res.json(category);
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, type, color } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: '"name" is required and must be a string.' });
    }
    if (type !== 'expense' && type !== 'income') {
      return res.status(400).json({ error: '"type" must be either "expense" or "income".' });
    }

    const created = await db.create('categories', {
      userId: req.user.id,
      name,
      type,
      color: color || '#6B7280',
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { name, type, color } = req.body;

    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({ error: '"name" must be a string.' });
    }
    if (type !== undefined && type !== 'expense' && type !== 'income') {
      return res.status(400).json({ error: '"type" must be either "expense" or "income".' });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (color !== undefined) data.color = color;

    const updated = await db.update('categories', req.params.id, data, {
      userId: req.user.id,
    });

    if (!updated) return res.status(404).json({ error: 'Category not found.' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const removed = await db.remove('categories', req.params.id, {
      userId: req.user.id,
    });
    if (!removed) return res.status(404).json({ error: 'Category not found.' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}