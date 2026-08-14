/* ==========================================================================
   SEMS — Theme Toggle
   Shared Light/Dark theme control. Reads the saved preference from
   localStorage, applies it to <html data-theme>, and persists changes when
   the user toggles. Imported and wired once by every page controller so
   theme logic lives here rather than being duplicated per page.
   ========================================================================== */

import { CONFIG } from '../../core/config.js';

const STORAGE_KEY = CONFIG.THEME.STORAGE_KEY;
const ATTRIBUTE = CONFIG.THEME.ATTRIBUTE;
const DEFAULT_THEME = CONFIG.THEME.DEFAULT;

/** Returns the saved theme ('light'|'dark') or null if none/unknown. */
export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch (error) {
    return null;
  }
}

/** Applies a theme to the document root without persisting it. */
export function applyTheme(theme) {
  document.documentElement.setAttribute(ATTRIBUTE, theme);
}

/** Applies a theme and persists the preference to localStorage. */
export function setTheme(theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    // Storage unavailable (e.g. private mode) — theme still works for this visit.
  }
}

/**
 * Applies the saved theme and wires up the toggle button (rendered in the
 * topbar/auth markup via [data-theme-toggle]). Safe to call before data
 * loads: it only touches the <html> element and the button's label/title.
 */
export function initThemeToggle() {
  applyTheme(getSavedTheme() || DEFAULT_THEME);

  const button = document.querySelector('[data-theme-toggle]');
  if (!button) return;

  const syncLabel = () => {
    const current = document.documentElement.getAttribute(ATTRIBUTE) || DEFAULT_THEME;
    const next = current === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', `Switch to ${next} theme`);
    button.setAttribute('title', `Switch to ${next} theme`);
  };

  button.addEventListener('click', () => {
    const current = document.documentElement.getAttribute(ATTRIBUTE) || DEFAULT_THEME;
    setTheme(current === 'dark' ? 'light' : 'dark');
    syncLabel();
  });

  syncLabel();
}

export default initThemeToggle;