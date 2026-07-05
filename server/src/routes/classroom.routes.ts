import { Router } from 'express';
import { 
  getClassrooms, 
  createClassroom, 
  updateClassroom, 
  deleteClassroom 
} from '../controllers/classroom.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', protect, getClassrooms);
router.post('/', protect, adminOnly, createClassroom);
router.put('/:id', protect, adminOnly, updateClassroom);
router.delete('/:id', protect, adminOnly, deleteClassroom);

export default router;
