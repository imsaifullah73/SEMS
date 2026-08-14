/* ==========================================================================
   SEMS — Report Service
   Builds time-bucketed income/expense trends and category breakdowns for
   the Reports page. Reads directly from ExpenseRepository/IncomeRepository
   (raw records) since it needs custom date-range filtering that the
   Expense/Income Services don't provide — this avoids adding report-only
   methods to services that other pages don't need.
   ========================================================================== */

import { parseLocalDate } from '../core/utils.js';

export class ReportService {
  /**
   * @param {import('../repositories/ExpenseRepository.js').ExpenseRepository} expenseRepository
   * @param {import('../repositories/IncomeRepository.js').IncomeRepository} incomeRepository
   * @param {import('../repositories/CategoryRepository.js').CategoryRepository} categoryRepository
   */
  constructor(expenseRepository, incomeRepository, categoryRepository) {
    this.expenseRepository = expenseRepository;
    this.incomeRepository = incomeRepository;
    this.categoryRepository = categoryRepository;
  }

  _startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  _endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  _startOfWeek(date) {
    const d = this._startOfDay(date);
    const day = d.getDay(); // 0 = Sunday
    const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
    d.setDate(d.getDate() + diff);
    return d;
  }

  _buildDailyBuckets(count = 7) {
    const buckets = [];
    const today = this._startOfDay(new Date());
    for (let i = count - 1; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(start.getDate() - i);
      buckets.push({
        start,
        end: this._endOfDay(start),
        label: start.toLocaleDateString('en-GB', { weekday: 'short' }),
      });
    }
    return buckets;
  }

  _buildWeeklyBuckets(count = 6) {
    const buckets = [];
    const currentWeekStart = this._startOfWeek(new Date());
    for (let i = count - 1; i >= 0; i--) {
      const start = new Date(currentWeekStart);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      buckets.push({
        start,
        end: this._endOfDay(end),
        label: start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      });
    }
    return buckets;
  }

