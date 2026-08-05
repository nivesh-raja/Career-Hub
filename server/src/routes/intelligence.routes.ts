import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    getDashboardIntelligence,
    lazyLoadTimeline,
    getUserWeeklyReport,
    listNotifications,
    setNotificationRead,
    setAllNotificationsRead,
    removeNotification
} from '../controllers/intelligence.controller.js';

const router = Router();

router.get('/dashboard', protect, getDashboardIntelligence);
router.get('/timeline', protect, lazyLoadTimeline);
router.get('/weekly', protect, getUserWeeklyReport);
router.get('/report', protect, getUserWeeklyReport);
router.get('/notifications', protect, listNotifications);
router.put('/notifications/mark-all-read', protect, setAllNotificationsRead);
router.put('/notifications/:id/read', protect, setNotificationRead);
router.delete('/notifications/:id', protect, removeNotification);

export default router;
