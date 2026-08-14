/* ==========================================================================
   SEMS — Dashboard Service
   Aggregates data from ExpenseService and IncomeService into the shape the
   Dashboard UI needs: monthly totals, remaining budget, and a merged
   recent-transactions feed. Does not touch storage directly — composes the
   two existing services instead of duplicating their logic (DRY).
   ========================================================================== */

import { parseLocalDate } from '../core/utils.js';

export class DashboardService {
  /**
   * @param {import('./ExpenseService.js').ExpenseService} expenseService
   * @param {import('./IncomeService.js').IncomeService} incomeService
   * @param {import('./BudgetService.js').BudgetService} budgetService
   */
  constructor(expenseService, incomeService, budgetService) {
    this.expenseService = expenseService;
    this.incomeService = incomeService;
    this.budgetService = budgetService;
  }

  /**
   * Returns { totalIncome, totalExpenses, monthlyBudget, remainingBudget }
   * for the current calendar month. Remaining budget = the user's overall
   * monthly budget minus this month's expenses. Income is reported on its
   * own but no longer drives the "remaining" figure. When no overall budget
   * is set, monthlyBudget and remainingBudget are null so the UI can handle
   * the empty case gracefully.
   */
  async getMonthlySummary() {
    const [totalIncome, totalExpenses, monthlyBudget] = await Promise.all([
      this.incomeService.getTotalForCurrentMonth(),
      this.expenseService.getTotalForCurrentMonth(),
      this.budgetService.getOverallBudgetForCurrentMonth(),
    ]);

    return {
      totalIncome,
      totalExpenses,
      monthlyBudget,
      remainingBudget: monthlyBudget === null ? null : monthlyBudget - totalExpenses,
    };
  }

  /**
   * Merges expenses and income into one feed, each tagged with its type,
   * sorted newest-first, limited to `limit` entries.
   * @param {number} limit
   */
  async getRecentTransactions(limit = 6) {
    const [expenses, incomeEntries] = await Promise.all([
      this.expenseService.getAllWithCategory(),
      this.incomeService.getAllWithCategory(),
    ]);

    const tagged = [
      ...expenses.map((e) => ({ ...e, type: 'expense' })),
      ...incomeEntries.map((i) => ({ ...i, type: 'income' })),
    ];

    tagged.sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));

    return tagged.slice(0, limit);
  }

  /**
   * True if the user has never logged any expense or income — used to show
   * a first-time empty state instead of a wall of zeros.
   */
  async isCompletelyEmpty() {
    const [expenses, incomeEntries] = await Promise.all([
      this.expenseService.expenseRepository.getAll(),
      this.incomeService.incomeRepository.getAll(),
    ]);
    return expenses.length === 0 && incomeEntries.length === 0;
  }
}

export default DashboardService;