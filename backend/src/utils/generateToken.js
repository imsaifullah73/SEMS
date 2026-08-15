/* ==========================================================================
   SEMS Backend — JWT Token Generator
   Signs a token containing only the user's id (never the password hash or
   anything sensitive). authMiddleware.js verifies this same token on every
   protected request.
   ========================================================================== */

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function generateToken(userId, email) {
  const payload = email ? { id: userId, email } : { id: userId };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}