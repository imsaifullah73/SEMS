/* ==========================================================================
   SEMS Backend — Prisma Data Store
   Phase 14: getById/update/remove now accept an extraWhere object (used to
   pass { userId } from controllers), so a user can never read, edit, or
   delete another user's data even if they guess a valid record id.
   update/remove use updateMany/deleteMany internally since Prisma's
   .update()/.delete() only accept a single unique field in `where` —
   combining id + userId requires the "many" variants, then we check count.
   ========================================================================== */

import { prisma } from '../config/prismaClient.js';

const modelMap = {
  categories: prisma.category,
  expenses: prisma.expense,
  income: prisma.income,
  budgets: prisma.budget,
};

const includeMap = {
  categories: undefined,
  expenses: { category: true },
  income: { category: true },
  budgets: { category: true },
};

const orderByMap = {
  categories: { name: 'asc' },
  expenses: { date: 'desc' },
  income: { date: 'desc' },
  budgets: { createdAt: 'desc' },
};

export const db = {
  async getAll(collection, where = {}) {
    return modelMap[collection].findMany({
      where,
      include: includeMap[collection],
      orderBy: orderByMap[collection],
    });
  },

  async getById(collection, id, extraWhere = {}) {
    return modelMap[collection].findFirst({
      where: { id, ...extraWhere },
      include: includeMap[collection],
    });
  },

  async create(collection, data) {
    return modelMap[collection].create({
      data,
      include: includeMap[collection],
    });
  },

  async update(collection, id, data, extraWhere = {}) {
    const result = await modelMap[collection].updateMany({
      where: { id, ...extraWhere },
      data,
    });
    if (result.count === 0) return null;
    return modelMap[collection].findFirst({
      where: { id },
      include: includeMap[collection],
    });
  },

  async remove(collection, id, extraWhere = {}) {
    const result = await modelMap[collection].deleteMany({
      where: { id, ...extraWhere },
    });
    return result.count > 0;
  },
};

export default db;