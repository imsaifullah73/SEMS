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
});