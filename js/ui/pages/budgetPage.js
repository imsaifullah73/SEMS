import { ApiAdapter } from '../../storage/ApiAdapter.js';
import { CategoryRepository } from '../../repositories/CategoryRepository.js';
import { ExpenseRepository } from '../../repositories/ExpenseRepository.js';
import { BudgetRepository } from '../../repositories/BudgetRepository.js';
import { BudgetService } from '../../services/BudgetService.js';
import { Modal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { initSidebarToggle } from '../components/SidebarToggle.js';
import { initThemeToggle } from '../components/ThemeToggle.js';
import { requireAuth, renderUserAvatar, wireLogoutButton } from '../components/AuthGuard.js';
import { formatCurrency, qs, qsa, log, errorBannerHtml } from '../../core/utils.js';

const storageAdapter = new ApiAdapter();
const categoryRepository = new CategoryRepository(storageAdapter);
const expenseRepository = new ExpenseRepository(storageAdapter);
const budgetRepository = new BudgetRepository(storageAdapter);
const budgetService = new BudgetService(budgetRepository, expenseRepository, categoryRepository);

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth();

let activeModal = null;
let currentOverview = null;

function progressBarHtml(percent, status) {
  const safePercent = percent === null ? 0 : Math.min(percent, 100);
  return `<div class="progress-bar"><div class="progress-bar__fill progress-bar__fill--${status}" style="width: ${safePercent}%;"></div></div>`;
}

function skeletonBlock(width = '100%', height = '14px') {
  return `<span class="skeleton skeleton--text" style="display:block; width:${width}; height:${height};"></span>`;
}

function renderOverallLoading() {
  const card = qs('[data-overall-card]');
  if (!card) return;
  card.innerHTML = `
    <div style="margin-bottom: var(--space-4);">${skeletonBlock('40%', '20px')}</div>
    <div style="margin-bottom: var(--space-2);">${skeletonBlock('60%', '12px')}</div>
    <div style="margin-bottom: var(--space-4);">${skeletonBlock('50%', '32px')}</div>
    ${skeletonBlock('100%', '8px')}
  `;
}

function renderCategoryLoading() {
  const listEl = qs('[data-category-budget-list]');
  if (!listEl) return;
  listEl.innerHTML = Array.from({ length: 3 })
    .map(
      () => `
    <div class="budget-row">
      <div style="margin-bottom: var(--space-2);">${skeletonBlock('30%', '16px')}</div>
      <div style="margin-bottom: var(--space-2);">${skeletonBlock('50%', '12px')}</div>
      ${skeletonBlock('100%', '8px')}
    </div>
  `
    )
    .join('');
}

function renderOverallError() {
  const card = qs('[data-overall-card]');
  if (card) card.innerHTML = errorBannerHtml('Could not load your budget. Please refresh the page.');
}

function renderCategoryError() {
  const listEl = qs('[data-category-budget-list]');
  if (listEl) listEl.innerHTML = errorBannerHtml('Could not load category budgets. Please refresh the page.');
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

function renderOverallCard(overall) {
  const card = qs('[data-overall-card]');
  if (!card) return;

  const hasBudget = overall.budgetAmount !== null;
  const remaining = hasBudget ? overall.budgetAmount - overall.spent : null;

  card.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-4);">
      <h3>Monthly Budget</h3>
      <button type="button" class="btn btn--neutral" data-action="edit-overall">${hasBudget ? 'Edit Budget' : 'Set Budget'}</button>
    </div>
    ${
      hasBudget
        ? `
      <p class="text-sm text-muted" style="margin-bottom: var(--space-1);">Spent of ${formatCurrency(overall.budgetAmount)}</p>
      <p class="amount ${overall.status === 'over' ? 'amount--negative' : 'amount--positive'}" style="font-size: var(--font-size-2xl); margin-bottom: var(--space-3);">${formatCurrency(overall.spent)}</p>
      ${progressBarHtml(overall.percent, overall.status)}
      <p class="text-sm text-muted" style="margin-top: var(--space-2);">${remaining >= 0 ? `${formatCurrency(remaining)} left this month` : `${formatCurrency(Math.abs(remaining))} over budget`}</p>
    `
        : `<p class="text-muted">No overall budget set for this month yet.</p>`
    }
  `;
}

function openOverallBudgetModal(currentAmount) {
  const form = document.createElement('form');
  form.className = 'form';
  form.id = 'overall-budget-form-el';
  form.noValidate = true;
  form.innerHTML = `
    <div class="form-group">
      <label for="overall-amount">Monthly Budget Amount (Rs.)</label>
      <input id="overall-amount" name="amount" type="number" step="0.01" min="0" class="form-input" value="${currentAmount || ''}" required />
      <p class="form-error" data-error-for="amount"></p>
    </div>
  `;

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
  submitBtn.textContent = 'Save Budget';
  submitBtn.setAttribute('form', 'overall-budget-form-el');

  footer.append(cancelBtn, submitBtn);

  activeModal = new Modal({ title: 'Set Monthly Budget', bodyElement: form, footerElement: footer });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = new FormData(form).get('amount');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      const result = await budgetService.setOverallBudget(amount, CURRENT_MONTH, CURRENT_YEAR);

      if (!result.success) {
        showFieldErrors(form, result.errors);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Budget';
        return;
      }

      activeModal.close();
      showToast('Monthly budget saved.', { type: 'success' });
      await loadAndRenderAll();
    } catch (error) {
      console.error('BudgetPage: failed to save overall budget.', error);
      showToast('Could not save the budget. Please try again.', { type: 'danger' });
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Budget';
    }
  });

  activeModal.open();
}

function renderEmptyCategoryState() {
  const listEl = qs('[data-category-budget-list]');
  if (!listEl) return;
  listEl.innerHTML = `
    <div class="empty-state">
      <p class="empty-state__title">No category budgets yet</p>
      <p class="empty-state__text text-muted">Set a limit for categories like Food or Transport to track them individually.</p>
    </div>
  `;
}

function renderCategoryBreakdown(categoryBreakdown) {
  const listEl = qs('[data-category-budget-list]');
  if (!listEl) return;

  if (categoryBreakdown.length === 0) {
    renderEmptyCategoryState();
    return;
  }

  listEl.innerHTML = categoryBreakdown
    .map((row) => {
      const hasBudget = row.budgetAmount !== null;
      return `
      <div class="budget-row" data-category-id="${row.categoryId}" data-budget-id="${row.budgetId || ''}">
        <div class="budget-row__top">
          <span class="badge" style="--badge-color: ${row.categoryColor};">${row.categoryName}</span>
          <div class="budget-row__actions">
            <button type="button" class="icon-btn" data-action="edit-category">${hasBudget ? 'Edit' : 'Set Budget'}</button>
            ${hasBudget ? `<button type="button" class="icon-btn icon-btn--danger" data-action="delete-category">Remove</button>` : ''}
          </div>
        </div>
        <p class="text-sm text-muted" style="margin: var(--space-2) 0 var(--space-1);">${formatCurrency(row.spent)}${hasBudget ? ` of ${formatCurrency(row.budgetAmount)}` : ' spent (no budget set)'}</p>
        ${hasBudget ? progressBarHtml(row.percent, row.status) : ''}
      </div>
    `;
    })
    .join('');
}

function openCategoryBudgetModal(overview, existingRow = null) {
  const form = document.createElement('form');
  form.className = 'form';
  form.id = 'category-budget-form-el';
  form.noValidate = true;

  const categoryOptions = overview.allExpenseCategories
    .map((c) => `<option value="${c.id}" ${existingRow && existingRow.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`)
    .join('');

  form.innerHTML = `
    <div class="form-group">
      <label for="category-budget-select">Category</label>
      <select id="category-budget-select" name="categoryId" class="form-input" ${existingRow ? 'disabled' : 'required'}>
        <option value="" disabled ${!existingRow ? 'selected' : ''}>Select a category</option>
        ${categoryOptions}
      </select>
      ${existingRow ? `<input type="hidden" name="categoryId" value="${existingRow.categoryId}" />` : ''}
      <p class="form-error" data-error-for="categoryId"></p>
    </div>
    <div class="form-group">
      <label for="category-budget-amount">Budget Amount (Rs.)</label>
      <input id="category-budget-amount" name="amount" type="number" step="0.01" min="0" class="form-input" value="${existingRow ? existingRow.budgetAmount : ''}" required />
      <p class="form-error" data-error-for="amount"></p>
    </div>
  `;

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
  submitBtn.textContent = 'Save Budget';
  submitBtn.setAttribute('form', 'category-budget-form-el');

  footer.append(cancelBtn, submitBtn);

  activeModal = new Modal({
    title: existingRow ? 'Edit Category Budget' : 'Set Category Budget',
    bodyElement: form,
    footerElement: footer,
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const categoryId = formData.get('categoryId');
    const amount = formData.get('amount');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      const result = await budgetService.setCategoryBudget(categoryId, amount, CURRENT_MONTH, CURRENT_YEAR);

      if (!result.success) {
        showFieldErrors(form, result.errors);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Budget';
        return;
      }

      activeModal.close();
      showToast(existingRow ? 'Category budget updated.' : 'Category budget set.', { type: 'success' });
      await loadAndRenderAll();
    } catch (error) {
      console.error('BudgetPage: failed to save category budget.', error);
      showToast('Could not save the category budget. Please try again.', { type: 'danger' });
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Budget';
    }
  });

  activeModal.open();
}

async function loadAndRenderAll() {
  renderOverallLoading();
  renderCategoryLoading();

  try {
    currentOverview = await budgetService.getBudgetOverview(CURRENT_YEAR, CURRENT_MONTH);
    renderOverallCard(currentOverview.overall);
    renderCategoryBreakdown(currentOverview.categoryBreakdown);
  } catch (error) {
    console.error('BudgetPage: failed to load budget overview.', error);
    renderOverallError();
    renderCategoryError();
  }
}

async function handleOverallClick(e) {
  if (e.target.closest('[data-action="edit-overall"]')) {
    openOverallBudgetModal(currentOverview.overall.budgetAmount);
  }
}

async function handleCategoryListClick(e) {
  const row = e.target.closest('[data-category-id]');
  if (!row) return;
  const categoryId = row.dataset.categoryId;
  const budgetId = row.dataset.budgetId;

  if (e.target.closest('[data-action="edit-category"]')) {
    const existingRow = currentOverview.categoryBreakdown.find((r) => r.categoryId === categoryId);
    openCategoryBudgetModal(currentOverview, existingRow && existingRow.budgetAmount !== null ? existingRow : null);
    return;
  }

  if (e.target.closest('[data-action="delete-category"]')) {
    const confirmed = await confirmDialog({
      title: 'Remove this category budget?',
      message: 'Spending history for this category is not affected.',
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await budgetService.removeCategoryBudget(budgetId);
      showToast('Category budget removed.', { type: 'danger' });
      await loadAndRenderAll();
    } catch (error) {
      console.error('BudgetPage: failed to remove category budget.', error);
      showToast('Could not remove this category budget. Please try again.', { type: 'danger' });
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

  const overallCard = qs('[data-overall-card]');
  if (overallCard) overallCard.addEventListener('click', handleOverallClick);

  const addCategoryBtn = qs('[data-action="add-category-budget"]');
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => openCategoryBudgetModal(currentOverview, null));
  }

  const categoryList = qs('[data-category-budget-list]');
  if (categoryList) categoryList.addEventListener('click', handleCategoryListClick);

  await loadAndRenderAll();
  log('Budget page initialized.');
}

document.addEventListener('DOMContentLoaded', init);