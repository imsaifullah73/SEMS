/* ==========================================================================
   SEMS — Forgot Password Flow Component
   A reusable multi-step modal that walks a user through resetting their
   password: enter email -> enter OTP -> set new password -> done.
   Reuses the existing Modal, Toast, Validator and PasswordToggle.
   ========================================================================== */

import { Modal } from './Modal.js';
import { showToast } from './Toast.js';
import { initPasswordToggles } from './PasswordToggle.js';
import { Validator } from '../../core/validator.js';
import { AuthService } from '../../services/AuthService.js';

export function openForgotPassword() {
  let modal = null;
  let email = '';
  let fpOtp = '';

  const showError = (body, msg) => {
    const el = body.querySelector('[data-fp-error]');
    if (el) el.textContent = msg || '';
  };

  const openStep = (step) => {
    let bodyHTML = '';
    let footerHTML = '';

    if (step === 'email') {
      bodyHTML = `
        <p class="text-secondary">Enter your account email. If it exists, we'll send you a 6-digit reset code.</p>
        <div class="form-group">
          <label for="fp-email">Email</label>
          <input id="fp-email" name="email" type="email" class="form-input" autocomplete="email" required />
        </div>
        <p class="auth-error" data-fp-error></p>
      `;
      footerHTML = `
        <button type="button" class="btn btn--primary" style="width:100%;" data-fp-next>Send Reset Code</button>
      `;
    } else if (step === 'otp') {
      bodyHTML = `
        <p class="text-secondary">Enter the 6-digit code we emailed you.</p>
        <div class="form-group">
          <label for="fp-otp">Verification code</label>
          <input id="fp-otp" name="otp" type="text" class="form-input" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required />
        </div>
        <p class="auth-error" data-fp-error></p>
      `;
      footerHTML = `
        <button type="button" class="btn btn--primary" style="width:100%;" data-fp-next>Verify Code</button>
      `;
    } else if (step === 'password') {
      bodyHTML = `
        <p class="text-secondary">Choose a new password (at least 6 characters).</p>
        <div class="form-group">
          <label for="fp-password">New password</label>
          <div class="password-field">
            <input id="fp-password" name="newPassword" type="password" class="form-input" minlength="6" autocomplete="new-password" required />
            <button type="button" class="password-toggle" data-password-toggle aria-label="Show password" title="Show password">
              <svg class="password-toggle__icon password-toggle__icon--eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg class="password-toggle__icon password-toggle__icon--eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><path d="M1 1l22 22"/></svg>
            </button>
          </div>
          <p class="form-error" data-fp-password-error></p>
        </div>
        <p class="auth-error" data-fp-error></p>
      `;
      footerHTML = `
        <button type="button" class="btn btn--primary" style="width:100%;" data-fp-next>Reset Password</button>
      `;
    } else {
      bodyHTML = `
        <div class="confirm-dialog-body">
          <div class="confirm-dialog-icon confirm-dialog-icon--neutral">✓</div>
          <p class="confirm-dialog-message">Your password has been reset successfully. You can now log in with your new password.</p>
        </div>
      `;
      footerHTML = `
        <button type="button" class="btn btn--primary" style="width:100%;" data-fp-close>Back to Login</button>
      `;
    }

    const body = document.createElement('div');
    body.innerHTML = bodyHTML;

    let footer = null;
    if (footerHTML) {
      footer = document.createElement('div');
      footer.innerHTML = footerHTML;
    }

    modal = new Modal({
      title: 'Forgot Password',
      bodyElement: body,
      footerElement: footer,
      onClose: () => {
        modal = null;
      },
    });
    modal.open();

    const btn = footer ? footer.querySelector('[data-fp-next]') : null;
    const closeBtn = footer ? footer.querySelector('[data-fp-close]') : null;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.close());
    }

    if (btn) {
      btn.addEventListener('click', async () => {
        showError(body, '');

        if (step === 'email') {
          const value = body.querySelector('#fp-email').value.trim();
          if (!Validator.isEmail(value)) {
            showError(body, 'Please enter a valid email address.');
            return;
          }
          btn.disabled = true;
          btn.textContent = 'Sending…';
          const result = await AuthService.forgotPassword(value);
          btn.disabled = false;
          btn.textContent = 'Send Reset Code';
          if (!result.success) {
            showError(body, Object.values(result.errors)[0]);
            return;
          }
          email = value;
          modal.close();
          openStep('otp');
        } else if (step === 'otp') {
          const value = body.querySelector('#fp-otp').value.trim();
          if (!/^\d{6}$/.test(value)) {
            showError(body, 'Please enter the 6-digit code.');
            return;
          }
          fpOtp = value;
          modal.close();
          openStep('password');
        } else if (step === 'password') {
          const value = body.querySelector('#fp-password').value;
          const pwdErr = body.querySelector('[data-fp-password-error]');
          if (!value || value.length < 6) {
            if (pwdErr) pwdErr.textContent = 'Password must be at least 6 characters.';
            return;
          }
          if (pwdErr) pwdErr.textContent = '';
          if (!email || !fpOtp) {
            showError(body, 'Session expired. Please start again.');
            return;
          }
          btn.disabled = true;
          btn.textContent = 'Resetting…';
          const result = await AuthService.resetPassword({ email, otp: fpOtp, newPassword: value });
          btn.disabled = false;
          if (!result.success) {
            btn.textContent = 'Reset Password';
            showError(body, Object.values(result.errors)[0]);
            return;
          }
          modal.close();
          openStep('success');
          showToast('Password reset successfully.', { type: 'success' });
        }
      });
    }

    if (step === 'password') initPasswordToggles();
  };

  openStep('email');
}

export default openForgotPassword;