  _buildMonthlyBuckets(count = 6) {
    const buckets = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = this._endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      buckets.push({
        start: this._startOfDay(d),
        end,
        label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      });
    }
    return buckets;
  }

  _buildYearlyBuckets(count = 5) {
    const buckets = [];
    const currentYear = new Date().getFullYear();
    for (let i = count - 1; i >= 0; i--) {
      const year = currentYear - i;
      buckets.push({
        start: this._startOfDay(new Date(year, 0, 1)),
        end: this._endOfDay(new Date(year, 11, 31)),
        label: String(year),
      });
    }
    return buckets;
  }

  _getBuckets(periodType) {
    switch (periodType) {
      case 'daily':
        return this._buildDailyBuckets(7);
      case 'weekly':
        return this._buildWeeklyBuckets(6);
      case 'monthly':
        return this._buildMonthlyBuckets(6);
      case 'yearly':
        return this._buildYearlyBuckets(5);
      default:
        throw new Error(`ReportService: unknown periodType "${periodType}".`);
    }
  }

  /**
   * Returns { labels, incomeData, expenseData } — one number per bucket,
   * ready to feed directly into a Chart.js bar/line chart.
   */
  async getTrendData(periodType) {
    const buckets = this._getBuckets(periodType);
    const [expenses, incomeEntries] = await Promise.all([
      this.expenseRepository.getAll(),
      this.incomeRepository.getAll(),
    ]);

    const labels = buckets.map((b) => b.label);

    const incomeData = buckets.map((bucket) =>
      incomeEntries
        .filter((entry) => {
          const d = parseLocalDate(entry.date);
          return d >= bucket.start && d <= bucket.end;
        })
        .reduce((sum, entry) => sum + entry.amount, 0)
    );

    const expenseData = buckets.map((bucket) =>
      expenses
        .filter((entry) => {
          const d = parseLocalDate(entry.date);
          return d >= bucket.start && d <= bucket.end;
        })
        .reduce((sum, entry) => sum + entry.amount, 0)
    );

    return {
      labels,
      incomeData,
      expenseData,
      rangeStart: buckets[0].start,
      rangeEnd: buckets[buckets.length - 1].end,
    };
  }

  /**
   * Returns { labels, data, colors } — expense totals grouped by category,
   * across the entire visible range for the given periodType, sorted
   * highest-spend first. Ready for a Chart.js doughnut/pie chart.
   */
  async getCategoryBreakdown(periodType) {
    const buckets = this._getBuckets(periodType);
    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;

    const [expenses, categories] = await Promise.all([
      this.expenseRepository.getAll(),
      this.categoryRepository.getByType('expense'),
    ]);

    const inRange = expenses.filter((e) => {
      const d = parseLocalDate(e.date);
      return d >= rangeStart && d <= rangeEnd;
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const totals = new Map();
    for (const expense of inRange) {
      totals.set(expense.categoryId, (totals.get(expense.categoryId) || 0) + expense.amount);
    }

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);

    return {
      labels: sorted.map(([categoryId]) =>
        categoryMap.get(categoryId) ? categoryMap.get(categoryId).name : 'Uncategorized'
      ),
      data: sorted.map(([, amount]) => amount),
      colors: sorted.map(([categoryId]) =>
        categoryMap.get(categoryId) ? categoryMap.get(categoryId).color : '#6B7280'
      ),
    };
  }

  /**
   * Returns { totalIncome, totalExpenses, net } for the visible range of
   * the given periodType — derived from getTrendData so the numbers always
   * match what the chart shows.
   */
  async getSummaryTotals(periodType) {
    const trend = await this.getTrendData(periodType);
    const totalIncome = trend.incomeData.reduce((a, b) => a + b, 0);
    const totalExpenses = trend.expenseData.reduce((a, b) => a + b, 0);
    return { totalIncome, totalExpenses, net: totalIncome - totalExpenses };
  }

  /**
   * Fetches the underlying expense/income/category records ONCE for a given
   * period and derives everything the Reports page needs from that shared
   * dataset — the trend chart, the category breakdown, and the summary
   * totals. Avoids the redundant fetches that would occur if the page called
   * getTrendData / getCategoryBreakdown / getSummaryTotals separately.
   *
   * Returns { trend, categoryBreakdown, summary } where each is shaped
   * exactly like the corresponding existing method's return value.
   */
  async getAllReportData(periodType) {
    const buckets = this._getBuckets(periodType);
    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;

    const [expenses, incomeEntries, categories] = await Promise.all([
      this.expenseRepository.getAll(),
      this.incomeRepository.getAll(),
      this.categoryRepository.getByType('expense'),
    ]);

    // --- Trend (same computation as getTrendData) ---
    const labels = buckets.map((b) => b.label);

    const incomeData = buckets.map((bucket) =>
      incomeEntries
        .filter((entry) => {
          const d = parseLocalDate(entry.date);
          return d >= bucket.start && d <= bucket.end;
        })
        .reduce((sum, entry) => sum + entry.amount, 0)
    );

    const expenseData = buckets.map((bucket) =>
      expenses
        .filter((entry) => {
          const d = parseLocalDate(entry.date);
          return d >= bucket.start && d <= bucket.end;
        })
        .reduce((sum, entry) => sum + entry.amount, 0)
    );

    const trend = {
      labels,
      incomeData,
      expenseData,
      rangeStart,
      rangeEnd,
    };

    // --- Category breakdown (same computation as getCategoryBreakdown) ---
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const totals = new Map();
    for (const expense of expenses) {
      const d = parseLocalDate(expense.date);
      if (d >= rangeStart && d <= rangeEnd) {
        totals.set(expense.categoryId, (totals.get(expense.categoryId) || 0) + expense.amount);
      }
    }

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);

    const categoryBreakdown = {
      labels: sorted.map(([categoryId]) =>
        categoryMap.get(categoryId) ? categoryMap.get(categoryId).name : 'Uncategorized'
      ),
      data: sorted.map(([, amount]) => amount),
      colors: sorted.map(([categoryId]) =>
        categoryMap.get(categoryId) ? categoryMap.get(categoryId).color : '#6B7280'
      ),
    };

    // --- Summary totals (same computation as getSummaryTotals) ---
    const totalIncome = incomeData.reduce((a, b) => a + b, 0);
    const totalExpenses = expenseData.reduce((a, b) => a + b, 0);
    const summary = {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
    };

    return { trend, categoryBreakdown, summary };
  }
}

export default ReportService;