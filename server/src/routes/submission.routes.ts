import { Router } from 'express';
import { getSubmissions, createSubmission, reviewSubmission } from '../controllers/submission.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getSubmissions);
router.post('/', authorizeRole('student'), createSubmission);
router.put('/:id/review', authorizeRole('faculty', 'admin'), reviewSubmission);

export default router;
