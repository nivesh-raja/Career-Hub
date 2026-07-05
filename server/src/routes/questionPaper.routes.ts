import { Router } from 'express';
import { getQuestionPapers, createQuestionPaper, updateQuestionPaper, deleteQuestionPaper } from '../controllers/questionPaper.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getQuestionPapers);
router.post('/', authorizeRole('faculty', 'admin'), createQuestionPaper);
router.put('/:id', authorizeRole('faculty', 'admin'), updateQuestionPaper);
router.delete('/:id', authorizeRole('faculty', 'admin'), deleteQuestionPaper);

export default router;
