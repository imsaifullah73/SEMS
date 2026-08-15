import { ApiAdapter } from '../../storage/ApiAdapter.js';
import { CategoryRepository } from '../../repositories/CategoryRepository.js';
import { IncomeRepository } from '../../repositories/IncomeRepository.js';
import { IncomeService } from '../../services/IncomeService.js';
import { Modal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { initSidebarToggle } from '../components/SidebarToggle.js';
import { initThemeToggle } from '../components/ThemeToggle.js';
import { requireAuth, renderUserAvatar, wireLogoutButton } from '../components/AuthGuard.js';
import { formatCurrency, formatDate, formatDateTime, qs, qsa, log, skeletonRowsHtml, errorBannerHtml, debounce, todayLocalDateString } from '../../core/utils.js';

const storageAdapter = new ApiAdapter();
const categoryRepository = new CategoryRepository(storageAdapter);
const incomeRepository = new IncomeRepository(storageAdapter);
const incomeService = new IncomeService(incomeRepository, categoryRepository);

let incomeCategories = [];
let activeModal = null;
let allIncomeEntries = [];
let filters = { query: '', categoryId: '', month: '' };

function renderLoading() {
  const listEl = qs('[data-income-list]');
  if (!listEl) return;
  listEl.innerHTML = `
    <table class="table">
      <thead><tr><th>Source</th><th>Description</th><th>Date</th><th style="text-align:right;">Amount</th><th></th></tr></thead>
      <tbody>${skeletonRowsHtml(4, 5)}</tbody>
    </table>
  `;
}

function renderError(message) {
  const listEl = qs('[data-income-list]');
  if (listEl) listEl.innerHTML = errorBannerHtml(message);
}

function renderEmptyState(hasAnyIncome) {
  const listEl = qs('[data-income-list]');
  if (!listEl) return;
  listEl.innerHTML = hasAnyIncome
    ? `
    <div class="empty-state">
      <p class="empty-state__title">No matching income</p>
      <p class="empty-state__text text-muted">Try adjusting your search or clearing the filters.</p>
    </div>
  `
    : `
    <div class="empty-state">
      <p class="empty-state__title">No income logged yet</p>
      <p class="empty-state__text text-muted">Add your allowance, scholarship, or part-time earnings to see your full picture.</p>
    </div>
  `;
}

function renderIncomeTable(entries, hasAnyIncome = allIncomeEntries.length > 0) {
  const listEl = qs('[data-income-list]');
  if (!listEl) return;

  if (entries.length === 0) {
    renderEmptyState(hasAnyIncome);
    return;
  }

  const rows = entries
    .map(
      (entry) => `
    <tr data-income-id="${entry.id}">
      <td><span class="badge" style="--badge-color: ${entry.category ? entry.category.color : '#6B7280'};">${entry.category ? entry.category.name : 'Uncategorized'}</span></td>
      <td>${entry.description}</td>
      <td class="text-muted text-sm">${entry.createdAt ? formatDateTime(entry.createdAt) : formatDate(entry.date)}</td>
      <td class="amount amount--positive" style="text-align:right;">${formatCurrency(entry.amount)}</td>
      <td style="text-align:right; white-space:nowrap;">
        <button type="button" class="icon-btn" data-action="edit" aria-label="Edit income">Edit</button>
        <button type="button" class="icon-btn icon-btn--danger" data-action="delete" aria-label="Delete income">Delete</button>
      </td>
    </tr>
  `
    )
    .join('');

  listEl.innerHTML = `
    <table class="table">
      <thead><tr><th>Source</th><th>Description</th><th>Date &amp; Time</th><th style="text-align:right;">Amount</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function renderSummary() {
  const totalEl = qs('[data-income-total]');
  if (!totalEl) return;
  try {
    const total = await incomeService.getTotalForCurrentMonth();
    totalEl.textContent = formatCurrency(total);
  } catch (error) {
    console.error('IncomePage: failed to compute monthly total.', error);
    totalEl.textContent = formatCurrency(0);
  }
}

async function loadAndRenderIncome() {
  renderLoading();
  try {
    allIncomeEntries = await incomeService.getAllWithCategory();
    applyFilters();
    await renderSummary();
  } catch (error) {
    console.error('IncomePage: failed to load income.', error);
    renderError('Could not load your income entries. Please refresh the page.');
  }
}

function getFilteredIncome() {
  const query = filters.query.trim().toLowerCase();
  return allIncomeEntries.filter((entry) => {
    if (filters.categoryId && entry.categoryId !== filters.categoryId) return false;
    if (filters.month && !entry.date.startsWith(filters.month)) return false;
    if (query) {
      const description = (entry.description || '').toLowerCase();
      const categoryName = (entry.category && entry.category.name || '').toLowerCase();
      if (!description.includes(query) && !categoryName.includes(query)) return false;
    }
    return true;
  });
}

function applyFilters() {
  renderIncomeTable(getFilteredIncome());
}

function populateCategoryFilterOptions(categories) {
  const selectEl = qs('[data-income-category-filter]');
  if (!selectEl) return;
  selectEl.innerHTML =
    '<option value="">All categories</option>' +
    categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
}

function clearFilters() {
  filters = { query: '', categoryId: '', month: '' };
  const searchEl = qs('[data-income-search]');
  if (searchEl) searchEl.value = '';
  const categoryEl = qs('[data-income-category-filter]');
  if (categoryEl) categoryEl.value = '';
  const monthEl = qs('[data-income-month-filter]');
  if (monthEl) monthEl.value = '';
  applyFilters();
}

function buildIncomeForm(existingIncome = null) {
  const form = document.createElement('form');
  form.className = 'form';
  form.id = 'income-form-el';
  form.noValidate = true;

  const categoryOptions = incomeCategories
    .map((c) => `<option value="${c.id}" ${existingIncome && existingIncome.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`)
    .join('');

  form.innerHTML = `
    <div class="form-group">
      <label for="income-category">Source</label>
      <select id="income-category" name="categoryId" class="form-input" required>
        <option value="" disabled ${!existingIncome ? 'selected' : ''}>Select a source</option>
        ${categoryOptions}
      </select>
      <p class="form-error" data-error-for="categoryId"></p>
    </div>
    <div class="form-group">
      <label for="income-amount">Amount (Rs.)</label>
      <input id="income-amount" name="amount" type="number" step="0.01" min="0" class="form-input" value="${existingIncome ? existingIncome.amount : ''}" required />
      <p class="form-error" data-error-for="amount"></p>
    </div>
    <div class="form-group">
      <label for="income-description">Description</label>
      <input id="income-description" name="description" type="text" class="form-input" value="${existingIncome ? existingIncome.description : ''}" maxlength="120" required />
      <p class="form-error" data-error-for="description"></p>
    </div>
    <div class="form-group">
      <label for="income-date">Date</label>
      <input id="income-date" name="date" type="date" class="form-input" value="${existingIncome ? existingIncome.date : todayLocalDateString()}" required />
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

function openIncomeModal(existingIncome = null) {
  const form = buildIncomeForm(existingIncome);

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
  submitBtn.textContent = existingIncome ? 'Save Changes' : 'Add Income';
  submitBtn.setAttribute('form', 'income-form-el');

  footer.append(cancelBtn, submitBtn);

  activeModal = new Modal({
    title: existingIncome ? 'Edit Income' : 'Add Income',
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
      const result = existingIncome
        ? await incomeService.updateIncome(existingIncome.id, input)
        : await incomeService.createIncome(input);

      if (!result.success) {
        showFieldErrors(form, result.errors);
        submitBtn.disabled = false;
        submitBtn.textContent = existingIncome ? 'Save Changes' : 'Add Income';
        return;
      }

      activeModal.close();
      showToast(existingIncome ? 'Income updated.' : 'Income added.', { type: 'success' });
      await loadAndRenderIncome();
    } catch (error) {
      console.error('IncomePage: failed to save income.', error);
      showToast(error.message || 'Could not save this income entry. Please try again.', { type: 'danger' });
      submitBtn.disabled = false;
      submitBtn.textContent = existingIncome ? 'Save Changes' : 'Add Income';
    }
  });

  activeModal.open();
}

async function handleListClick(e) {
  const button = e.target.closest('button[data-action]');
  if (!button) return;

  const row = button.closest('[data-income-id]');
  const incomeId = row ? row.dataset.incomeId : null;
  if (!incomeId) return;

  if (button.dataset.action === 'edit') {
    const entry = await incomeRepository.getById(incomeId);
    if (entry) openIncomeModal(entry);
    return;
  }

  if (button.dataset.action === 'delete') {
    const confirmed = await confirmDialog({
      title: 'Delete this income entry?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await incomeService.deleteIncome(incomeId);
      showToast('Income deleted.', { type: 'danger' });
      await loadAndRenderIncome();
    } catch (error) {
      console.error('IncomePage: failed to delete income.', error);
      showToast('Could not delete this income entry. Please try again.', { type: 'danger' });
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
    incomeCategories = await categoryRepository.getByType('income');
  } catch (error) {
    console.error('IncomePage: failed to load categories.', error);
    renderError('Could not load categories. Please refresh the page.');
    return;
  }

  const addBtn = qs('[data-action="add-income"]');
  if (addBtn) addBtn.addEventListener('click', () => openIncomeModal(null));

  const listEl = qs('[data-income-list]');
  if (listEl) listEl.addEventListener('click', handleListClick);

  populateCategoryFilterOptions(incomeCategories);

  const searchEl = qs('[data-income-search]');
  if (searchEl) {
    searchEl.addEventListener(
      'input',
      debounce((e) => {
        filters.query = e.target.value;
        applyFilters();
      }, 300)
    );
  }

  const categoryEl = qs('[data-income-category-filter]');
  if (categoryEl) {
    categoryEl.addEventListener('change', (e) => {
      filters.categoryId = e.target.value;
      applyFilters();
    });
  }

  const monthEl = qs('[data-income-month-filter]');
  if (monthEl) {
    monthEl.addEventListener('change', (e) => {
      filters.month = e.target.value;
      applyFilters();
    });
  }

  const clearBtn = qs('[data-action="clear-income-filters"]');
  if (clearBtn) clearBtn.addEventListener('click', clearFilters);

  await loadAndRenderIncome();
  log('Income page initialized.');
}

document.addEventListener('DOMContentLoaded', init);