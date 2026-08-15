/* ==========================================================================
   SEMS Backend — Email Service (Resend)
   Sends transactional email, primarily the account-verification OTP.
   Uses the Resend API key from env config.
   ========================================================================== */

import { config } from '../config/env.js';

export async function sendOtpEmail(toEmail, otp) {
  if (!config.resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.resendApiKey}`,
    },
    body: JSON.stringify({
      from: `SEMS <${config.otpFromEmail}>`,
      to: [toEmail],
      subject: 'Your SEMS verification code',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:24px;">
          <h2 style="color:#2B3467;">Verify your SEMS account</h2>
          <p>Use the code below to finish creating your account. It expires in ${config.otpTtlMinutes} minutes.</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2B3467;margin:20px 0;">${otp}</div>
          <p style="color:#666;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${text}`);
  }

  return true;
}