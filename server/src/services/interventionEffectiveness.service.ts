import mongoose from 'mongoose';
import { calculateHealthScores } from './intelligence.service.js';
import InterventionAction from '../models/interventionAction.model.js';
import InterventionOutcome, { IInterventionOutcome } from '../models/interventionOutcome.model.js';
import { logTimelineEvent } from '../utils/timelineLogger.js';

/**
 * Maps source metric names to attributes returned in the health engine scores.
 */
const getPostValue = (scores: any, metric: string): number | null => {
    if (!scores) return null;
    
    switch (metric) {
        case 'assignmentCompletion':
        case 'completionScore':
            return scores.completionScore ?? scores.completionRate ?? null;
        case 'quizScore':
            return scores.quizScore ?? null;
        case 'studyConsistency':
        case 'consistencyScore':
        case 'consistency':
            return scores.consistencyScore ?? scores.consistency ?? null;
        case 'overallScore':
        case 'overallHealthScore':
        case 'learningScore':
            return scores.overallHealthScore ?? scores.learningScore ?? null;
        
        // Faculty metrics
        case 'classroomEngagement':
            return scores.classroomEngagement ?? null;
        case 'assignmentManagement':
        case 'assignmentScore':
            return scores.assignmentScore ?? scores.assignmentManagement ?? null;
        case 'teachingEffectiveness':
            return scores.teachingEffectiveness ?? null;
        case 'aiUsageScore':
        case 'aiAdoption':
            return scores.aiUsageScore ?? scores.aiAdoption ?? null;
        case 'contentScore':
            return scores.contentScore ?? null;
        
        // Admin metrics
        case 'departmentPerformance':
        case 'academicHealth':
            return scores.departmentPerformance ?? scores.academicHealth ?? null;
        case 'studentHealth':
        case 'studentSuccessIndex':
            return scores.studentHealth ?? scores.studentSuccessIndex ?? null;
        case 'facultyHealth':
        case 'facultyPerformance':
            return scores.facultyHealth ?? scores.facultyPerformance ?? null;
        case 'aiAdoptionScore':
            return scores.aiAdoptionScore ?? scores.aiAdoption ?? null;
        case 'platformActivity':
            return scores.platformActivity ?? null;
        case 'institutionHealthScore':
        case 'systemHealth':
            return scores.institutionHealthScore ?? scores.systemHealth ?? null;
        
        default:
            return typeof scores[metric] === 'number' ? scores[metric] : null;
    }
};

const getRiskValue = (risk: string | null): number => {
    if (!risk) return 0;
    const r = risk.toUpperCase();
    if (r === 'LOW') return 1;
    if (r === 'MEDIUM') return 2;
    if (r === 'HIGH') return 3;
    return 0;
};

const classifyRiskChange = (baseline: string | null, post: string | null): 'IMPROVED' | 'DECLINED' | 'NO_CHANGE' | null => {
    if (!baseline || !post) return null;
    const baseVal = getRiskValue(baseline);
    const postVal = getRiskValue(post);
    if (baseVal === 0 || postVal === 0) return null;
    if (postVal < baseVal) return 'IMPROVED';
    if (postVal > baseVal) return 'DECLINED';
    return 'NO_CHANGE';
};

/**
 * Runs deterministic outcome measurement for a completed intervention.
 */
