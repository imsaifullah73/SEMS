/* ==========================================================================
   SEMS Backend — Environment Configuration
   Phase 14 adds jwtSecret, used to sign/verify login tokens.
   ========================================================================== */

import dotenv from 'dotenv';

dotenv.config();

export const config = Object.freeze({
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-fallback-secret-change-this',
  emailjsServiceId: process.env.EMAILJS_SERVICE_ID || '',
  emailjsOtpTemplateId: process.env.EMAILJS_OTP_TEMPLATE_ID || '',
  emailjsWelcomeTemplateId: process.env.EMAILJS_WELCOME_TEMPLATE_ID || '',
  emailjsResetPasswordTemplateId: process.env.EMAILJS_RESET_PASSWORD_TEMPLATE_ID || '',
  emailjsPublicKey: process.env.EMAILJS_PUBLIC_KEY || '',
  emailjsPrivateKey: process.env.EMAILJS_PRIVATE_KEY || '',
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES) || 10,
});