/* ==========================================================================
   SEMS — General Utilities
   Small, reusable helper functions with no dependency on the DOM's current
   state or on app data — pure formatting/logic helpers only. Depends on
   config.js for currency/date/locale settings.
   ========================================================================== */

import { CONFIG } from './config.js';

/**
 * Formats a number as PKR currency, e.g. formatCurrency(12450) -> "Rs. 12,450.00"
 */
export function formatCurrency(amount, { showSymbol = true } = {}) {
  const safeAmount = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
  const formatted = safeAmount.toLocaleString(CONFIG.CURRENCY.LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return showSymbol ? `${CONFIG.CURRENCY.SYMBOL} ${formatted}` : formatted;
}

/**
 * Parses a "YYYY-MM-DD" date string as a LOCAL calendar date (local
 * midnight). A plain `new Date("YYYY-MM-DD")` is interpreted as UTC
 * midnight, which shifts the entered date by the timezone offset. This
 * helper keeps storage/bucketing/display on the same local interpretation.
 * Dates and invalid/other strings are passed through so existing callers
 * behave as before.
 */
export function parseLocalDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

/**
 * Returns today's date as a local "YYYY-MM-DD" string (unlike
 * `new Date().toISOString().slice(0, 10)`, which is the UTC date and can be
 * off by one day in timezones ahead of UTC, e.g. Pakistan early morning).
 */
export function todayLocalDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a Date (or date string) using the app's configured locale.
 */
export function formatDate(value, options = CONFIG.DATE.DISPLAY_FORMAT) {
  const date = parseLocalDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(CONFIG.DATE.LOCALE, options);
}

/**
 * Generates a reasonably-unique local ID, e.g. "exp_m3x9a1b2c".
 * Good enough for localStorage-based records (Phase 4). Will be swapped
 * for real database IDs once the backend exists (Phase 13+).
 */
export function generateId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Debounce — delays calling fn until `delay` ms have passed since the last call.
 * Will be used for things like live search/filtering in later phases.
 */
export function debounce(fn, delay = 300) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Deep clones a plain object/array — used before mutating data pulled from
 * storage, so we never accidentally mutate cached state by reference.
 */
export function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function capitalize(text) {
  if (typeof text !== 'string' || text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Shorthand querySelector, scoped to `document` by default. */
export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/** Shorthand querySelectorAll returning a real array, scoped to `document` by default. */
export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/** Console logging gated by CONFIG.DEBUG, prefixed with the app name. */
export function log(...args) {
  if (CONFIG.DEBUG) {
    console.log(`[${CONFIG.APP_NAME}]`, ...args);
  }
}

/**
 * Returns HTML for `rows` skeleton <tr> elements with `cols` shimmering
 * placeholder cells each — used as a loading state for tables so the app
 * never shows a jarring blank flash while data loads from storage.
 */
export function skeletonRowsHtml(rows = 4, cols = 5) {
  const cells = Array.from({ length: cols }, () => '<td><span class="skeleton skeleton--text"></span></td>').join('');
  return Array.from({ length: rows }, () => `<tr class="skeleton-row">${cells}</tr>`).join('');
}

/**
 * Returns HTML for a standardized error banner, shown in place of content
 * when a storage read/write unexpectedly fails.
 */
export function errorBannerHtml(message = 'Please try refreshing the page.') {
  return `<div class="error-banner"><strong>Something went wrong.</strong>${message}</div>`;
}