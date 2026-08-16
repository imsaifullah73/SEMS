import { AuthService } from '../../services/AuthService.js';
import { qs, qsa } from '../../core/utils.js';
import { initThemeToggle } from '../components/ThemeToggle.js';
import { initPasswordToggles } from '../components/PasswordToggle.js';

function showFieldErrors(form, errors) {
  qsa('.form-error', form).forEach((el) => (el.textContent = ''));
  for (const [field, messages] of Object.entries(errors)) {
    const el = form.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = Array.isArray(messages) ? messages[0] : messages;
  }
}

function showError(message) {
  const el = qs('[data-auth-error]');
  if (el) el.textContent = message || '';
}

let pendingEmail = '';

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

  pendingEmail = result.data.email;
  showError('');
  form.hidden = true;
  showOtpStep(`Enter the verification code sent to ${pendingEmail}`);
}

function showOtpStep(hint) {
  const otpForm = qs('[data-otp-form]');
  const hintEl = qs('[data-otp-hint]');
  if (hintEl) hintEl.textContent = hint;
  otpForm.hidden = false;
  const input = qs('#register-otp');
  if (input) input.focus();
}

async function handleOtpSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = qs('button[type="submit"]', form);
  const otp = form.otp.value.trim();

  showError('');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verifying…';

  const result = await AuthService.verifyOtp({ email: pendingEmail, otp });

  if (!result.success) {
    const firstError = Object.values(result.errors)[0];
    showError(Array.isArray(firstError) ? firstError[0] : firstError);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Verify Email';
    return;
  }

  window.location.href = 'dashboard.html';
}

async function handleResend() {
  const btn = qs('[data-resend-otp]');
  btn.disabled = true;
  showError('');
  const result = await AuthService.resendOtp(pendingEmail);
  if (!result.success) {
    const firstError = Object.values(result.errors)[0];
    showError(Array.isArray(firstError) ? firstError[0] : firstError);
  } else {
    showOtpStep(`A new code was sent to ${pendingEmail}`);
  }
  btn.disabled = false;
}

function init() {
  initThemeToggle();
  initPasswordToggles();
  if (AuthService.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }
  const form = qs('[data-register-form]');
  if (form) form.addEventListener('submit', handleSubmit);

  const otpForm = qs('[data-otp-form]');
  if (otpForm) otpForm.addEventListener('submit', handleOtpSubmit);

  const resendBtn = qs('[data-resend-otp]');
  if (resendBtn) resendBtn.addEventListener('click', handleResend);
}

document.addEventListener('DOMContentLoaded', init);