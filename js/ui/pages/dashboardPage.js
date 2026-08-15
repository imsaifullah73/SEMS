import { ApiAdapter } from '../../storage/ApiAdapter.js';
import { CategoryRepository } from '../../repositories/CategoryRepository.js';
import { ExpenseRepository } from '../../repositories/ExpenseRepository.js';
import { IncomeRepository } from '../../repositories/IncomeRepository.js';
import { BudgetRepository } from '../../repositories/BudgetRepository.js';
import { ExpenseService } from '../../services/ExpenseService.js';
import { IncomeService } from '../../services/IncomeService.js';
import { BudgetService } from '../../services/BudgetService.js';
import { DashboardService } from '../../services/DashboardService.js';
import { formatCurrency, formatDate, formatDateTime, qs, log, skeletonRowsHtml, errorBannerHtml } from '../../core/utils.js';
import { CONFIG } from '../../core/config.js';
import { initSidebarToggle } from '../components/SidebarToggle.js';
import { initThemeToggle } from '../components/ThemeToggle.js';
import { requireAuth, renderUserAvatar, wireLogoutButton } from '../components/AuthGuard.js';

const storageAdapter = new ApiAdapter();
const categoryRepository = new CategoryRepository(storageAdapter);
const expenseRepository = new ExpenseRepository(storageAdapter);
const incomeRepository = new IncomeRepository(storageAdapter);
const budgetRepository = new BudgetRepository(storageAdapter);

const expenseService = new ExpenseService(expenseRepository, categoryRepository);
const incomeService = new IncomeService(incomeRepository, categoryRepository);
const budgetService = new BudgetService(budgetRepository, expenseRepository, categoryRepository);
const dashboardService = new DashboardService(expenseService, incomeService, budgetService);

function renderSummary({ totalIncome, totalExpenses, remainingBudget }) {
  const incomeEl = qs('[data-dash="total-income"]');
  const expensesEl = qs('[data-dash="total-expenses"]');
  const remainingEl = qs('[data-dash="remaining-budget"]');
  const remainingNoteEl = qs('[data-dash="remaining-note"]');

  if (incomeEl) incomeEl.textContent = formatCurrency(totalIncome);
  if (expensesEl) expensesEl.textContent = formatCurrency(totalExpenses);

  // No overall monthly budget set yet — show a neutral placeholder instead
  // of a misleading "income - expenses" figure.
  if (remainingBudget === null) {
    if (remainingEl) {
      remainingEl.textContent = '\u2014';
      remainingEl.classList.remove('amount--positive', 'amount--negative');
    }
    if (remainingNoteEl) remainingNoteEl.textContent = 'No monthly budget set';
    return;
  }

  if (remainingEl) {
    remainingEl.textContent = formatCurrency(Math.abs(remainingBudget));
    remainingEl.classList.remove('amount--positive', 'amount--negative');
    remainingEl.classList.add(remainingBudget >= 0 ? 'amount--positive' : 'amount--negative');
  }

  if (remainingNoteEl) {
    remainingNoteEl.textContent = remainingBudget >= 0 ? 'Left over this month' : 'Over spent this month';
  }
}

function renderEmptyState() {
  const container = qs('[data-dash="recent-list"]');
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <p class="empty-state__title">Nothing logged yet</p>
      <p class="empty-state__text text-muted">Add your first expense or income entry to see your activity here.</p>
    </div>
  `;
}

function renderRecentTransactions(transactions) {
  const container = qs('[data-dash="recent-list"]');
  if (!container) return;

  if (transactions.length === 0) {
    renderEmptyState();
    return;
  }

  const rows = transactions
    .map((tx) => {
      const isExpense = tx.type === 'expense';
      const amountClass = isExpense ? 'amount--negative' : 'amount--positive';
      const sign = isExpense ? '\u2212' : '+';
      const badgeColor = tx.category ? tx.category.color : '#6B7280';
      const categoryName = tx.category ? tx.category.name : 'Uncategorized';

      return `
        <tr>
          <td><span class="badge" style="--badge-color: ${badgeColor};">${categoryName}</span></td>
          <td>${tx.description}</td>
          <td class="text-muted text-sm">${tx.createdAt ? formatDateTime(tx.createdAt) : formatDate(tx.date)}</td>
          <td class="amount ${amountClass}" style="text-align:right;">${sign} ${formatCurrency(tx.amount)}</td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <table class="table">
      <thead>
<tr><th>Category</th><th>Description</th><th>Date &amp; Time</th><th style="text-align:right;">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderLoading() {
  const container = qs('[data-dash="recent-list"]');
  if (!container) return;
  container.innerHTML = `
    <table class="table">
      <thead><tr><th>Category</th><th>Description</th><th>Date</th><th style="text-align:right;">Amount</th></tr></thead>
      <tbody>${skeletonRowsHtml(4, 4)}</tbody>
    </table>
  `;
}

function renderError() {
  const container = qs('[data-dash="recent-list"]');
  if (container) container.innerHTML = errorBannerHtml('Could not load your recent activity. Please refresh the page.');
}

async function init() {
  const user = requireAuth();
  if (!user) return;

  initSidebarToggle();
  initThemeToggle();
  wireLogoutButton();
  renderUserAvatar(user);

  renderLoading();

  try {
    const [summary, recentTransactions] = await Promise.all([
      dashboardService.getMonthlySummary(),
      dashboardService.getRecentTransactions(6),
    ]);

    renderSummary(summary);
    renderRecentTransactions(recentTransactions);

    log(`${CONFIG.APP_NAME} dashboard loaded — Income: ${summary.totalIncome}, Expenses: ${summary.totalExpenses}`);
  } catch (error) {
    console.error('DashboardPage: failed to load dashboard data.', error);
    renderError();
  }

  const greetingEl = qs('[data-dash="greeting"]');
  if (greetingEl) {
    const pkParts = new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Karachi',
    }).formatToParts(new Date());
    const pkHour = Number(pkParts.find((p) => p.type === 'hour').value);
    const timeOfDay = pkHour < 12 ? 'Good morning' : pkHour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = user.name ? user.name.split(' ')[0] : '';
    greetingEl.textContent = `${timeOfDay}${firstName ? ', ' + firstName : ''}`;
  }
}

document.addEventListener('DOMContentLoaded', init);