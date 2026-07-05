import { Router } from 'express';
import { getTimetable, createOrUpdateTimetable, deleteTimetable } from '../controllers/timetable.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getTimetable);
router.post('/', authorizeRole('faculty', 'admin'), createOrUpdateTimetable);
router.delete('/:id', authorizeRole('faculty', 'admin'), deleteTimetable);

export default router;
