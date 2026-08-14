/* ==========================================================================
   SEMS — Budget Service
   Business logic for setting/updating overall and per-category budgets,
   and building the full "budget overview" the UI needs — which requires
   reading real expense data from ExpenseRepository directly (not
   ExpenseService, to avoid an unnecessary extra layer for a simple sum).
   ========================================================================== */

import { createBudget } from '../models/Budget.js';
import { Validator, validateField } from '../core/validator.js';
import { eventBus } from '../core/eventBus.js';

export class BudgetService {
  /**
   * @param {import('../repositories/BudgetRepository.js').BudgetRepository} budgetRepository
   * @param {import('../repositories/ExpenseRepository.js').ExpenseRepository} expenseRepository
   * @param {import('../repositories/CategoryRepository.js').CategoryRepository} categoryRepository
   */
  constructor(budgetRepository, expenseRepository, categoryRepository) {
    this.budgetRepository = budgetRepository;
    this.expenseRepository = expenseRepository;
    this.categoryRepository = categoryRepository;
  }

  validateAmount(amount) {
    return validateField(amount, [
      { test: (v) => Validator.isRequired(v), message: 'Amount is required.' },
      { test: (v) => Validator.isPositiveNumber(Number(v)), message: 'Amount must be a positive number.' },
    ]);
  }

  async setOverallBudget(amount, month, year) {
    const check = this.validateAmount(amount);
    if (!check.valid) return { success: false, errors: { amount: check.errors } };

    const existing = await this.budgetRepository.getOverallForMonth(year, month);
    const result = existing
      ? await this.budgetRepository.update(existing.id, { amount: Number(amount) })
      : await this.budgetRepository.create(createBudget({ categoryId: null, amount: Number(amount), month, year }));

    eventBus.emit('budget:updated', result);
    return { success: true, data: result };
  }

  async setCategoryBudget(categoryId, amount, month, year) {
    const check = this.validateAmount(amount);
    if (!check.valid) return { success: false, errors: { amount: check.errors } };

    const category = await this.categoryRepository.getById(categoryId);
    if (!category || category.type !== 'expense') {
      return { success: false, errors: { categoryId: ['Selected category is invalid.'] } };
    }

    const existing = await this.budgetRepository.getByCategoryForMonth(categoryId, year, month);
    const result = existing
      ? await this.budgetRepository.update(existing.id, { amount: Number(amount) })
      : await this.budgetRepository.create(createBudget({ categoryId, amount: Number(amount), month, year }));

    eventBus.emit('budget:updated', result);
    return { success: true, data: result };
  }

  async removeCategoryBudget(id) {
    const removed = await this.budgetRepository.remove(id);
    if (removed) eventBus.emit('budget:updated', { id, removed: true });
    return removed;
  }

  /**
   * Returns the user's overall monthly budget amount (categoryId === null)
   * for the current calendar month, or null if none is set. Used by the
   * Dashboard so "Remaining Budget" reflects the real monthly budget instead
   * of income. Reuses BudgetRepository.getOverallForMonth — no new structure.
   */
  async getOverallBudgetForCurrentMonth() {
    const now = new Date();
    const overall = await this.budgetRepository.getOverallForMonth(now.getFullYear(), now.getMonth());
    return overall ? Number(overall.amount) : null;
  }

  _statusFor(spent, budgetAmount) {
    if (!budgetAmount || budgetAmount <= 0) return 'none';
    const percent = (spent / budgetAmount) * 100;
    if (percent > 100) return 'over';
    if (percent >= 80) return 'warning';
    return 'ok';
  }

  /**
   * Builds the full budget overview for a given month: the overall budget
   * vs total spent, plus a per-category breakdown for every expense
   * category that has spending and/or a budget set this month.
   */
  async getBudgetOverview(year, month) {
    const [overallBudget, monthBudgets, monthExpenses, expenseCategories] = await Promise.all([
      this.budgetRepository.getOverallForMonth(year, month),
      this.budgetRepository.getForMonth(year, month),
      this.expenseRepository.getByMonth(year, month),
      this.categoryRepository.getByType('expense'),
    ]);

    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const spentByCategory = new Map();
    for (const expense of monthExpenses) {
      spentByCategory.set(expense.categoryId, (spentByCategory.get(expense.categoryId) || 0) + expense.amount);
    }

    const budgetsByCategory = new Map(
      monthBudgets.filter((b) => b.categoryId !== null).map((b) => [b.categoryId, b])
    );

    // Every category with either spending OR a budget set gets a row.
    const relevantCategoryIds = new Set([...spentByCategory.keys(), ...budgetsByCategory.keys()]);
    const categoryMap = new Map(expenseCategories.map((c) => [c.id, c]));

    const categoryBreakdown = [...relevantCategoryIds]
      .map((categoryId) => {
        const category = categoryMap.get(categoryId);
        const spent = spentByCategory.get(categoryId) || 0;
        const budget = budgetsByCategory.get(categoryId) || null;
        const budgetAmount = budget ? budget.amount : null;

        return {
          categoryId,
          categoryName: category ? category.name : 'Uncategorized',
          categoryColor: category ? category.color : '#6B7280',
          spent,
          budgetAmount,
          budgetId: budget ? budget.id : null,
          percent: budgetAmount ? Math.min((spent / budgetAmount) * 100, 999) : null,
          status: this._statusFor(spent, budgetAmount),
        };
      })
      .sort((a, b) => b.spent - a.spent);

    return {
      overall: {
        budgetId: overallBudget ? overallBudget.id : null,
        budgetAmount: overallBudget ? overallBudget.amount : null,
        spent: totalSpent,
        percent: overallBudget ? Math.min((totalSpent / overallBudget.amount) * 100, 999) : null,
        status: this._statusFor(totalSpent, overallBudget ? overallBudget.amount : null),
      },
      categoryBreakdown,
      allExpenseCategories: expenseCategories,
    };
  }
}

export default BudgetService;