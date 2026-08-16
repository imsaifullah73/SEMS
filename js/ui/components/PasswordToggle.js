import { qsa } from '../../core/utils.js';

export function initPasswordToggles() {
  qsa('[data-password-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const field = btn.closest('.password-field');
      const input = field ? field.querySelector('input[type="password"], input[type="text"]') : null;
      if (!input) return;

      const isVisible = field.classList.toggle('is-visible');
      input.type = isVisible ? 'text' : 'password';
      btn.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
      btn.setAttribute('title', isVisible ? 'Hide password' : 'Show password');
      input.focus();
    });
  });
}