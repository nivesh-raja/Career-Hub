/**
 * =====================================================================
 * Phase 5B.3C — Explanation Controller
 * POST /api/intelligence/explain
 * =====================================================================
 *
 * The backend determines the user's role and retrieves the authoritative
 * intelligence snapshot from trusted server-side sources only.
 * The client CANNOT submit arbitrary scores.
 *
 * Security:
 *   • JWT required
 *   • Role-scoped: student → own data, faculty → own scope, admin → institution
 *   • No secrets are passed to Gemini
 * =====================================================================
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
    calculateHealthScores,
    getRecommendations,
    getPredictions,
    getAlerts,
    getWeeklyReport
} from '../services/intelligence.service.js';
import { generateExplanation } from '../services/explanation.service.js';

/**
 * @desc    Generate AI explanation for authenticated user's intelligence snapshot
 * @route   POST /api/intelligence/explain
 * @access  Private (Student, Faculty, Admin) — server-side authoritative data only
 */
export const generateIntelligenceExplanation = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const userId = req.user._id.toString();
        const role = req.user.role;

        // Validate role — only supported roles receive explanation
        if (!['student', 'faculty', 'admin'].includes(role)) {
            res.status(403).json({ success: false, message: 'Role not authorized for explanation service' });
            return;
        }

        // Retrieve authoritative intelligence snapshot in parallel from trusted sources
        // The client CANNOT inject or override these values.
        const [scores, recommendations, predictions, alerts, weeklyReport] = await Promise.all([
            calculateHealthScores(userId, role),
            getRecommendations(userId, role),
            getPredictions(userId, role, '7_DAYS'),
            getAlerts(userId, role),
            getWeeklyReport(userId, role)
        ]);

        const snapshot = {
            scores,
            recommendations,
            predictions,
            alerts,
            weeklyReport: weeklyReport?.reportData || {}
        };

        // Generate explanation from trusted snapshot
        const result = await generateExplanation(userId, role, snapshot);

        res.status(200).json(result);
    } catch (error: any) {
        console.error('[ExplainController] Error:', error.message);
        // Do NOT expose stack trace or internal error details
        res.status(500).json({
            success: false,
            message: 'Unable to generate explanation. Please try again later.'
        });
    }
};
