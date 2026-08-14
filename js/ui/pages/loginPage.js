import { AuthService } from '../../services/AuthService.js';
import { qs } from '../../core/utils.js';
import { initThemeToggle } from '../components/ThemeToggle.js';

function showError(message) {
  const el = qs('[data-auth-error]');
  if (el) el.textContent = message || '';
}

async function handleSubmit(e) {
  e.preventDefault();
  showError('');

  const form = e.target;
  const submitBtn = qs('button[type="submit"]', form);
  const email = form.email.value.trim();
  const password = form.password.value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in…';

  const result = await AuthService.login({ email, password });

  if (!result.success) {
    const firstError = Object.values(result.errors)[0];
    showError(Array.isArray(firstError) ? firstError[0] : firstError);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
    return;
  }

  window.location.href = 'index.html';
}

function init() {
  initThemeToggle();
  if (AuthService.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }
  const form = qs('[data-login-form]');
  if (form) form.addEventListener('submit', handleSubmit);
}

document.addEventListener('DOMContentLoaded', init);