/* ==========================================================================
   SEMS — Expense Service
   Business logic layer between the UI and ExpenseRepository: validation,
   category-existence checks, aggregation (monthly totals), and emitting
   eventBus events so other parts of the app (e.g. the Dashboard in Phase 7)
   can react to expense changes without being directly wired to this code.
   ========================================================================== */

import { createExpense } from '../models/Expense.js';
import { Validator, validateField } from '../core/validator.js';
import { eventBus } from '../core/eventBus.js';

export class ExpenseService {
  /**
   * @param {import('../repositories/ExpenseRepository.js').ExpenseRepository} expenseRepository
   * @param {import('../repositories/CategoryRepository.js').CategoryRepository} categoryRepository
   */
  constructor(expenseRepository, categoryRepository) {
    this.expenseRepository = expenseRepository;
    this.categoryRepository = categoryRepository;
  }

  /**
   * Validates raw form input. Returns { valid, errors } where errors is a
   * map of fieldName -> array of error message strings.
   */
  async validateExpenseInput({ categoryId, amount, description, date }) {
    const errors = {};

    const categoryCheck = validateField(categoryId, [
      { test: (v) => Validator.isRequired(v), message: 'Category is required.' },
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

    // Cross-check: category must actually exist and be an expense-type category.
    if (categoryCheck.valid) {
      const category = await this.categoryRepository.getById(categoryId);
      if (!category || category.type !== 'expense') {
        errors.categoryId = [...(errors.categoryId || []), 'Selected category is invalid.'];
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  async createExpense(input) {
    const { valid, errors } = await this.validateExpenseInput(input);
    if (!valid) return { success: false, errors };

    const expense = createExpense({
      categoryId: input.categoryId,
      amount: Number(input.amount),
      description: input.description.trim(),
      date: input.date,
    });

    const created = await this.expenseRepository.create(expense);
    eventBus.emit('expense:created', created);
    return { success: true, data: created };
  }

  async updateExpense(id, input) {
    const { valid, errors } = await this.validateExpenseInput(input);
    if (!valid) return { success: false, errors };

    const updated = await this.expenseRepository.update(id, {
      categoryId: input.categoryId,
      amount: Number(input.amount),
      description: input.description.trim(),
      date: input.date,
    });

    if (!updated) return { success: false, errors: { general: ['Expense not found.'] } };

    eventBus.emit('expense:updated', updated);
    return { success: true, data: updated };
  }

  async deleteExpense(id) {
    const removed = await this.expenseRepository.remove(id);
    if (removed) eventBus.emit('expense:deleted', { id });
    return removed;
  }

  /**
   * Returns all expenses newest-first, each enriched with its full category
   * object (so the UI never has to do its own lookups/joins).
   */
  async getAllWithCategory() {
    const [expenses, categories] = await Promise.all([
      this.expenseRepository.getSortedByDateDesc(),
      this.categoryRepository.getAll(),
    ]);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    return expenses.map((expense) => ({
      ...expense,
      category: categoryMap.get(expense.categoryId) || null,
    }));
  }

  async getTotalForCurrentMonth() {
    const now = new Date();
    const monthExpenses = await this.expenseRepository.getByMonth(now.getFullYear(), now.getMonth());
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }
}

export default ExpenseService;