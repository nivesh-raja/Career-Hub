import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { studentOnly, facultyOnly, adminOnly } from '../middleware/role.middleware.js';
import {
    getStudentAnalytics,
    getFacultyAnalytics,
    getAdminAnalytics,
    getAIAnalytics,
    getSystemOverviewAndInsights
} from '../controllers/analytics.controller.js';

const router = Router();

router.get('/student', protect, studentOnly, getStudentAnalytics);
router.get('/faculty', protect, facultyOnly, getFacultyAnalytics);
router.get('/admin', protect, adminOnly, getAdminAnalytics);
router.get('/ai', protect, getAIAnalytics);
router.get('/overview', protect, getSystemOverviewAndInsights);

export default router;
