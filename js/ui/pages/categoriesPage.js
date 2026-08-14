/* ==========================================================================
   SEMS — Categories Page
   Manages the logged-in user's income/expense categories: view, add, edit,
   and delete. Follows the same page architecture as the other SEMS pages:
   API requests flow through CategoryService -> CategoryRepository ->
   ApiAdapter (which talks to the Express/PostgreSQL backend).
   ========================================================================== */

import { ApiAdapter } from '../../storage/ApiAdapter.js';
import { CategoryRepository } from '../../repositories/CategoryRepository.js';
import { CategoryService } from '../../services/CategoryService.js';
import { Modal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { confirmDialog } from '../components/ConfirmDialog.js';
import { initSidebarToggle } from '../components/SidebarToggle.js';
import { initThemeToggle } from '../components/ThemeToggle.js';
import { requireAuth, renderUserAvatar, wireLogoutButton } from '../components/AuthGuard.js';
import { qs, qsa, log, errorBannerHtml } from '../../core/utils.js';

const storageAdapter = new ApiAdapter();
const categoryRepository = new CategoryRepository(storageAdapter);
const categoryService = new CategoryService(categoryRepository);

const FILTERS = ['all', 'expense', 'income'];

let activeModal = null;
let categories = [];
let currentFilter = 'all';

function skeletonBlock(width = '100%', height = '14px') {
  return `<span class="skeleton skeleton--text" style="display:block; width:${width}; height:${height};"></span>`;
}

function renderLoading() {
  const listEl = qs('[data-category-list]');
  if (!listEl) return;
  listEl.innerHTML = `
    <div class="category-list">
      ${Array.from({ length: 4 })
        .map(
          () => `
      <div class="category-row">
        <div style="display:flex; align-items:center; gap:var(--space-3); flex:1;">${skeletonBlock('20px', '20px')}${skeletonBlock('35%', '16px')}</div>
        <div style="display:flex; gap:var(--space-2);">${skeletonBlock('64px', '28px')}${skeletonBlock('64px', '28px')}</div>
      </div>
    `
        )
        .join('')}
    </div>
  `;
}

function renderEmptyState() {
  const listEl = qs('[data-category-list]');
  if (!listEl) return;
  listEl.innerHTML = `
    <div class="empty-state">
      <p class="empty-state__title">No categories yet</p>
      <p class="empty-state__text text-muted">Click "Add Category" to create your first income or expense category.</p>
    </div>
  `;
}

function renderError() {
  const listEl = qs('[data-category-list]');
  if (listEl) listEl.innerHTML = errorBannerHtml('Could not load your categories. Please try again.');
}

function filteredCategories() {
  if (currentFilter === 'all') return categories;
  return categories.filter((c) => c.type === currentFilter);
}

function groupRows(rows) {
  const expense = rows.filter((c) => c.type === 'expense');
  const income = rows.filter((c) => c.type === 'income');
  const sections = [];
  if (expense.length) sections.push({ label: 'Expense Categories', rows: expense });
  if (income.length) sections.push({ label: 'Income Categories', rows: income });
  return sections;
}

function rowHtml(category) {
  return `
    <div class="category-row" data-category-id="${category.id}">
      <div class="category-row__name">
        <span class="category-row__color" style="background:${category.color || '#6B7280'};" aria-hidden="true"></span>
        <span>${category.name}</span>
      </div>
      <div class="category-row__actions">
        <button type="button" class="icon-btn" data-action="edit-category">Edit</button>
        <button type="button" class="icon-btn icon-btn--danger" data-action="delete-category">Delete</button>
      </div>
    </div>
  `;
}

function renderList() {
  const listEl = qs('[data-category-list]');
  if (!listEl) return;

  const rows = filteredCategories();
  if (rows.length === 0) {
    renderEmptyState();
    return;
  }

  const groups = groupRows(rows).map(
    (group) => `
      <div class="category-group__label">
        <span>${group.label}</span>
        <span class="category-count">${group.rows.length}</span>
      </div>
      <div class="category-list">
        ${group.rows.map(rowHtml).join('')}
      </div>
    `
  );

  listEl.innerHTML = groups.join('');
}

function showFieldErrors(form, errors) {
  qsa('.form-error', form).forEach((el) => (el.textContent = ''));
  qsa('.form-input', form).forEach((el) => el.classList.remove('form-input--error'));

  for (const [field, messages] of Object.entries(errors)) {
    if (field === '_form') continue;
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    if (errorEl) errorEl.textContent = messages[0];
    const inputEl = form.querySelector(`[name="${field}"]`);
    if (inputEl) inputEl.classList.add('form-input--error');
  }
}

function swatchHtml(colorPresets, selectedColor) {
  return colorPresets
    .map(
      (color) => `
      <button type="button" class="color-swatch ${color === selectedColor ? 'color-swatch--selected' : ''}" data-color="${color}" style="background:${color};" aria-label="Select color ${color}"></button>
    `
    )
    .join('');
}

function openCategoryModal(category = null) {
  const isEdit = Boolean(category);
  const form = document.createElement('form');
  form.className = 'form';
  form.id = 'category-form-el';
  form.noValidate = true;

  const presets = categoryService.colorPresets;
  const selectedColor = category ? category.color || presets[0] : presets[0];

  form.innerHTML = `
    <div class="form-group">
      <label for="category-name">Name</label>
      <input id="category-name" name="name" type="text" class="form-input" value="${category ? category.name : ''}" maxlength="40" required />
      <p class="form-error" data-error-for="name"></p>
    </div>
    <div class="form-group">
      <label for="category-type">Type</label>
      <select id="category-type" name="type" class="form-input" required>
        <option value="expense" ${category && category.type === 'expense' ? 'selected' : ''}>Expense</option>
        <option value="income" ${category && category.type === 'income' ? 'selected' : ''}>Income</option>
      </select>
      <p class="form-error" data-error-for="type"></p>
    </div>
    <div class="form-group">
      <label for="category-color">Color</label>
      <div class="color-swatches" data-color-swatches>${swatchHtml(presets, selectedColor)}</div>
      <input type="hidden" name="color" value="${selectedColor}" />
      <p class="form-error" data-error-for="color"></p>
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
  submitBtn.textContent = isEdit ? 'Save Changes' : 'Add Category';
  submitBtn.setAttribute('form', 'category-form-el');

  footer.append(cancelBtn, submitBtn);

  activeModal = new Modal({
    title: isEdit ? 'Edit Category' : 'Add Category',
    bodyElement: form,
    footerElement: footer,
  });

  const swatchContainer = form.querySelector('[data-color-swatches]');
  swatchContainer.addEventListener('click', (e) => {
    const swatch = e.target.closest('[data-color]');
    if (!swatch) return;
    qsa('.color-swatch', swatchContainer).forEach((s) => s.classList.remove('color-swatch--selected'));
    swatch.classList.add('color-swatch--selected');
    form.querySelector('[name="color"]').value = swatch.dataset.color;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      type: formData.get('type'),
      color: formData.get('color'),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      const result = isEdit
        ? await categoryService.update(category.id, payload)
        : await categoryService.create(payload);

      if (!result.success) {
        showFieldErrors(form, result.errors);
        const formError = result.errors._form;
        if (formError) showToast(formError, { type: 'danger' });
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Save Changes' : 'Add Category';
        return;
      }

      activeModal.close();
      showToast(isEdit ? 'Category updated.' : 'Category added.', { type: 'success' });
      await loadAndRender();
    } catch (error) {
      console.error('CategoriesPage: failed to save category.', error);
      showToast('Could not save the category. Please try again.', { type: 'danger' });
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Save Changes' : 'Add Category';
    }
  });

  activeModal.open();
}

async function handleListClick(e) {
  const row = e.target.closest('[data-category-id]');
  if (!row) return;
  const categoryId = row.dataset.categoryId;

  if (e.target.closest('[data-action="edit-category"]')) {
    const category = categories.find((c) => c.id === categoryId);
    if (category) openCategoryModal(category);
    return;
  }

  if (e.target.closest('[data-action="delete-category"]')) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const confirmed = await confirmDialog({
      title: 'Delete this category?',
      message: `"${category.name}" will be removed. Existing transactions are not affected.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const removed = await categoryService.remove(categoryId);
      if (!removed) {
        showToast('Category not found.', { type: 'danger' });
        return;
      }
      showToast('Category deleted.', { type: 'danger' });
      await loadAndRender();
    } catch (error) {
      console.error('CategoriesPage: failed to delete category.', error);
      showToast('Could not delete the category. Please try again.', { type: 'danger' });
    }
  }
}

async function loadAndRender() {
  renderLoading();
  try {
    categories = await categoryService.getAll();
    renderList();
  } catch (error) {
    console.error('CategoriesPage: failed to load categories.', error);
    renderError();
  }
}

function syncFilterButtons() {
  qsa('[data-filter]').forEach((btn) => {
    const active = btn.dataset.filter === currentFilter;
    btn.classList.toggle('category-filter__btn--active', active);
  });
}

async function init() {
  const user = requireAuth();
  if (!user) return;

  initSidebarToggle();
  initThemeToggle();
  wireLogoutButton();
  renderUserAvatar(user);

  const addBtn = qs('[data-action="add-category"]');
  if (addBtn) addBtn.addEventListener('click', () => openCategoryModal(null));

  const list = qs('[data-category-list]');
  if (list) list.addEventListener('click', handleListClick);

  const filterGroup = qs('.category-filter');
  if (filterGroup) {
    filterGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      currentFilter = btn.dataset.filter;
      if (!FILTERS.includes(currentFilter)) currentFilter = 'all';
      syncFilterButtons();
      renderList();
    });
  }

  await loadAndRender();
  log(`Categories page initialized. Loaded ${categories.length} categories.`);
}

document.addEventListener('DOMContentLoaded', init);