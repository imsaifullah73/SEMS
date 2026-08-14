import { AuthService } from '../../services/AuthService.js';
import { qs, qsa } from '../../core/utils.js';
import { initThemeToggle } from '../components/ThemeToggle.js';

function showFieldErrors(form, errors) {
  qsa('.form-error', form).forEach((el) => (el.textContent = ''));
  for (const [field, messages] of Object.entries(errors)) {
    const el = form.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = Array.isArray(messages) ? messages[0] : messages;
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = qs('button[type="submit"]', form);

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account…';

  const result = await AuthService.register({ name, email, password });

  if (!result.success) {
    showFieldErrors(form, result.errors);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
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
  const form = qs('[data-register-form]');
  if (form) form.addEventListener('submit', handleSubmit);
}

document.addEventListener('DOMContentLoaded', init);