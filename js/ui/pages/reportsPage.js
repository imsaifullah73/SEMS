import { ApiAdapter } from '../../storage/ApiAdapter.js';
import { CategoryRepository } from '../../repositories/CategoryRepository.js';
import { ExpenseRepository } from '../../repositories/ExpenseRepository.js';
import { IncomeRepository } from '../../repositories/IncomeRepository.js';
import { ReportService } from '../../services/ReportService.js';
import { initSidebarToggle } from '../components/SidebarToggle.js';
import { initThemeToggle } from '../components/ThemeToggle.js';
import { requireAuth, renderUserAvatar, wireLogoutButton } from '../components/AuthGuard.js';
import { showToast } from '../components/Toast.js';
import { formatCurrency, qs, qsa, log } from '../../core/utils.js';

const storageAdapter = new ApiAdapter();
const categoryRepository = new CategoryRepository(storageAdapter);
const expenseRepository = new ExpenseRepository(storageAdapter);
const incomeRepository = new IncomeRepository(storageAdapter);
const reportService = new ReportService(expenseRepository, incomeRepository, categoryRepository);

let trendChart = null;
let categoryChart = null;
let activePeriod = 'monthly';
let latestReport = null;

function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue('--text-secondary').trim() || '#6B7280',
    grid: styles.getPropertyValue('--border').trim() || '#E2E4ED',
    success: styles.getPropertyValue('--success').trim() || '#15803D',
    danger: styles.getPropertyValue('--danger').trim() || '#DC2626',
    surface: styles.getPropertyValue('--surface').trim() || '#FFFFFF',
  };
}

function renderSummary(totals) {
  const incomeEl = qs('[data-report="total-income"]');
  const expensesEl = qs('[data-report="total-expenses"]');
  const netEl = qs('[data-report="net"]');

  if (incomeEl) incomeEl.textContent = formatCurrency(totals.totalIncome);
  if (expensesEl) expensesEl.textContent = formatCurrency(totals.totalExpenses);

  if (netEl) {
    netEl.textContent = formatCurrency(Math.abs(totals.net));
    netEl.classList.remove('amount--positive', 'amount--negative');
    netEl.classList.add(totals.net >= 0 ? 'amount--positive' : 'amount--negative');
  }
}

function renderSummaryError() {
  ['total-income', 'total-expenses', 'net'].forEach((key) => {
    const el = qs(`[data-report="${key}"]`);
    if (el) el.textContent = '—';
  });
}

function renderTrendChart(trend) {
  const canvas = qs('[data-report="trend-chart"]');
  const emptyMsg = qs('[data-report="trend-empty"]');
  if (!canvas) return;

  const hasData = trend.incomeData.some((v) => v > 0) || trend.expenseData.some((v) => v > 0);

  if (trendChart) {
    trendChart.destroy();
    trendChart = null;
  }

  if (!hasData) {
    canvas.style.display = 'none';
    if (emptyMsg) {
      emptyMsg.textContent = 'No data yet for this period.';
      emptyMsg.style.display = 'block';
    }
    return;
  }

  canvas.style.display = 'block';
  if (emptyMsg) emptyMsg.style.display = 'none';

  const colors = getThemeColors();

  trendChart = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: trend.labels,
      datasets: [
        { label: 'Income', data: trend.incomeData, backgroundColor: colors.success, borderRadius: 4 },
        { label: 'Expenses', data: trend.expenseData, backgroundColor: colors.danger, borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: colors.text } } },
      scales: {
        x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
        y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true },
      },
    },
  });
}

function renderCategoryChart(breakdown) {
  const canvas = qs('[data-report="category-chart"]');
  const emptyMsg = qs('[data-report="category-empty"]');
  if (!canvas) return;

  if (categoryChart) {
    categoryChart.destroy();
    categoryChart = null;
  }

  if (breakdown.labels.length === 0) {
    canvas.style.display = 'none';
    if (emptyMsg) {
      emptyMsg.textContent = 'No expenses yet for this period.';
      emptyMsg.style.display = 'block';
    }
    return;
  }

  canvas.style.display = 'block';
  if (emptyMsg) emptyMsg.style.display = 'none';

  const colors = getThemeColors();

  categoryChart = new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: breakdown.labels,
      datasets: [{ data: breakdown.data, backgroundColor: breakdown.colors, borderColor: colors.surface, borderWidth: 2 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: colors.text, boxWidth: 12, padding: 12 } } },
    },
  });
}

function renderChartsError() {
  [
    { canvasSel: '[data-report="trend-chart"]', emptySel: '[data-report="trend-empty"]' },
    { canvasSel: '[data-report="category-chart"]', emptySel: '[data-report="category-empty"]' },
  ].forEach(({ canvasSel, emptySel }) => {
    const canvas = qs(canvasSel);
    const emptyMsg = qs(emptySel);
    if (canvas) canvas.style.display = 'none';
    if (emptyMsg) {
      emptyMsg.textContent = 'Could not load this chart. Please refresh the page.';
      emptyMsg.style.display = 'block';
    }
  });
}

