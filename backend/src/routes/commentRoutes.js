import { Router } from 'express';
import {
  listComments,
  createComment,
  replyComment,
  setBlocked,
  seedTestimonials,
} from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', listComments);
router.post('/', createComment);
router.post('/:id/reply', authMiddleware, replyComment);
router.patch('/:id/block', authMiddleware, setBlocked);
router.post('/seed/testimonials', authMiddleware, seedTestimonials);

export default router;