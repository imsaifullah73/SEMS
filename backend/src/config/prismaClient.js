/* ==========================================================================
   SEMS Backend — Prisma Client Singleton
   A single shared PrismaClient instance for the whole app. Every file that
   needs the database imports THIS instance — creating a new PrismaClient
   per request would exhaust the database's connection pool.
   ========================================================================== */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();