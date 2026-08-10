import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Classroom from '../models/classroom.model.js';
import Department from '../models/department.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import Material from '../models/material.model.js';
import AIChat from '../models/aiChat.model.js';
import AINotes from '../models/aiNotes.model.js';
import AIFlashcard from '../models/aiFlashcard.model.js';
import AIQuiz from '../models/aiQuiz.model.js';
import AIStudyPlan from '../models/aiStudyPlan.model.js';
import AIAssignment from '../models/aiAssignment.model.js';
import AILessonPlan from '../models/aiLessonPlan.model.js';
import AIQuestionPaper from '../models/aiQuestionPaper.model.js';
import AINotice from '../models/aiNotice.model.js';
import ActivityTimeline from '../models/activityTimeline.model.js';

// =========================================================
// TYPES
// =========================================================

type TrendDirection = 'UP' | 'DOWN' | 'STABLE' | 'INSUFFICIENT_DATA';
type PredictionStatus = 'VALID' | 'INSUFFICIENT_DATA';

interface HistoricalPoint {
    period: string; // ISO date of the start of the week
    value: number;
}

interface PredictionResult {
    metric: string;
    currentValue: number;
    predictedValue: number | null;
    trend: TrendDirection;
    predictionHorizon: string;
    predictionStatus: PredictionStatus;
    historicalPoints: HistoricalPoint[];
    method: string;
    category: string;
    description: string;
    lastUpdated: string;
}

// =========================================================
// IN-MEMORY CACHE
// =========================================================

interface CacheEntry {
    data: any;
    timestamp: number;
}

const predictionCache = new Map<string, CacheEntry>();
const PREDICTION_CACHE_TTL = 30000; // 30 seconds

const getCached = (key: string): any | null => {
    const entry = predictionCache.get(key);
    if (entry && Date.now() - entry.timestamp < PREDICTION_CACHE_TTL) {
        return entry.data;
    }
    return null;
};

const setCache = (key: string, data: any): void => {
    predictionCache.set(key, { data, timestamp: Date.now() });
};

// =========================================================
// STATISTICAL ENGINE
// =========================================================

/**
 * WEEK BOUNDARY COMPUTATION
 * Generates ISO date strings for the start of each of the last N weeks.
 */
const getWeekBoundaries = (weeksBack: number): { start: Date; end: Date; label: string }[] => {
    const now = new Date();
    const weeks: { start: Date; end: Date; label: string }[] = [];

    for (let i = weeksBack - 1; i >= 0; i--) {
        const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        weeks.push({
            start,
            end,
            label: start.toISOString().split('T')[0]
        });
    }

    return weeks;
};

/**
 * COLLECT HISTORICAL WEEKLY COUNTS
 * Queries MongoDB for document counts across weekly time buckets.
 * Returns an array of weekly values from oldest to newest.
 */
const collectWeeklyCounts = async (
    model: any,
    filter: any,
    weeksBack: number = 4
): Promise<HistoricalPoint[]> => {
    const weeks = getWeekBoundaries(weeksBack);
    const points: HistoricalPoint[] = [];

    for (const week of weeks) {
        const count = await model.countDocuments({
            ...filter,
            createdAt: { $gte: week.start, $lt: week.end }
        });
        points.push({ period: week.label, value: count });
    }

    return points;
};

/**
 * COLLECT MULTI-MODEL WEEKLY COUNTS
 * Aggregates counts from multiple models across the same time buckets.
 */
const collectMultiModelWeeklyCounts = async (
    queries: { model: any; filter: any }[],
    weeksBack: number = 4
): Promise<HistoricalPoint[]> => {
    const weeks = getWeekBoundaries(weeksBack);
    const points: HistoricalPoint[] = [];

    for (const week of weeks) {
        let total = 0;
        for (const q of queries) {
            total += await q.model.countDocuments({
                ...q.filter,
                createdAt: { $gte: week.start, $lt: week.end }
            });
        }
        points.push({ period: week.label, value: total });
    }

    return points;
};

/**
 * MINIMUM DATA THRESHOLD
 * Requires at least 2 non-zero data points for a valid prediction.
 */
const hasMinimumData = (points: HistoricalPoint[]): boolean => {
    const nonZero = points.filter(p => p.value > 0).length;
    return nonZero >= 2;
};

