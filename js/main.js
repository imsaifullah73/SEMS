/* ==========================================================================
   SEMS — Application Entry Point
   Loaded via <script type="module" src="js/main.js"> in index.html.
   Phase 4 adds: wiring up LocalStorageAdapter + CategoryRepository, seeding
   default categories on first run, and rendering them as chips in the demo
   card — visible, end-to-end proof that UI → Repository → Storage Adapter →
   localStorage all connect correctly.
   ========================================================================== */

import { CONFIG } from './core/config.js';
import { eventBus } from './core/eventBus.js';
import { Validator, validateField } from './core/validator.js';
import { formatCurrency, formatDate, log, qs } from './core/utils.js';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter.js';
import { CategoryRepository } from './repositories/CategoryRepository.js';

// Set the real document title from CONFIG instead of a hardcoded string.
document.title = `${CONFIG.APP_FULL_NAME} — ${CONFIG.APP_NAME}`;

// ---- Data layer wiring --------------------------------------------------
// Everything below this line is the ONLY place that knows we're using
// localStorage right now. Phase 15 will swap LocalStorageAdapter for
// ApiAdapter here, and nothing else in the app needs to change.
const storageAdapter = new LocalStorageAdapter();
const categoryRepository = new CategoryRepository(storageAdapter);

function updatePreviewAmounts() {
  const budgetEl = qs('[data-demo="remaining-budget"]');
  const spentEl = qs('[data-demo="spent-food"]');

  if (budgetEl) budgetEl.textContent = formatCurrency(12450);
  if (spentEl) spentEl.textContent = formatCurrency(3200);
}

function runValidatorSmokeTest() {
  const result = validateField(-50, [
    { test: (v) => Validator.isRequired(v), message: 'Amount is required.' },
    { test: (v) => Validator.isPositiveNumber(v), message: 'Amount must be a positive number.' },
  ]);
  log('Validator smoke test for -50 (expects 1 error):', result);
}

/**
 * Renders category chips into the demo card so the data layer is visibly
 * proven, not just logged to the console.
 */
function renderCategoryChips(categories) {
  const container = qs('[data-demo="category-list"]');
  if (!container) return;

  container.innerHTML = '';

  for (const category of categories) {
    const chip = document.createElement('span');
    chip.textContent = category.name;
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';
    chip.style.gap = '6px';
    chip.style.padding = '6px 12px';
    chip.style.borderRadius = 'var(--radius-full)';
    chip.style.background = 'var(--surface-alt)';
    chip.style.color = 'var(--text-primary)';
    chip.style.fontSize = 'var(--font-size-sm)';
    chip.style.fontWeight = 'var(--font-weight-medium)';
    chip.style.border = '1px solid var(--border)';

    const dot = document.createElement('span');
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.borderRadius = '50%';
    dot.style.background = category.color;
    dot.style.flexShrink = '0';

    chip.prepend(dot);
    container.appendChild(chip);
  }
}

/**
 * Seeds default categories on first run (no-op on every run after that),
 * then loads and renders them. This is the Phase 4 proof-of-life for the
 * whole data layer.
 */
async function initDataLayer() {
  const wasSeeded = await categoryRepository.seedDefaults();
  log(wasSeeded ? 'Seeded default categories into localStorage.' : 'Categories already exist — skipped seeding.');

  const categories = await categoryRepository.getAll();
  log(`Loaded ${categories.length} categories from storage:`, categories);
  renderCategoryChips(categories);
}

async function init() {
  updatePreviewAmounts();
  runValidatorSmokeTest();
  await initDataLayer();
  log(`${CONFIG.APP_NAME} v${CONFIG.VERSION} initialized on ${formatDate(new Date())}`);
  eventBus.emit('app:ready', { timestamp: Date.now() });
}

eventBus.on('app:ready', (payload) => {
  log('Received app:ready event with payload:', payload);
});

document.addEventListener('DOMContentLoaded', init);