function clearCharts() {
  if (trendChart) {
    trendChart.destroy();
    trendChart = null;
  }
  if (categoryChart) {
    categoryChart.destroy();
    categoryChart = null;
  }
}

function renderLoading() {
  clearCharts();

  ['total-income', 'total-expenses', 'net'].forEach((key) => {
    const el = qs(`[data-report="${key}"]`);
    if (el) {
      el.classList.add('skeleton', 'skeleton--text');
      el.textContent = '';
    }
  });

  [
    { canvasSel: '[data-report="trend-chart"]', emptySel: '[data-report="trend-empty"]', loadingSel: '[data-report="trend-loading"]' },
    { canvasSel: '[data-report="category-chart"]', emptySel: '[data-report="category-empty"]', loadingSel: '[data-report="category-loading"]' },
  ].forEach(({ canvasSel, emptySel, loadingSel }) => {
    const canvas = qs(canvasSel);
    const emptyMsg = qs(emptySel);
    const loading = qs(loadingSel);
    if (canvas) canvas.style.display = 'none';
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (loading) loading.style.display = 'block';
  });
}

function hideLoading() {
  ['total-income', 'total-expenses', 'net'].forEach((key) => {
    const el = qs(`[data-report="${key}"]`);
    if (el) el.classList.remove('skeleton', 'skeleton--text');
  });

  ['trend', 'category'].forEach((name) => {
    const loading = qs(`[data-report="${name}-loading"]`);
    if (loading) loading.style.display = 'none';
  });
}

async function loadAndRenderAll() {
  renderLoading();
  try {
    const { trend, categoryBreakdown, summary } = await reportService.getAllReportData(activePeriod);
    latestReport = { trend, categoryBreakdown, summary };
    hideLoading();

    renderSummary(summary);
    renderTrendChart(trend);
    renderCategoryChart(categoryBreakdown);
  } catch (error) {
    console.error('ReportsPage: failed to load report data.', error);
    hideLoading();
    renderSummaryError();
    renderChartsError();
  }
}

function escapeCsvCell(value) {
  const str = String(value === undefined || value === null ? '' : value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(data) {
  const rows = [];
  const { trend, categoryBreakdown } = data;

  rows.push(['Period', 'Income', 'Expenses', 'Net'].map(escapeCsvCell).join(','));

  trend.labels.forEach((label, i) => {
    const income = trend.incomeData[i] || 0;
    const expenses = trend.expenseData[i] || 0;
    rows.push(
      [label, income, expenses, income - expenses].map(escapeCsvCell).join(',')
    );
  });

  const totalIncome = trend.incomeData.reduce((a, b) => a + b, 0);
  const totalExpenses = trend.expenseData.reduce((a, b) => a + b, 0);
  rows.push(
    ['Total', totalIncome, totalExpenses, totalIncome - totalExpenses]
      .map(escapeCsvCell)
      .join(',')
  );

  rows.push('');

  rows.push(['Category', 'Amount'].map(escapeCsvCell).join(','));
  categoryBreakdown.labels.forEach((label, i) => {
    rows.push([label, categoryBreakdown.data[i]].map(escapeCsvCell).join(','));
  });

  return rows.join('\r\n');
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportCsv() {
  if (!latestReport) {
    showToast('Report data is not loaded yet. Please try again.', { type: 'info' });
    return;
  }

  const { trend, categoryBreakdown } = latestReport;
  const hasData =
    trend.incomeData.some((v) => v > 0) ||
    trend.expenseData.some((v) => v > 0) ||
    categoryBreakdown.data.some((v) => v > 0);

  if (!hasData) {
    showToast('No report data to export for this period.', { type: 'info' });
    return;
  }

  const content = buildCsv(latestReport);
  downloadCsv(content, `SEMS-report-${activePeriod}.csv`);
  showToast('Report exported as CSV.', { type: 'success' });
}

function setActivePeriod(period) {
  activePeriod = period;
  qsa('[data-period-btn]').forEach((btn) => {
    btn.classList.toggle('period-btn--active', btn.dataset.periodBtn === period);
  });
  loadAndRenderAll();
}

function init() {
  const user = requireAuth();
  if (!user) return;

  initSidebarToggle();
  initThemeToggle();
  wireLogoutButton();
  renderUserAvatar(user);

  qsa('[data-period-btn]').forEach((btn) => {
    btn.addEventListener('click', () => setActivePeriod(btn.dataset.periodBtn));
  });

  const exportBtn = qs('[data-action="export-csv"]');
  if (exportBtn) exportBtn.addEventListener('click', exportCsv);

  loadAndRenderAll();
  log('Reports page initialized.');
}

document.addEventListener('DOMContentLoaded', init);