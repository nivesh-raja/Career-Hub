import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
    calculateHealthScores,
    getRecommendations,
    getPredictions,
    getAlerts,
    getTimeline,
    getWeeklyReport,
    getInsights,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    getAcademicRisk
} from '../services/intelligence.service.js';

/**
 * @desc    Get complete intelligence analytics package for user dashboard
 * @route   GET /api/intelligence/dashboard
 * @access  Private (Student, Faculty, Admin)
 */
export const getDashboardIntelligence = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role;

        // Parallel calculations for efficiency
        const [scores, recommendations, predictions, alerts, weeklyReport, insights] = await Promise.all([
            calculateHealthScores(userId, role),
            getRecommendations(userId, role),
            getPredictions(userId, role),
            getAlerts(userId, role),
            getWeeklyReport(userId, role),
            getInsights(userId, role)
        ]);

        res.status(200).json({
            success: true,
            scores,
            recommendations,
            predictions,
            alerts,
            weeklyReport: weeklyReport.reportData,
            insights
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Lazy-load chronological activity timeline
 * @route   GET /api/intelligence/timeline
 * @access  Private (Student, Faculty, Admin)
 */
export const lazyLoadTimeline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const filter = req.query.filter as string;

        const timelineData = await getTimeline(userId, role, page, limit, filter);

        res.status(200).json({
            success: true,
            ...timelineData
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get Current Weekly Performance & AI Evaluation Report
 * @route   GET /api/intelligence/weekly
 * @route   GET /api/intelligence/report
 * @access  Private (Student, Faculty, Admin)
 */
export const getUserWeeklyReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role;

        const report = await getWeeklyReport(userId, role);

        res.status(200).json({
            success: true,
            report
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get paginated notifications
 * @route   GET /api/intelligence/notifications
 * @access  Private (Student, Faculty, Admin)
 */
export const listNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const notificationsData = await getNotifications(userId, page, limit);

        res.status(200).json({
            success: true,
            ...notificationsData
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/intelligence/notifications/:id/read
 * @access  Private (Student, Faculty, Admin)
 */
export const setNotificationRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const notificationId = req.params.id;

        const updated = await markNotificationRead(notificationId, userId);
        if (!updated) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }

        res.status(200).json({ success: true, notification: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/intelligence/notifications/mark-all-read
 * @access  Private (Student, Faculty, Admin)
 */
export const setAllNotificationsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();

        await markAllNotificationsRead(userId);

        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete custom notification
 * @route   DELETE /api/intelligence/notifications/:id
 * @access  Private (Student, Faculty, Admin)
 */
export const removeNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const notificationId = req.params.id;

        const deleted = await deleteNotification(notificationId, userId);
        if (deleted.deletedCount === 0) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }

        res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get user recommendations (AI Recommendation Engine) (Module 7)
 * @route   GET /api/intelligence/recommendations
 * @access  Private (Student, Faculty, Admin)
 */
export const getUserRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role;

        const recommendations = await getRecommendations(userId, role);

        res.status(200).json({
            success: true,
            recommendations
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get user predictions (Predictive Intelligence) (Module 7)
 * @route   GET /api/intelligence/predictions
 * @access  Private (Student, Faculty, Admin)
 */
export const getUserPredictions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role;

        const predictions = await getPredictions(userId, role);

        res.status(200).json({
            success: true,
            predictions
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get academic risk assessment (Module 7)
 * @route   GET /api/intelligence/risk
 * @access  Private (Student, Faculty, Admin)
 */
export const getUserRiskAssessment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role;

        const risk = await getAcademicRisk(userId, role);

        res.status(200).json({
            success: true,
            risk
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

