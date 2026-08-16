/* ==========================================================================
   SEMS Backend — Email Service (EmailJS)
   Sends transactional email through the EmailJS REST API: the account
   verification OTP and a personalised welcome message from the founder.
   EmailJS works without needing your own domain, and can send to any
   recipient's email address.
   ========================================================================== */

import { config } from '../config/env.js';

async function sendTemplate({ templateId, toEmail, params }) {
  if (!config.emailjsServiceId || !config.emailjsPublicKey) {
    throw new Error('EmailJS is not configured (EMAILJS_SERVICE_ID / EMAILJS_PUBLIC_KEY).');
  }

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: config.emailjsServiceId,
      template_id: templateId,
      user_id: config.emailjsPublicKey,
      accessToken: config.emailjsPrivateKey,
      template_params: { ...params, email: toEmail },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`EmailJS error ${res.status}: ${text}`);
  }

  return true;
}

export async function sendOtpEmail(toEmail, otp) {
  if (!config.emailjsOtpTemplateId) {
    throw new Error('EMAILJS_OTP_TEMPLATE_ID is not configured.');
  }
  return sendTemplate({
    templateId: config.emailjsOtpTemplateId,
    toEmail,
    params: { otp },
  });
}

export async function sendWelcomeEmail(toEmail, name) {
  if (!config.emailjsWelcomeTemplateId) {
    throw new Error('EMAILJS_WELCOME_TEMPLATE_ID is not configured.');
  }
  return sendTemplate({
    templateId: config.emailjsWelcomeTemplateId,
    toEmail,
    params: { name },
  });
}

export async function sendResetPasswordEmail(toEmail, otp) {
  if (!config.emailjsResetPasswordTemplateId) {
    throw new Error('EMAILJS_RESET_PASSWORD_TEMPLATE_ID is not configured.');
  }
  return sendTemplate({
    templateId: config.emailjsResetPasswordTemplateId,
    toEmail,
    params: { otp },
  });
}