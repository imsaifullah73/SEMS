/* ==========================================================================
   SEMS Backend — Email Service (Resend)
   Sends transactional email: account-verification OTP and a personalised
   welcome message from the founder. Uses the Resend API key from env config.
   ========================================================================== */

import { config } from '../config/env.js';

async function sendEmail({ toEmail, subject, html }) {
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
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${text}`);
  }

  return true;
}

export async function sendOtpEmail(toEmail, otp) {
  return sendEmail({
    toEmail,
    subject: 'Your SEMS verification code',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;padding:24px;">
        <h2 style="color:#2B3467;">Verify your SEMS account</h2>
        <p>Use the code below to finish creating your account. It expires in ${config.otpTtlMinutes} minutes.</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2B3467;margin:20px 0;">${otp}</div>
        <p style="color:#666;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(toEmail, name) {
  const firstName = (name || '').split(' ')[0];
  return sendEmail({
    toEmail,
    subject: 'Welcome to SEMS 🎉 — from Saif Ullah',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1a1a1a;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#2B3467,#3B4583);color:#fff;font-size:28px;font-weight:700;line-height:56px;text-align:center;">S</div>
        </div>
        <h1 style="color:#2B3467;text-align:center;">Welcome to SEMS, ${firstName}!</h1>
        <p style="font-size:15px;line-height:1.6;">
          I'm <strong>Saif Ullah</strong>, the founder of SEMS. On behalf of our whole team — a warm, personal welcome.
          Thank you for creating your account. This is the first step toward taking real control of your money.
        </p>
        <p style="font-size:15px;line-height:1.6;">
          I built SEMS because I used to forget my daily expenses — small amounts that quietly disappeared.
          I believe every student deserves to know exactly where their money goes. I hope SEMS brings you real,
          everyday benefit and becomes a habit you never want to drop.
        </p>
        <div style="background:#F6F7FB;border-left:4px solid #D4A017;padding:14px 18px;border-radius:8px;margin:20px 0;">
          <p style="margin:0;font-size:14px;line-height:1.6;">
            If you ever face any issue, have a question, or just want to discuss something about the software —
            <strong>feel free to contact me directly.</strong> Your feedback truly helps me make SEMS better for everyone.
          </p>
        </div>
        <p style="font-size:15px;line-height:1.6;">I truly hope you love it. Start small, track everything, and watch your control grow. 💪</p>
        <p style="font-size:15px;">Warm regards,<br/><strong>Saif Ullah</strong><br/><span style="color:#666;">Founder, SEMS</span></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#999;font-size:12px;text-align:center;">You're receiving this because you created an account on SEMS.</p>
      </div>
    `,
  });
}