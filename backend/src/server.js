/* ==========================================================================
   SEMS Backend — Server Entry Point
   IMPORTANT: config/env.js is imported FIRST (before app.js) so that
   dotenv.config() runs and loads DATABASE_URL from .env before Prisma
   Client gets instantiated anywhere in the app's import chain.
   ========================================================================== */

import './config/env.js';
import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[SEMS API] Server running on http://localhost:${PORT}`);
});