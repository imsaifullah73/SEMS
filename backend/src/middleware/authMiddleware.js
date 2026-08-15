/* ==========================================================================
   SEMS Backend — Auth Middleware
   Protects routes by requiring a valid JWT in the Authorization header
   (format: "Bearer <token>"). On success, attaches { id } to req.user so
   every controller downstream can scope its database queries to the
   logged-in user. On failure, responds 401 and never calls next().
   ========================================================================== */

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}