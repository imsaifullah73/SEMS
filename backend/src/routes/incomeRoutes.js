import { Router } from 'express';
import {
  getIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} from '../controllers/incomeController.js';

const router = Router();

router.get('/', getIncome);
router.get('/:id', getIncomeById);
router.post('/', createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

export default router;