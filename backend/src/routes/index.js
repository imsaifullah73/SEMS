/* ==========================================================================
   SEMS Backend — Route Aggregator
   Phase 14: every resource route now requires authMiddleware, so
   /api/categories, /api/expenses, /api/income, /api/budgets all need a
   valid "Authorization: Bearer <token>" header.
   ========================================================================== */

import { Router } from 'express';
import categoryRoutes from './categoryRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import incomeRoutes from './incomeRoutes.js';
import budgetRoutes from './budgetRoutes.js';
import commentRoutes from './commentRoutes.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use('/categories', authMiddleware, categoryRoutes);
router.use('/expenses', authMiddleware, expenseRoutes);
router.use('/income', authMiddleware, incomeRoutes);
router.use('/budgets', authMiddleware, budgetRoutes);
router.use('/comments', commentRoutes);

export default router;