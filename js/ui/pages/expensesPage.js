import { ApiAdapter } from '../../storage/ApiAdapter.js';
import { CategoryRepository } from '../../repositories/CategoryRepository.js';
import { ExpenseRepository } from '../../repositories/ExpenseRepository.js';
import { ExpenseService } from '../../services/ExpenseService.js';
import { Modal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { initSidebarToggle } from '../components/SidebarToggle.js';
import { initThemeToggle } from '../components/ThemeToggle.js';
import { requireAuth, renderUserAvatar, wireLogoutButton } from '../components/AuthGuard.js';
import { formatCurrency, formatDate, qs, qsa, log, skeletonRowsHtml, errorBannerHtml, debounce, todayLocalDateString } from '../../core/utils.js';

const storageAdapter = new ApiAdapter();
const categoryRepository = new CategoryRepository(storageAdapter);
const expenseRepository = new ExpenseRepository(storageAdapter);
const expenseService = new ExpenseService(expenseRepository, categoryRepository);

let expenseCategories = [];
let activeModal = null;
let allExpenses = [];
let filters = { query: '', categoryId: '', month: '' };

function renderLoading() {
  const listEl = qs('[data-expenses-list]');
  if (!listEl) return;
  listEl.innerHTML = `
    <table class="table">
      <thead><tr><th>Category</th><th>Description</th><th>Date</th><th style="text-align:right;">Amount</th><th></th></tr></thead>
      <tbody>${skeletonRowsHtml(4, 5)}</tbody>
    </table>
  `;
}

function renderError(message) {
  const listEl = qs('[data-expenses-list]');
  if (listEl) listEl.innerHTML = errorBannerHtml(message);
}

function renderEmptyState(hasAnyExpenses) {
  const listEl = qs('[data-expenses-list]');
  if (!listEl) return;
  listEl.innerHTML = hasAnyExpenses
    ? `
    <div class="empty-state">
      <p class="empty-state__title">No matching expenses</p>
      <p class="empty-state__text text-muted">Try adjusting your search or clearing the filters.</p>
    </div>
  `
    : `
    <div class="empty-state">
      <p class="empty-state__title">No expenses yet</p>
      <p class="empty-state__text text-muted">Add your first expense to start tracking where your money goes.</p>
    </div>
  `;
}

function renderExpenseTable(expenses, hasAnyExpenses = allExpenses.length > 0) {
  const listEl = qs('[data-expenses-list]');
  if (!listEl) return;

  if (expenses.length === 0) {
    renderEmptyState(hasAnyExpenses);
    return;
  }

  const rows = expenses
    .map(
      (expense) => `
    <tr data-expense-id="${expense.id}">
      <td><span class="badge" style="--badge-color: ${expense.category ? expense.category.color : '#6B7280'};">${expense.category ? expense.category.name : 'Uncategorized'}</span></td>
      <td>${expense.description}</td>
      <td class="text-muted text-sm">${formatDate(expense.date)}</td>
      <td class="amount amount--negative" style="text-align:right;">${formatCurrency(expense.amount)}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button type="button" class="icon-btn" data-action="edit" aria-label="Edit expense">Edit</button>
        <button type="button" class="icon-btn icon-btn--danger" data-action="delete" aria-label="Delete expense">Delete</button>
      </td>
    </tr>
  `
    )
    .join('');

  listEl.innerHTML = `
    <table class="table">
      <thead><tr><th>Category</th><th>Description</th><th>Date</th><th style="text-align:right;">Amount</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function renderSummary() {
  const totalEl = qs('[data-expenses-total]');
  if (!totalEl) return;
  try {
    const total = await expenseService.getTotalForCurrentMonth();
    totalEl.textContent = formatCurrency(total);
  } catch (error) {
    console.error('ExpensesPage: failed to compute monthly total.', error);
    totalEl.textContent = formatCurrency(0);
  }
}

function getFilteredExpenses() {
  const query = filters.query.trim().toLowerCase();
  return allExpenses.filter((expense) => {
    if (filters.categoryId && expense.categoryId !== filters.categoryId) return false;
    if (filters.month && !expense.date.startsWith(filters.month)) return false;
    if (query) {
      const description = (expense.description || '').toLowerCase();
      const categoryName = (expense.category && expense.category.name || '').toLowerCase();
      if (!description.includes(query) && !categoryName.includes(query)) return false;
    }
    return true;
  });
}

function applyFilters() {
  renderExpenseTable(getFilteredExpenses());
}

function populateCategoryFilterOptions(categories) {
  const selectEl = qs('[data-expense-category-filter]');
  if (!selectEl) return;
  selectEl.innerHTML =
    '<option value="">All categories</option>' +
    categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
}

function clearFilters() {
  filters = { query: '', categoryId: '', month: '' };
  const searchEl = qs('[data-expense-search]');
  if (searchEl) searchEl.value = '';
  const categoryEl = qs('[data-expense-category-filter]');
  if (categoryEl) categoryEl.value = '';
  const monthEl = qs('[data-expense-month-filter]');
  if (monthEl) monthEl.value = '';
  applyFilters();
}

async function loadAndRenderExpenses() {
  renderLoading();
  try {
    allExpenses = await expenseService.getAllWithCategory();
    applyFilters();
    await renderSummary();
  } catch (error) {
    console.error('ExpensesPage: failed to load expenses.', error);
    renderError('Could not load your expenses. Please refresh the page.');
  }
}

function buildExpenseForm(existingExpense = null) {
  const form = document.createElement('form');
  form.className = 'form';
  form.id = 'expense-form-el';
  form.noValidate = true;

  const categoryOptions = expenseCategories
    .map((c) => `<option value="${c.id}" ${existingExpense && existingExpense.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`)
    .join('');

  form.innerHTML = `
    <div class="form-group">
      <label for="expense-category">Category</label>
      <select id="expense-category" name="categoryId" class="form-input" required>
        <option value="" disabled ${!existingExpense ? 'selected' : ''}>Select a category</option>
        ${categoryOptions}
      </select>
      <p class="form-error" data-error-for="categoryId"></p>
    </div>
    <div class="form-group">
      <label for="expense-amount">Amount (Rs.)</label>
      <input id="expense-amount" name="amount" type="number" step="0.01" min="0" class="form-input" value="${existingExpense ? existingExpense.amount : ''}" required />
      <p class="form-error" data-error-for="amount"></p>
    </div>
    <div class="form-group">
      <label for="expense-description">Description</label>
      <input id="expense-description" name="description" type="text" class="form-input" value="${existingExpense ? existingExpense.description : ''}" maxlength="120" required />
      <p class="form-error" data-error-for="description"></p>
    </div>
    <div class="form-group">
      <label for="expense-date">Date</label>
      <input id="expense-date" name="date" type="date" class="form-input" value="${existingExpense ? existingExpense.date : todayLocalDateString()}" required />
      <p class="form-error" data-error-for="date"></p>
    </div>
  `;

  return form;
}

function showFieldErrors(form, errors) {
  qsa('.form-error', form).forEach((el) => (el.textContent = ''));
  qsa('.form-input', form).forEach((el) => el.classList.remove('form-input--error'));

  for (const [field, messages] of Object.entries(errors)) {
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    if (errorEl) errorEl.textContent = messages[0];
    const inputEl = form.querySelector(`[name="${field}"]`);
    if (inputEl) inputEl.classList.add('form-input--error');
  }
}

function openExpenseModal(existingExpense = null) {
  const form = buildExpenseForm(existingExpense);

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.gap = 'var(--space-3)';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn--neutral';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => activeModal.close());

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn--primary';
  submitBtn.textContent = existingExpense ? 'Save Changes' : 'Add Expense';
  submitBtn.setAttribute('form', 'expense-form-el');

  footer.append(cancelBtn, submitBtn);

  activeModal = new Modal({
    title: existingExpense ? 'Edit Expense' : 'Add Expense',
    bodyElement: form,
    footerElement: footer,
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const input = {
      categoryId: formData.get('categoryId'),
      amount: formData.get('amount'),
      description: formData.get('description'),
      date: formData.get('date'),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      const result = existingExpense
        ? await expenseService.updateExpense(existingExpense.id, input)
        : await expenseService.createExpense(input);

      if (!result.success) {
        showFieldErrors(form, result.errors);
        submitBtn.disabled = false;
        submitBtn.textContent = existingExpense ? 'Save Changes' : 'Add Expense';
        return;
      }

      activeModal.close();
      showToast(existingExpense ? 'Expense updated.' : 'Expense added.', { type: 'success' });
      await loadAndRenderExpenses();
    } catch (error) {
      console.error('ExpensesPage: failed to save expense.', error);
      showToast(error.message || 'Could not save this expense. Please try again.', { type: 'danger' });
      submitBtn.disabled = false;
      submitBtn.textContent = existingExpense ? 'Save Changes' : 'Add Expense';
    }
  });

  activeModal.open();
}

async function handleListClick(e) {
  const button = e.target.closest('button[data-action]');
  if (!button) return;

  const row = button.closest('[data-expense-id]');
  const expenseId = row ? row.dataset.expenseId : null;
  if (!expenseId) return;

  if (button.dataset.action === 'edit') {
    const expense = await expenseRepository.getById(expenseId);
    if (expense) openExpenseModal(expense);
    return;
  }

  if (button.dataset.action === 'delete') {
    const confirmed = await confirmDialog({
      title: 'Delete this expense?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await expenseService.deleteExpense(expenseId);
      showToast('Expense deleted.', { type: 'danger' });
      await loadAndRenderExpenses();
    } catch (error) {
      console.error('ExpensesPage: failed to delete expense.', error);
      showToast('Could not delete this expense. Please try again.', { type: 'danger' });
    }
  }
}

async function init() {
  const user = requireAuth();
  if (!user) return;

  initSidebarToggle();
  initThemeToggle();
  wireLogoutButton();
  renderUserAvatar(user);

  try {
    expenseCategories = await categoryRepository.getByType('expense');
  } catch (error) {
    console.error('ExpensesPage: failed to load categories.', error);
    renderError('Could not load categories. Please refresh the page.');
    return;
  }

  const addBtn = qs('[data-action="add-expense"]');
  if (addBtn) addBtn.addEventListener('click', () => openExpenseModal(null));

  const listEl = qs('[data-expenses-list]');
  if (listEl) listEl.addEventListener('click', handleListClick);

  populateCategoryFilterOptions(expenseCategories);

  const searchEl = qs('[data-expense-search]');
  if (searchEl) {
    searchEl.addEventListener(
      'input',
      debounce((e) => {
        filters.query = e.target.value;
        applyFilters();
      }, 300)
    );
  }

  const categoryEl = qs('[data-expense-category-filter]');
  if (categoryEl) {
    categoryEl.addEventListener('change', (e) => {
      filters.categoryId = e.target.value;
      applyFilters();
    });
  }

  const monthEl = qs('[data-expense-month-filter]');
  if (monthEl) {
    monthEl.addEventListener('change', (e) => {
      filters.month = e.target.value;
      applyFilters();
    });
  }

  const clearBtn = qs('[data-action="clear-expense-filters"]');
  if (clearBtn) clearBtn.addEventListener('click', clearFilters);

  await loadAndRenderExpenses();
  log('Expenses page initialized.');
}

document.addEventListener('DOMContentLoaded', init);