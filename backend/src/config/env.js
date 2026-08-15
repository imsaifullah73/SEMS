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
  resendApiKey: process.env.RESEND_API_KEY || '',
  otpFromEmail: process.env.OTP_FROM_EMAIL || 'onboarding@resend.dev',
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES) || 10,
});