/**
 * LINEAR TREND (LEAST SQUARES REGRESSION)
 *
 * Formula:
 *   slope = (n * Σ(x*y) - Σx * Σy) / (n * Σ(x²) - (Σx)²)
 *   intercept = (Σy - slope * Σx) / n
 *   predictedValue = slope * (n) + intercept   (next period)
 *
 * Uses index-based x values: 0, 1, 2, ..., n-1
 * Predicts for x = n (next period)
 *
 * Returns: { predictedValue, slope, trend }
 */
const linearTrend = (points: HistoricalPoint[], horizonWeeks: number = 1): {
    predictedValue: number;
    slope: number;
    trend: TrendDirection;
} => {
    const n = points.length;
    const values = points.map(p => p.value);

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
    }

    const denominator = n * sumX2 - sumX * sumX;

    // If denominator is zero (all x values are the same), return stable
    if (denominator === 0) {
        const avg = sumY / n;
        return {
            predictedValue: Math.max(0, Math.round(avg)),
            slope: 0,
            trend: 'STABLE'
        };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Predict for target period: x = (n - 1) + horizonWeeks
    const targetX = (n - 1) + horizonWeeks;
    const rawPrediction = slope * targetX + intercept;
    const predictedValue = Math.max(0, Math.round(rawPrediction));

    // Trend classification based on slope relative to mean
    // Threshold: slope must be > 5% of mean to classify as directional
    const mean = sumY / n;
    const threshold = Math.max(0.5, mean * 0.05); // At least 0.5 absolute change

    let trend: TrendDirection = 'STABLE';
    if (slope > threshold) trend = 'UP';
    else if (slope < -threshold) trend = 'DOWN';

    return { predictedValue, slope, trend };
};

/**
 * WEIGHTED MOVING AVERAGE (WMA)
 *
 * Formula:
 *   WMA = Σ(weight_i * value_i) / Σ(weight_i)
 *
 * Uses linearly increasing weights: 1, 2, 3, ..., n
 * Most recent values receive highest weight.
 */
const weightedMovingAverage = (points: HistoricalPoint[]): number => {
    const n = points.length;
    let weightedSum = 0;
    let weightTotal = 0;

    for (let i = 0; i < n; i++) {
        const weight = i + 1; // Linear increasing weight
        weightedSum += weight * points[i].value;
        weightTotal += weight;
    }

    return weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;
};

/**
 * BUILD A SINGLE DETERMINISTIC PREDICTION
 * Combines linear trend with WMA and selects the best approach.
 */
const buildPrediction = (
    metric: string,
    category: string,
    description: string,
    historicalPoints: HistoricalPoint[],
    lastUpdated: string,
    horizon: string = '7_DAYS'
): PredictionResult => {
    const horizonWeeks = horizon === '30_DAYS' ? 4 : 1;

    // Check for insufficient data
    if (!hasMinimumData(historicalPoints)) {
        const currentValue = historicalPoints.length > 0
            ? historicalPoints[historicalPoints.length - 1].value
            : 0;

        return {
            metric,
            currentValue,
            predictedValue: null,
            trend: 'INSUFFICIENT_DATA',
            predictionHorizon: horizon,
            predictionStatus: 'INSUFFICIENT_DATA',
            historicalPoints,
            method: 'insufficient_observations',
            category,
            description: 'Not enough historical activity is available to produce a reliable prediction. Continue using Career Hub to build activity history.',
            lastUpdated
        };
    }

    // Current value is the most recent week
    const currentValue = historicalPoints[historicalPoints.length - 1].value;

    // Compute linear trend
    const lt = linearTrend(historicalPoints, horizonWeeks);

    // Compute weighted moving average as sanity check
    const wma = weightedMovingAverage(historicalPoints);

    // Use linear trend if slope is meaningful, otherwise fall back to WMA
    const usedMethod = Math.abs(lt.slope) > 0 ? 'linear_trend' : 'weighted_moving_average';
    const predictedValue = usedMethod === 'linear_trend' ? lt.predictedValue : wma;

    return {
        metric,
        currentValue,
        predictedValue,
        trend: lt.trend,
        predictionHorizon: horizon,
        predictionStatus: 'VALID',
        historicalPoints,
        method: usedMethod,
        category,
        description,
        lastUpdated
    };
};

// =========================================================
// MAIN PREDICTION SERVICE
// =========================================================

