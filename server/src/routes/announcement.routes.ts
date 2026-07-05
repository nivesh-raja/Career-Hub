import { Router } from 'express';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcement.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorizeRole('faculty', 'admin'), createAnnouncement);
router.put('/:id', authorizeRole('faculty', 'admin'), updateAnnouncement);
router.delete('/:id', authorizeRole('faculty', 'admin'), deleteAnnouncement);

export default router;
