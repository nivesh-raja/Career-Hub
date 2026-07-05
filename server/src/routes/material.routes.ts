import { Router } from 'express';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial, incrementDownloads } from '../controllers/material.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect);

router.get('/', getMaterials);
router.post('/', authorizeRole('faculty', 'admin'), createMaterial);
router.put('/:id', authorizeRole('faculty', 'admin'), updateMaterial);
router.delete('/:id', authorizeRole('faculty', 'admin'), deleteMaterial);
router.patch('/:id/download', incrementDownloads);

export default router;
