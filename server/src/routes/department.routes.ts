import { Router } from 'express';
import { getDepartments, createDepartment } from '../controllers/department.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', protect, getDepartments);
router.post('/', protect, adminOnly, createDepartment);

export default router;
