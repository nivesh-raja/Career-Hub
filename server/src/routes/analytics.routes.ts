import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { studentOnly, facultyOnly, adminOnly, authorizeRole } from '../middleware/role.middleware.js';
import {
    getStudentAnalytics,
    getFacultyAnalytics,
    getAdminAnalytics,
    getAIAnalytics,
    getSystemOverviewAndInsights,
    getAlertsForRole
} from '../controllers/analytics.controller.js';

const router = Router();

router.get('/student', protect, studentOnly, getStudentAnalytics);
router.get('/student/:id', protect, authorizeRole('admin', 'student'), getStudentAnalytics);
router.get('/faculty', protect, facultyOnly, getFacultyAnalytics);
router.get('/faculty/:id', protect, authorizeRole('admin', 'faculty'), getFacultyAnalytics);
router.get('/admin', protect, adminOnly, getAdminAnalytics);
router.get('/ai', protect, getAIAnalytics);
router.get('/overview', protect, getSystemOverviewAndInsights);
router.get('/alerts', protect, getAlertsForRole);

export default router;

