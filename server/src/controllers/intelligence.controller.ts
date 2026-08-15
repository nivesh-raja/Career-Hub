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
import { generateInterventions, syncAndGetActiveInterventions, getHistoricalInterventions, updateInterventionStatus } from '../services/intervention.service.js';
import InterventionAction from '../models/interventionAction.model.js';

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
        const period = (req.query.period as string) || '7_DAYS';

        const predictions = await getPredictions(userId, role, period);

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

/**
 * @desc    Phase 5B.4A — Get deterministic intervention plans for the authenticated user
 * @route   GET /api/intelligence/interventions
 * @access  Private (Student, Faculty, Admin)
 *
 * Role and userId are derived exclusively from the server-side JWT.
 * The client never provides authoritative metrics — they are computed from MongoDB.
 */
export const getUserInterventions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        // Role is always derived from the authenticated server-side identity.
        // Never trust client-provided role values.
        const role = req.user.role as 'student' | 'faculty' | 'admin';

        const result = await syncAndGetActiveInterventions(userId, role);

        res.status(200).json(result);
    } catch (error: any) {
        // Do not expose internal stack traces
        res.status(error.status || 500).json({ success: false, message: error.message || 'Intervention engine encountered an error. Please try again.' });
    }
};

/**
 * @desc    Phase 5B.4B — Get historical (completed/dismissed/expired) intervention plans for the authenticated user
 * @route   GET /api/intelligence/interventions/history
 * @access  Private (Student, Faculty, Admin)
 */
export const getUserInterventionsHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role as 'student' | 'faculty' | 'admin';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;

        const result = await getHistoricalInterventions(userId, role, page, limit);

        res.status(200).json(result);
    } catch (error: any) {
        res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to retrieve historical interventions.' });
    }
};

/**
 * @desc    Phase 5B.4B — Get a single intervention action by ID with security checks
 * @route   GET /api/intelligence/interventions/:id
 * @access  Private (Student, Faculty, Admin)
 */
export const getInterventionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role as 'student' | 'faculty' | 'admin';
        const { id } = req.params;

        const action = await InterventionAction.findById(id);
        if (!action) {
            res.status(404).json({ success: false, message: 'Intervention action not found' });
            return;
        }

        // Validate Security (RBAC)
        if (role !== 'admin' && action.user.toString() !== userId) {
            res.status(403).json({ success: false, message: 'Access denied: Cannot view another user\'s intervention' });
            return;
        }

        res.status(200).json({ success: true, intervention: action });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Intervention engine encountered an error. Please try again.' });
    }
};

const updateStatusController = async (req: AuthenticatedRequest, res: Response, targetStatus: any): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role as 'student' | 'faculty' | 'admin';
        const { id } = req.params;

        const result = await updateInterventionStatus(userId, role, id, targetStatus);

        res.status(200).json({ success: true, intervention: result });
    } catch (error: any) {
        res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to update status.' });
    }
};

export const acknowledgeIntervention = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await updateStatusController(req, res, 'ACKNOWLEDGED');
};

export const startIntervention = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await updateStatusController(req, res, 'IN_PROGRESS');
};

export const completeIntervention = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await updateStatusController(req, res, 'COMPLETED');
};

export const dismissIntervention = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await updateStatusController(req, res, 'DISMISSED');
};

