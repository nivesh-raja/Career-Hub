import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    getDashboardIntelligence,
    lazyLoadTimeline,
    getUserWeeklyReport,
    listNotifications,
    setNotificationRead,
    setAllNotificationsRead,
    removeNotification,
    getUserRecommendations,
    getUserPredictions,
    getUserRiskAssessment,
    getUserInterventions
} from '../controllers/intelligence.controller.js';
import { generateIntelligenceExplanation } from '../controllers/explanation.controller.js';

const router = Router();

// Phase 5B.3C — AI Explanation Engine
router.post('/explain', protect, generateIntelligenceExplanation);

router.get('/dashboard', protect, getDashboardIntelligence);
router.get('/timeline', protect, lazyLoadTimeline);
router.get('/weekly', protect, getUserWeeklyReport);
router.get('/report', protect, getUserWeeklyReport);
router.get('/recommendations', protect, getUserRecommendations);
router.get('/predictions', protect, getUserPredictions);
router.get('/risk', protect, getUserRiskAssessment);
// Phase 5B.4A — Deterministic Adaptive Intervention Engine
router.get('/interventions', protect, getUserInterventions);
router.get('/notifications', protect, listNotifications);
router.put('/notifications/mark-all-read', protect, setAllNotificationsRead);
router.put('/notifications/:id/read', protect, setNotificationRead);
router.delete('/notifications/:id', protect, removeNotification);

export default router;
