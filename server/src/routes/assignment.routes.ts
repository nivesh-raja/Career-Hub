import { Router } from 'express';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../controllers/assignment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getAssignments);
router.post('/', authorizeRole('faculty', 'admin'), createAssignment);
router.put('/:id', authorizeRole('faculty', 'admin'), updateAssignment);
router.delete('/:id', authorizeRole('faculty', 'admin'), deleteAssignment);

export default router;
