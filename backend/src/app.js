/* ==========================================================================
   SEMS Backend — Express App Setup
   Phase 14: mounts /api/auth (public) separately from the rest of /api
   (protected by authMiddleware, applied inside routes/index.js).
   ========================================================================== */

import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/env.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'SEMS API is running.', version: '0.3.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/diag/email', (req, res) => {
  const c = config;
  res.json({
    serviceSet: Boolean(c.emailjsServiceId),
    otpTemplateSet: Boolean(c.emailjsOtpTemplateId),
    welcomeTemplateSet: Boolean(c.emailjsWelcomeTemplateId),
    publicKeySet: Boolean(c.emailjsPublicKey),
    privateKeySet: Boolean(c.emailjsPrivateKey),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;