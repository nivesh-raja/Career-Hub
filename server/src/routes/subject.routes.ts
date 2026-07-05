import { Router } from 'express';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../controllers/subject.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', protect, getSubjects);
router.post('/', protect, adminOnly, createSubject);
router.put('/:id', protect, adminOnly, updateSubject);
router.delete('/:id', protect, adminOnly, deleteSubject);

export default router;