export const generatePredictions = async (
    userId: string,
    role: string,
    horizon: string = '7_DAYS'
): Promise<PredictionResult[]> => {
    const normalizedHorizon = horizon === '30_DAYS' ? '30_DAYS' : '7_DAYS';
    const cacheKey = `predictions_v2_${userId}_${role}_${normalizedHorizon}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const uid = new mongoose.Types.ObjectId(userId);
    const lastUpdated = new Date().toISOString();
    const predictions: PredictionResult[] = [];
    const WEEKS_BACK = 4;
    const timeFrameLabel = normalizedHorizon === '30_DAYS' ? 'next 30 days' : 'next 7 days';

    if (role === 'student') {
        const student = await User.findById(uid);
        const classId = student?.classroom;

        // ── 1. Assignment Completion Trend ────────────────────────────
        const subHistory = await collectWeeklyCounts(
            Submission, { student: uid, status: { $in: ['Submitted', 'Reviewed'] } }, WEEKS_BACK
        );
        predictions.push(buildPrediction(
            'Assignment Completion',
            'academic',
            `Projected assignment submission activity for the ${timeFrameLabel} based on ${WEEKS_BACK}-week submission history.`,
            subHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 2. Quiz Performance Trend ────────────────────────────────
        const quizHistory = await collectWeeklyCounts(
            AIQuiz, { user: uid }, WEEKS_BACK
        );
        predictions.push(buildPrediction(
            'Quiz Performance',
            'academic',
            `Forecast of practice quiz engagement based on ${WEEKS_BACK}-week quiz generation history.`,
            quizHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 3. Study Activity Trend ──────────────────────────────────
        const studyHistory = await collectMultiModelWeeklyCounts([
            { model: AINotes, filter: { user: uid } },
            { model: AIFlashcard, filter: { user: uid } },
            { model: AIStudyPlan, filter: { user: uid } }
        ], WEEKS_BACK);
        predictions.push(buildPrediction(
            'Study Activity',
            'study',
            `Projected study tool usage (notes, flashcards, study plans) over the ${timeFrameLabel}.`,
            studyHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 4. AI Learning Activity Trend ────────────────────────────
        const aiHistory = await collectMultiModelWeeklyCounts([
            { model: AIChat, filter: { user: uid } },
            { model: AINotes, filter: { user: uid } },
            { model: AIAssignment, filter: { user: uid } }
        ], WEEKS_BACK);
        predictions.push(buildPrediction(
            'AI Learning Activity',
            'adoption',
            `Forecast of AI tool interactions (tutor chats, notes, assignment helper) for the ${timeFrameLabel}.`,
            aiHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 5. Platform Engagement Trend ─────────────────────────────
        const engagementHistory = await collectWeeklyCounts(
            ActivityTimeline, { user: uid }, WEEKS_BACK
        );
        predictions.push(buildPrediction(
            'Platform Engagement',
            'engagement',
            `Predicted portal interaction volume based on ${WEEKS_BACK}-week activity timeline history.`,
            engagementHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 6. Academic Health Trend (composite) ─────────────────────
        // Merge assignment + quiz + study + AI usage
        const healthHistory: HistoricalPoint[] = [];
        for (let i = 0; i < WEEKS_BACK; i++) {
            const combined = subHistory[i].value + quizHistory[i].value + studyHistory[i].value + aiHistory[i].value;
            healthHistory.push({ period: subHistory[i].period, value: combined });
        }
        predictions.push(buildPrediction(
            'Academic Health',
            'health',
            `Composite academic health trend derived from assignments, quizzes, study tools, and AI interactions.`,
            healthHistory,
            lastUpdated,
            normalizedHorizon
        ));

    } else if (role === 'faculty') {
        const classrooms = await Classroom.find({ faculty: uid });
        const classIds = classrooms.map(c => c._id);
        const assignments = await Assignment.find({ classroom: { $in: classIds } });
        const assignmentIds = assignments.map(a => a._id);

        // ── 1. Student Engagement Trend ──────────────────────────────
        const subHistory = await collectWeeklyCounts(
            Submission, { assignment: { $in: assignmentIds } }, WEEKS_BACK
        );
        predictions.push(buildPrediction(
            'Student Engagement',
            'engagement',
            `Projected student submission volume across your ${classrooms.length} classroom(s) for the ${timeFrameLabel}.`,
            subHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 2. Assignment Completion Trend ───────────────────────────
        const reviewedHistory = await collectWeeklyCounts(
            Submission, { assignment: { $in: assignmentIds }, status: 'Reviewed' }, WEEKS_BACK
        );
        predictions.push(buildPrediction(
            'Assignment Completion',
            'academic',
            `Forecast of graded/reviewed submissions based on ${WEEKS_BACK}-week review activity.`,
            reviewedHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 3. Study Material Activity Trend ─────────────────────────
        const matHistory = await collectWeeklyCounts(
            Material, { faculty: uid }, WEEKS_BACK
        );
        predictions.push(buildPrediction(
            'Study Material Activity',
            'content',
            `Projected study material publication rate for the ${timeFrameLabel}.`,
            matHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 4. AI Adoption Trend ─────────────────────────────────────
        const aiHistory = await collectMultiModelWeeklyCounts([
            { model: AILessonPlan, filter: { user: uid } },
            { model: AIQuestionPaper, filter: { user: uid } },
            { model: AINotice, filter: { user: uid } }
        ], WEEKS_BACK);
        predictions.push(buildPrediction(
            'AI Adoption',
            'adoption',
            `Forecast of AI tool usage (lesson plans, question papers, notices) for the ${timeFrameLabel}.`,
            aiHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 5. Teaching Activity Trend ───────────────────────────────
        const teachHistory = await collectMultiModelWeeklyCounts([
            { model: Assignment, filter: { classroom: { $in: classIds } } },
            { model: Material, filter: { faculty: uid } }
        ], WEEKS_BACK);
        predictions.push(buildPrediction(
            'Teaching Activity',
            'activity',
            `Forecast of combined assignment creation and material publishing activity.`,
            teachHistory,
            lastUpdated,
            normalizedHorizon
        ));

    } else if (role === 'admin') {
        // ── 1. Student Engagement (institution) ──────────────────────
        const subHistory = await collectWeeklyCounts(
            Submission, {}, WEEKS_BACK
        );
        predictions.push(buildPrediction(
            'Student Engagement',
            'engagement',
            `Projected institution-wide student submission volume for the ${timeFrameLabel}.`,
            subHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 2. Faculty Activity ──────────────────────────────────────
        const facActivity = await collectMultiModelWeeklyCounts([
            { model: Assignment, filter: {} },
            { model: Material, filter: {} }
        ], WEEKS_BACK);
        predictions.push(buildPrediction(
            'Faculty Activity',
            'activity',
            `Forecast of institution-wide assignment creation and material publishing.`,
            facActivity,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 3. AI Adoption (institution) ─────────────────────────────
        const aiHistory = await collectMultiModelWeeklyCounts([
            { model: AIChat, filter: {} },
            { model: AINotes, filter: {} },
            { model: AIQuiz, filter: {} },
            { model: AIFlashcard, filter: {} },
            { model: AIStudyPlan, filter: {} }
        ], WEEKS_BACK);
        predictions.push(buildPrediction(
            'AI Adoption',
            'adoption',
            `Projected platform-wide AI tool adoption across all users.`,
            aiHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 4. Platform Activity Trend ───────────────────────────────
        const actHistory = await collectWeeklyCounts(
            ActivityTimeline, {}, WEEKS_BACK
        );
        predictions.push(buildPrediction(
            'Platform Activity',
            'activity',
            `Forecast of overall portal interaction events institution-wide.`,
            actHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 5. Department Activity ───────────────────────────────────
        const assignHistory = await collectWeeklyCounts(
            Assignment, {}, WEEKS_BACK
        );
        predictions.push(buildPrediction(
            'Department Activity',
            'department',
            `Forecast of department-level academic assignment output rate.`,
            assignHistory,
            lastUpdated,
            normalizedHorizon
        ));

        // ── 6. Academic Health (institution composite) ───────────────
        const healthHistory: HistoricalPoint[] = [];
        for (let i = 0; i < WEEKS_BACK; i++) {
            const combined = subHistory[i].value + facActivity[i].value + aiHistory[i].value;
            healthHistory.push({ period: subHistory[i].period, value: combined });
        }
        predictions.push(buildPrediction(
            'Academic Health',
            'health',
            `Composite institutional academic health derived from submissions, faculty activity, and AI adoption.`,
            healthHistory,
            lastUpdated,
            normalizedHorizon
        ));
    }

    setCache(cacheKey, predictions);
    return predictions;
};