export const evaluateInterventionOutcome = async (
    userId: string,
    role: 'student' | 'faculty' | 'admin',
    actionId: string
): Promise<IInterventionOutcome> => {
    // 1. Fetch action
    const action = await InterventionAction.findById(actionId);
    if (!action) {
        throw { status: 404, message: 'Intervention action not found' };
    }

    // 2. Validate Security (RBAC)
    if (role !== 'admin' && action.user.toString() !== userId) {
        throw { status: 403, message: 'Access denied: Cannot evaluate another user\'s intervention' };
    }

    // 3. Ensure action is in COMPLETED status
    if (action.status !== 'COMPLETED') {
        throw { status: 400, message: 'Cannot evaluate outcome: Intervention action is not completed' };
    }

    const completedAtDate = action.completedAt || action.updatedAt;

    // 4. Validate the default 7-day observation window
    const completedAtTime = completedAtDate.getTime();
    const timeElapsed = Date.now() - completedAtTime;
    const windowMillis = 7 * 24 * 60 * 60 * 1000;

    if (timeElapsed < windowMillis) {
        // Return status AWAITING_MEASUREMENT, save outcome document
        const outcome = await InterventionOutcome.findOneAndUpdate(
            { interventionId: action._id },
            {
                userId: action.user,
                role: action.role,
                metric: action.sourceMetric,
                baselineValue: typeof action.baselineValue === 'number' ? action.baselineValue : null,
                postValue: null,
                delta: null,
                percentageChange: null,
                baselineRiskLevel: action.baselineRiskLevel || null,
                postRiskLevel: null,
                riskChange: null,
                baselineTrend: action.baselineTrend || null,
                postTrend: null,
                status: 'AWAITING_MEASUREMENT',
                measurementWindowDays: 7,
                completedAt: completedAtDate,
                measuredAt: null
            },
            { new: true, upsert: true }
        );
        return outcome;
    }

    // 5. Baseline metric sanity check (graceful fallback for legacy records)
    if (action.baselineValue === undefined || action.baselineValue === null) {
        const outcome = await InterventionOutcome.findOneAndUpdate(
            { interventionId: action._id },
            {
                userId: action.user,
                role: action.role,
                metric: action.sourceMetric,
                baselineValue: null,
                postValue: null,
                delta: null,
                percentageChange: null,
                baselineRiskLevel: action.baselineRiskLevel || action.riskLevel || null,
                postRiskLevel: null,
                riskChange: null,
                baselineTrend: action.baselineTrend || action.trend || null,
                postTrend: null,
                status: 'INSUFFICIENT_DATA',
                measurementWindowDays: 7,
                completedAt: completedAtDate,
                measuredAt: new Date()
            },
            { new: true, upsert: true }
        );
        return outcome;
    }

    // 6. Fetch live metrics bypassing in-memory cache
    const scores = await calculateHealthScores(action.user.toString(), action.role, true);
    const postValue = getPostValue(scores, action.sourceMetric);

    if (postValue === null) {
        const outcome = await InterventionOutcome.findOneAndUpdate(
            { interventionId: action._id },
            {
                userId: action.user,
                role: action.role,
                metric: action.sourceMetric,
                baselineValue: Number(action.baselineValue),
                postValue: null,
                delta: null,
                percentageChange: null,
                baselineRiskLevel: action.baselineRiskLevel || null,
                postRiskLevel: scores.riskLevel || null,
                riskChange: null,
                baselineTrend: action.baselineTrend || null,
                postTrend: scores.trend || null,
                status: 'INSUFFICIENT_DATA',
                measurementWindowDays: 7,
                completedAt: completedAtDate,
                measuredAt: new Date()
            },
            { new: true, upsert: true }
        );
        return outcome;
    }

    // 7. Perform calculations
    const baselineValue = Number(action.baselineValue);
    const delta = postValue - baselineValue;
    const percentageChange = baselineValue !== 0 ? ((postValue - baselineValue) / baselineValue) * 100 : null;

    const postRiskLevel = scores.riskLevel || null;
    const postTrend = scores.trend || null;
    const riskChange = classifyRiskChange(action.baselineRiskLevel || null, postRiskLevel);

    // Classify outcome status: observed improvement/decline threshold of 5 points
    let status: 'OBSERVED_IMPROVEMENT' | 'NO_SIGNIFICANT_CHANGE' | 'OBSERVED_DECLINE' = 'NO_SIGNIFICANT_CHANGE';
    if (delta >= 5) {
        status = 'OBSERVED_IMPROVEMENT';
    } else if (delta <= -5) {
        status = 'OBSERVED_DECLINE';
    }

    const outcome = await InterventionOutcome.findOneAndUpdate(
        { interventionId: action._id },
        {
            userId: action.user,
            role: action.role,
            metric: action.sourceMetric,
            baselineValue,
            postValue,
            delta,
            percentageChange,
            baselineRiskLevel: action.baselineRiskLevel || null,
            postRiskLevel,
            riskChange,
            baselineTrend: action.baselineTrend || null,
            postTrend,
            status,
            measurementWindowDays: 7,
            completedAt: completedAtDate,
            measuredAt: new Date()
        },
        { new: true, upsert: true }
    );

    // Log timeline event
    await logTimelineEvent({
        userId: action.user.toString(),
        role: action.role,
        activityType: 'INTERVENTION_EVALUATED',
        module: 'intelligence',
        title: `Intervention Evaluated: ${action.title}`,
        description: `Observed outcome: ${status.replace(/_/g, ' ')}. Baseline: ${baselineValue}, Post: ${postValue} (Delta: ${delta >= 0 ? '+' : ''}${delta}).`,
        icon: status === 'OBSERVED_IMPROVEMENT' ? 'trending-up' : status === 'OBSERVED_DECLINE' ? 'trending-down' : 'minus',
        color: status === 'OBSERVED_IMPROVEMENT' ? 'emerald' : status === 'OBSERVED_DECLINE' ? 'rose' : 'slate',
        metadata: {
            interventionId: action._id,
            outcomeId: outcome._id,
            status
        }
    });

    return outcome;
};

/**
 * Retrieves all intervention outcomes for a user. Auto-evaluates completed actions.
 */
export const getInterventionOutcomes = async (
    userId: string,
    role: 'student' | 'faculty' | 'admin'
): Promise<IInterventionOutcome[]> => {
    // Auto-evaluate completed interventions that don't have outcome records, or are awaiting measurement but window has now elapsed
    const completedQuery: Record<string, any> = { status: 'COMPLETED' };
    if (role !== 'admin') {
        completedQuery.user = userId;
    }
    const completedActions = await InterventionAction.find(completedQuery);

    for (const action of completedActions) {
        const existing = await InterventionOutcome.findOne({ interventionId: action._id });
        if (!existing) {
            try {
                await evaluateInterventionOutcome(action.user.toString(), role, action._id.toString());
            } catch (err) {
                console.error(`Auto-evaluation failed for action ${action._id}:`, err);
            }
        } else if (existing.status === 'AWAITING_MEASUREMENT') {
            const completedAtDate = action.completedAt || action.updatedAt;
            const completedAtTime = completedAtDate.getTime();
            const timeElapsed = Date.now() - completedAtTime;
            const windowMillis = 7 * 24 * 60 * 60 * 1000;
            if (timeElapsed >= windowMillis) {
                try {
                    await evaluateInterventionOutcome(action.user.toString(), role, action._id.toString());
                } catch (err) {
                    console.error(`Re-evaluation failed for action ${action._id}:`, err);
                }
            }
        }
    }

    const query: Record<string, any> = {};
    if (role !== 'admin') {
        query.userId = userId;
    }
    return await InterventionOutcome.find(query).sort({ createdAt: -1 });
};
