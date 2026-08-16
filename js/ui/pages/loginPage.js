import { AuthService } from '../../services/AuthService.js';
import { qs } from '../../core/utils.js';
import { initThemeToggle } from '../components/ThemeToggle.js';
import { initPasswordToggles } from '../components/PasswordToggle.js';

function showError(message) {
  const el = qs('[data-auth-error]');
  if (el) el.textContent = message || '';
}

let pendingEmail = '';

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
    if (result.errors.requiresVerification) {
      pendingEmail = result.errors.email || email;
      form.hidden = true;
      showOtpStep(`Please verify your email. A code was sent to ${pendingEmail}`);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log In';
      return;
    }
    const firstError = Object.values(result.errors)[0];
    showError(Array.isArray(firstError) ? firstError[0] : firstError);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
    return;
  }

  window.location.href = 'dashboard.html';
}

function showOtpStep(hint) {
  const otpForm = qs('[data-otp-form]');
  const hintEl = qs('[data-otp-hint]');
  if (hintEl) hintEl.textContent = hint;
  otpForm.hidden = false;
  const input = qs('#login-otp');
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
  const form = qs('[data-login-form]');
  if (form) form.addEventListener('submit', handleSubmit);

  const otpForm = qs('[data-otp-form]');
  if (otpForm) otpForm.addEventListener('submit', handleOtpSubmit);

  const resendBtn = qs('[data-resend-otp]');
  if (resendBtn) resendBtn.addEventListener('click', handleResend);
}

document.addEventListener('DOMContentLoaded', init);