/* ==========================================================================
   SEMS — Income Service
   Mirrors ExpenseService exactly: validation, category cross-check,
   aggregation, and eventBus events for income:created/updated/deleted so
   the real Dashboard (Phase 7) can react without being wired to this file
   directly.
   ========================================================================== */

import { createIncome } from '../models/Income.js';
import { Validator, validateField } from '../core/validator.js';
import { eventBus } from '../core/eventBus.js';

export class IncomeService {
  /**
   * @param {import('../repositories/IncomeRepository.js').IncomeRepository} incomeRepository
   * @param {import('../repositories/CategoryRepository.js').CategoryRepository} categoryRepository
   */
  constructor(incomeRepository, categoryRepository) {
    this.incomeRepository = incomeRepository;
    this.categoryRepository = categoryRepository;
  }

  async validateIncomeInput({ categoryId, amount, description, date }) {
    const errors = {};

    const categoryCheck = validateField(categoryId, [
      { test: (v) => Validator.isRequired(v), message: 'Source is required.' },
    ]);
    if (!categoryCheck.valid) errors.categoryId = categoryCheck.errors;

    const amountCheck = validateField(amount, [
      { test: (v) => Validator.isRequired(v), message: 'Amount is required.' },
      { test: (v) => Validator.isPositiveNumber(Number(v)), message: 'Amount must be a positive number.' },
    ]);
    if (!amountCheck.valid) errors.amount = amountCheck.errors;

    const descriptionCheck = validateField(description, [
      { test: (v) => Validator.isRequired(v), message: 'Description is required.' },
      { test: (v) => Validator.maxLength(v, 120), message: 'Description must be under 120 characters.' },
    ]);
    if (!descriptionCheck.valid) errors.description = descriptionCheck.errors;

    const dateCheck = validateField(date, [
      { test: (v) => Validator.isRequired(v), message: 'Date is required.' },
      { test: (v) => Validator.isValidDate(v), message: 'Date is invalid.' },
      { test: (v) => Validator.isDateNotInFuture(v), message: 'Date cannot be in the future.' },
    ]);
    if (!dateCheck.valid) errors.date = dateCheck.errors;

    if (categoryCheck.valid) {
      const category = await this.categoryRepository.getById(categoryId);
      if (!category || category.type !== 'income') {
        errors.categoryId = [...(errors.categoryId || []), 'Selected source is invalid.'];
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  async createIncome(input) {
    const { valid, errors } = await this.validateIncomeInput(input);
    if (!valid) return { success: false, errors };

    const income = createIncome({
      categoryId: input.categoryId,
      amount: Number(input.amount),
      description: input.description.trim(),
      date: input.date,
    });

    const created = await this.incomeRepository.create(income);
    eventBus.emit('income:created', created);
    return { success: true, data: created };
  }

  async updateIncome(id, input) {
    const { valid, errors } = await this.validateIncomeInput(input);
    if (!valid) return { success: false, errors };

    const updated = await this.incomeRepository.update(id, {
      categoryId: input.categoryId,
      amount: Number(input.amount),
      description: input.description.trim(),
      date: input.date,
    });

    if (!updated) return { success: false, errors: { general: ['Income not found.'] } };

    eventBus.emit('income:updated', updated);
    return { success: true, data: updated };
  }

  async deleteIncome(id) {
    const removed = await this.incomeRepository.remove(id);
    if (removed) eventBus.emit('income:deleted', { id });
    return removed;
  }

  async getAllWithCategory() {
    const [incomeEntries, categories] = await Promise.all([
      this.incomeRepository.getSortedByDateDesc(),
      this.categoryRepository.getAll(),
    ]);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    return incomeEntries.map((entry) => ({
      ...entry,
      category: categoryMap.get(entry.categoryId) || null,
    }));
  }

  async getTotalForCurrentMonth() {
    const now = new Date();
    const monthIncome = await this.incomeRepository.getByMonth(now.getFullYear(), now.getMonth());
    return monthIncome.reduce((sum, i) => sum + i.amount, 0);
  }
}

export default IncomeService;