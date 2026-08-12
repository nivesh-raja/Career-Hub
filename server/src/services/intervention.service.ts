/**
 * =========================================================
 * PHASE 5B.4A — DETERMINISTIC ADAPTIVE INTERVENTION ENGINE
 * =========================================================
 *
 * Converts existing MongoDB-backed intelligence signals into
 * actionable, role-specific intervention plans.
 *
 * Design principles:
 *  - DETERMINISTIC: No Math.random(), no LLM decisions
 *  - SOURCE-TRACED: Every intervention cites its source metric
 *  - OPENROUTER-INDEPENDENT: Works with no API keys
 *  - NO FAKE DATA: All values come from authoritative intelligence services
 *  - NO LIFECYCLE FIELDS: Phase 5B.4B concern only
 *
 * Intelligence sources (all existing, cached):
 *  - calculateHealthScores()  → health_engine
 *  - getAcademicRisk()        → risk_engine
 *  - getPredictions()         → prediction_engine
 *  - getAlerts()              → smart_alert
 */

import { calculateHealthScores, getAcademicRisk, getAlerts } from './intelligence.service.js';
import { generatePredictions } from './prediction.service.js';

// =========================================================
// TYPES & INTERFACES
// =========================================================

export type InterventionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type InterventionRole = 'student' | 'faculty' | 'admin';

export interface Intervention {
    /** Deterministic identifier — stable across repeated calls with same DB state */
    id: string;
    role: InterventionRole;
    title: string;
    description: string;
    category: string;
    priority: InterventionPriority;
    /** Which service produced the signal (e.g. "health_engine", "risk_engine", "prediction_engine", "smart_alert") */
    source: string;
    /** Which specific metric triggered this intervention (e.g. "assignmentCompletion", "riskLevel") */
    sourceMetric: string;
    /** The actual metric value from MongoDB at the time of generation */
    currentValue: number | string;
    /**
     * Target value — only set when a defensible system rule defines a target.
     * null when no defensible target exists. NEVER fabricated.
     */
    targetValue: number | null;
    /** Human-readable explanation citing the real metric value */
    reason: string;
    /** Concrete recommended action */
    recommendation: string;
    trend: string;
    riskLevel: string;
    createdAt: string;
    lastUpdated: string;
}

// In-memory cache configuration (15 seconds — matches intelligence.service.ts)
interface CacheEntry {
    data: InterventionsResult;
    timestamp: number;
}
const interventionCache = new Map<string, CacheEntry>();
const CACHE_TTL = 15000;

const getCached = (key: string): InterventionsResult | null => {
    const entry = interventionCache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
    return null;
};

const setCache = (key: string, data: InterventionsResult): void => {
    interventionCache.set(key, { data, timestamp: Date.now() });
};

export interface InterventionsResult {
    success: boolean;
    role: InterventionRole;
    generatedAt: string;
    interventionCount: number;
    interventions: Intervention[];
}

// =========================================================
// PRIORITY CLASSIFIER
// =========================================================

/**
 * Deterministic priority classification.
 * Uses risk level and trend direction from authoritative sources.
 * No LLM, no randomness.
 */
const classifyPriority = (
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    trend: string
): InterventionPriority => {
    const isDown = trend === 'DOWN' || trend === 'DOWNWARD';

    if (riskLevel === 'HIGH' && isDown) return 'CRITICAL';
    if (riskLevel === 'HIGH') return 'HIGH';
    if (riskLevel === 'MEDIUM' && isDown) return 'HIGH';
    if (riskLevel === 'MEDIUM') return 'MEDIUM';
    if (riskLevel === 'LOW' && isDown) return 'MEDIUM';
    return 'LOW';
};

// =========================================================
// PRIORITY SORT ORDER
// =========================================================

const PRIORITY_ORDER: Record<InterventionPriority, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
};

const sortInterventions = (list: Intervention[]): Intervention[] =>
    [...list].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

// =========================================================
// DEDUPLICATION
// =========================================================

/**
 * Removes duplicate interventions when multiple signals represent
 * the same underlying problem. Keeps the highest-priority one.
 */
const deduplicate = (list: Intervention[]): Intervention[] => {
    const seen = new Map<string, Intervention>();
    for (const item of list) {
        const key = `${item.role}_${item.category}_${item.sourceMetric}`;
        const existing = seen.get(key);
        if (!existing || PRIORITY_ORDER[item.priority] < PRIORITY_ORDER[existing.priority]) {
            seen.set(key, item);
        }
    }
    return Array.from(seen.values());
};

// =========================================================
// ID GENERATION
// =========================================================

/** Deterministic ID — stable for same role + category + sourceMetric */
const makeId = (role: string, category: string, sourceMetric: string): string =>
    `${role}_${category}_${sourceMetric}`.toLowerCase().replace(/\s+/g, '_');

// =========================================================
// STUDENT INTERVENTION RULES
// =========================================================

const buildStudentInterventions = (
    scores: any,
    risk: any,
    trend: string,
    alerts: any[],
    now: string
): Intervention[] => {
    const list: Intervention[] = [];
    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = risk?.riskLevel ?? scores?.riskLevel ?? 'LOW';
    const breakdown = risk?.breakdown ?? {};

    // ── Rule 1: LOW ASSIGNMENT COMPLETION ──────────────────────
    // Source: health_engine.completionScore + risk_engine.breakdown.assignmentCompletion
    const completionVal = breakdown.assignmentCompletion ?? scores.completionScore ?? null;
    if (completionVal !== null && completionVal < 60) {
        list.push({
            id: makeId('student', 'assignment_completion', 'assignmentCompletion'),
            role: 'student',
            title: 'Complete Pending Assignments',
            description: `Your assignment completion rate is ${completionVal}%, which is below the required 60% threshold. Pending assignments directly reduce your academic health score.`,
            category: 'Assignment Completion',
            priority: classifyPriority(completionVal < 40 ? 'HIGH' : 'MEDIUM', trend),
            source: 'health_engine',
            sourceMetric: 'assignmentCompletion',
            currentValue: completionVal,
            targetValue: 70,
            reason: `Assignment completion is ${completionVal}%, below the 60% minimum threshold.`,
            recommendation: 'Submit all pending assignments. Use the AI Assignment Helper to prepare content quickly and improve your submission rate.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 2: LOW QUIZ PERFORMANCE ───────────────────────────
    // Source: health_engine.quizScore
    const quizScore = scores.quizScore ?? null;
    if (quizScore !== null && quizScore < 40) {
        list.push({
            id: makeId('student', 'quiz_performance', 'quizScore'),
            role: 'student',
            title: 'Improve Quiz Preparation',
            description: `Your quiz performance index is ${quizScore}%. Taking more practice quizzes strengthens concept mastery and raises your AI usage score.`,
            category: 'Quiz Performance',
            priority: classifyPriority(quizScore < 20 ? 'HIGH' : 'MEDIUM', trend),
            source: 'health_engine',
            sourceMetric: 'quizScore',
            currentValue: quizScore,
            targetValue: 60,
            reason: `Quiz performance index is ${quizScore}%, below the 40% threshold.`,
            recommendation: 'Generate custom AI practice quizzes for your enrolled subjects. Aim for at least 3 quiz sessions per week.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 3: LOW STUDY ACTIVITY / CONSISTENCY ───────────────
    // Source: risk_engine.breakdown.studyConsistency
    const consistency = breakdown.studyConsistency ?? scores.consistencyScore ?? null;
    if (consistency !== null && consistency < 50) {
        list.push({
            id: makeId('student', 'study_consistency', 'studyConsistency'),
            role: 'student',
            title: 'Increase Study Consistency',
            description: `Your study consistency score is ${consistency}% over the last 30 days. Low consistency reduces your overall academic health.`,
            category: 'Study Consistency',
            priority: classifyPriority(consistency < 25 ? 'HIGH' : 'MEDIUM', trend),
            source: 'risk_engine',
            sourceMetric: 'studyConsistency',
            currentValue: consistency,
            targetValue: 70,
            reason: `Study consistency is ${consistency}% over the last 30 days, below the 50% threshold.`,
            recommendation: 'Generate AI notes and flashcards daily. Engage with the AI Academic Assistant regularly to build consistent study habits.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 4: DECLINING ACADEMIC TREND ───────────────────────
    // Source: prediction_engine
    const isDown = trend === 'DOWN' || trend === 'DOWNWARD';
    if (isDown) {
        list.push({
            id: makeId('student', 'academic_trend', 'trend'),
            role: 'student',
            title: 'Reverse Academic Decline',
            description: `Your academic activity trend is DOWNWARD over the past 4 weeks. Without intervention, this decline is projected to continue.`,
            category: 'Academic Trend',
            priority: classifyPriority(riskLevel, trend),
            source: 'prediction_engine',
            sourceMetric: 'academicHealth',
            currentValue: trend,
            targetValue: null,
            reason: `Prediction engine reports a DOWNWARD trend in academic activity over the past 4 weeks.`,
            recommendation: 'Increase submission frequency, complete any missed assignments, and engage daily with AI study tools to reverse the downward trend.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 5: HIGH RISK ───────────────────────────────────────
    // Source: risk_engine + health_engine
    if (riskLevel === 'HIGH') {
        const score = risk?.score ?? scores.overallHealthScore ?? null;
        list.push({
            id: makeId('student', 'academic_risk', 'riskLevel'),
            role: 'student',
            title: 'High Priority Academic Recovery',
            description: `Your academic risk level is HIGH${score !== null ? ` with an overall health score of ${score}%` : ''}. Immediate action is required to prevent academic setbacks.`,
            category: 'Academic Risk',
            priority: isDown ? 'CRITICAL' : 'HIGH',
            source: 'risk_engine',
            sourceMetric: 'riskLevel',
            currentValue: riskLevel,
            targetValue: null,
            reason: `Risk engine classifies your academic standing as HIGH risk${score !== null ? ` (score: ${score}%)` : ''}.`,
            recommendation: 'Review the Risk Assessment tab for the full breakdown. Address assignment completion and study consistency immediately.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // Consolidate smart alerts (avoid pure duplicates)
    for (const alert of alerts) {
        const alertPriority: string = alert.priority ?? '';
        if (
            (alertPriority === 'critical' || alertPriority === 'high') &&
            alert.title &&
            !list.some(i => i.sourceMetric === 'smart_alert_' + alert._id)
        ) {
            // Only add alert-sourced intervention if it doesn't duplicate an existing intervention category
            const title: string = (alert.title as string).toLowerCase();
            const alreadyHasCompletion = list.some(i => i.category === 'Assignment Completion');
            if (title.includes('deadline') && !alreadyHasCompletion) {
                list.push({
                    id: makeId('student', 'deadline_alert', `smart_alert_${alert._id ?? 'deadline'}`),
                    role: 'student',
                    title: 'Critical Deadline Approaching',
                    description: alert.message ?? 'An assignment deadline is imminent.',
                    category: 'Deadline Alert',
                    priority: alertPriority === 'critical' ? 'CRITICAL' : 'HIGH',
                    source: 'smart_alert',
                    sourceMetric: 'assignment_completion_rate',
                    currentValue: 'DEADLINE IMMINENT',
                    targetValue: null,
                    reason: alert.message ?? 'A critical assignment deadline is approaching within 48 hours.',
                    recommendation: 'Submit your response immediately to avoid a missed assignment penalty.',
                    trend,
                    riskLevel,
                    createdAt: now,
                    lastUpdated: now,
                });
            }
        }
    }

    return list;
};

// =========================================================
// FACULTY INTERVENTION RULES
// =========================================================

const buildFacultyInterventions = (
    scores: any,
    risk: any,
    trend: string,
    alerts: any[],
    now: string
): Intervention[] => {
    const list: Intervention[] = [];
    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = risk?.riskLevel ?? scores?.riskLevel ?? 'LOW';
    const isDown = trend === 'DOWN' || trend === 'DOWNWARD';

    // ── Rule 1: LOW CLASSROOM ENGAGEMENT ───────────────────────
    // Source: health_engine.classroomEngagement
    const engagement = scores.classroomEngagement ?? null;
    if (engagement !== null && engagement < 50) {
        list.push({
            id: makeId('faculty', 'classroom_engagement', 'classroomEngagement'),
            role: 'faculty',
            title: 'Improve Classroom Engagement',
            description: `Your classroom engagement rate is ${engagement}%. Students in your classrooms are submitting below the expected 50% baseline.`,
            category: 'Classroom Engagement',
            priority: classifyPriority(engagement < 30 ? 'HIGH' : 'MEDIUM', trend),
            source: 'health_engine',
            sourceMetric: 'classroomEngagement',
            currentValue: engagement,
            targetValue: 70,
            reason: `Classroom engagement is ${engagement}%, below the 50% threshold.`,
            recommendation: 'Post announcements encouraging student participation. Consider adding revision quizzes or study materials to drive engagement.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 2: LOW TEACHING EFFECTIVENESS (grading rate) ──────
    // Source: health_engine.teachingEffectiveness
    const teaching = scores.teachingEffectiveness ?? null;
    if (teaching !== null && teaching < 60) {
        list.push({
            id: makeId('faculty', 'teaching_effectiveness', 'teachingEffectiveness'),
            role: 'faculty',
            title: 'Improve Assignment Completion Review',
            description: `Your teaching effectiveness score is ${teaching}%, indicating that a significant portion of student submissions have not been reviewed or graded.`,
            category: 'Teaching Effectiveness',
            priority: classifyPriority(teaching < 40 ? 'HIGH' : 'MEDIUM', trend),
            source: 'health_engine',
            sourceMetric: 'teachingEffectiveness',
            currentValue: teaching,
            targetValue: 80,
            reason: `Teaching effectiveness (grading rate) is ${teaching}%, below the 60% threshold.`,
            recommendation: 'Review and grade all pending student submissions. Timely feedback is critical for student academic health scores.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 3: LOW AI ADOPTION ─────────────────────────────────
    // Source: health_engine.aiUsageScore / aiAdoption
    const aiScore = scores.aiUsageScore ?? scores.aiAdoption ?? null;
    if (aiScore !== null && aiScore < 30) {
        list.push({
            id: makeId('faculty', 'ai_adoption', 'aiUsageScore'),
            role: 'faculty',
            title: 'Increase AI Learning Adoption',
            description: `Your AI curriculum tool adoption score is ${aiScore}%. Using AI tools to generate lesson plans, question papers, and notices enhances teaching efficiency.`,
            category: 'AI Adoption',
            priority: 'MEDIUM',
            source: 'health_engine',
            sourceMetric: 'aiUsageScore',
            currentValue: aiScore,
            targetValue: 50,
            reason: `AI usage score is ${aiScore}%, below the 30% adoption threshold.`,
            recommendation: 'Use the AI Workspace to generate lesson plans, create AI-powered question papers, and draft academic notices for your classrooms.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 4: LOW CONTENT ACTIVITY ────────────────────────────
    // Source: health_engine.contentScore
    const contentScore = scores.contentScore ?? null;
    if (contentScore !== null && contentScore < 30) {
        list.push({
            id: makeId('faculty', 'content_activity', 'contentScore'),
            role: 'faculty',
            title: 'Increase Study Material Activity',
            description: `Your content activity score is ${contentScore}%. Publishing study materials and announcements drives student academic performance.`,
            category: 'Content Activity',
            priority: 'MEDIUM',
            source: 'health_engine',
            sourceMetric: 'contentScore',
            currentValue: contentScore,
            targetValue: 50,
            reason: `Content score is ${contentScore}%, below the 30% threshold.`,
            recommendation: 'Upload study materials, chapter notes, and academic announcements to improve student learning resources.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 5: DECLINING TREND ─────────────────────────────────
    // Source: health_engine trend (computed from Assignment activity)
    if (isDown) {
        list.push({
            id: makeId('faculty', 'activity_trend', 'trend'),
            role: 'faculty',
            title: 'Review Faculty Activity',
            description: `Your faculty activity trend is DOWNWARD over the past 4 weeks. Assignment creation and classroom management activity has declined.`,
            category: 'Activity Trend',
            priority: classifyPriority(riskLevel, trend),
            source: 'health_engine',
            sourceMetric: 'trend',
            currentValue: trend,
            targetValue: null,
            reason: `Faculty activity shows a DOWNWARD trend over the past 4 weeks.`,
            recommendation: 'Publish new assignments, upload materials, and engage with your classrooms to restore upward activity momentum.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 6: HIGH RISK ───────────────────────────────────────
    // Source: risk_engine
    if (riskLevel === 'HIGH') {
        const score = risk?.score ?? scores.overallFacultyScore ?? null;
        list.push({
            id: makeId('faculty', 'performance_risk', 'riskLevel'),
            role: 'faculty',
            title: 'Faculty Performance Recovery',
            description: `Your faculty performance risk level is HIGH${score !== null ? ` (score: ${score}%)` : ''}. Classroom engagement and assignment management require immediate attention.`,
            category: 'Performance Risk',
            priority: isDown ? 'CRITICAL' : 'HIGH',
            source: 'risk_engine',
            sourceMetric: 'riskLevel',
            currentValue: riskLevel,
            targetValue: null,
            reason: `Risk engine classifies your faculty standing as HIGH risk${score !== null ? ` (score: ${score}%)` : ''}.`,
            recommendation: 'Address classroom engagement, grade all pending submissions, and review the Risk Assessment tab for a detailed breakdown.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // Smart alert consolidation (avoid duplicates)
    for (const alert of alerts) {
        const alertPriority: string = alert.priority ?? '';
        if (alertPriority === 'critical' && alert.title) {
            const titleLower = (alert.title as string).toLowerCase();
            const alreadyCovered = list.some(i =>
                (i.category === 'Classroom Engagement' && titleLower.includes('activity')) ||
                (i.category === 'Teaching Effectiveness' && titleLower.includes('submission'))
            );
            if (!alreadyCovered) {
                list.push({
                    id: makeId('faculty', 'alert', `smart_alert_${alert._id ?? 'gen'}`),
                    role: 'faculty',
                    title: alert.title,
                    description: alert.message ?? 'A critical classroom alert requires your attention.',
                    category: 'Classroom Alert',
                    priority: 'CRITICAL',
                    source: 'smart_alert',
                    sourceMetric: 'classroom_activity',
                    currentValue: 'CRITICAL ALERT',
                    targetValue: null,
                    reason: alert.message ?? 'A critical alert has been generated for your classroom.',
                    recommendation: 'Review the Smart Alerts tab and take immediate action.',
                    trend,
                    riskLevel,
                    createdAt: now,
                    lastUpdated: now,
                });
            }
        }
    }

    return list;
};

// =========================================================
// ADMIN INTERVENTION RULES
// =========================================================

const buildAdminInterventions = (
    scores: any,
    risk: any,
    trend: string,
    alerts: any[],
    now: string
): Intervention[] => {
    const list: Intervention[] = [];
    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = risk?.riskLevel ?? scores?.riskLevel ?? 'LOW';
    const isDown = trend === 'DOWN' || trend === 'DOWNWARD';

    // ── Rule 1: LOW DEPARTMENT PERFORMANCE ─────────────────────
    // Source: health_engine.departmentPerformance / academicHealth
    const deptPerf = scores.departmentPerformance ?? scores.academicHealth ?? null;
    if (deptPerf !== null && deptPerf < 50) {
        list.push({
            id: makeId('admin', 'department_performance', 'departmentPerformance'),
            role: 'admin',
            title: 'Department Performance Review',
            description: `Institution-wide department performance is at ${deptPerf}%. Below-average departments are dragging down the overall academic health score.`,
            category: 'Department Performance',
            priority: classifyPriority(deptPerf < 30 ? 'HIGH' : 'MEDIUM', trend),
            source: 'health_engine',
            sourceMetric: 'departmentPerformance',
            currentValue: deptPerf,
            targetValue: 70,
            reason: `Department performance is ${deptPerf}%, below the 50% institutional threshold.`,
            recommendation: 'Review department-level assignment completion rates, assign faculty to departments lacking resources, and track monthly academic checkpoints.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 2: LOW STUDENT HEALTH ──────────────────────────────
    // Source: health_engine.studentHealth / studentSuccessIndex
    const studentHealth = scores.studentHealth ?? scores.studentSuccessIndex ?? null;
    if (studentHealth !== null && studentHealth < 60) {
        list.push({
            id: makeId('admin', 'student_success', 'studentHealth'),
            role: 'admin',
            title: 'Student Success Intervention',
            description: `The student success index is at ${studentHealth}%. A significant proportion of enrolled students show declining academic health.`,
            category: 'Student Success',
            priority: classifyPriority(studentHealth < 40 ? 'HIGH' : 'MEDIUM', trend),
            source: 'health_engine',
            sourceMetric: 'studentHealth',
            currentValue: studentHealth,
            targetValue: 75,
            reason: `Student health/success index is ${studentHealth}%, below the 60% threshold.`,
            recommendation: 'Encourage faculty to review and grade submissions promptly. Promote AI tool adoption among students to strengthen learning consistency.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 3: LOW FACULTY HEALTH ──────────────────────────────
    // Source: health_engine.facultyHealth / facultyPerformance
    const facultyHealth = scores.facultyHealth ?? scores.facultyPerformance ?? null;
    if (facultyHealth !== null && facultyHealth < 60) {
        list.push({
            id: makeId('admin', 'faculty_activity', 'facultyHealth'),
            role: 'admin',
            title: 'Faculty Activity Review',
            description: `Faculty health index is at ${facultyHealth}%. Faculty engagement with assignments, grading, and content publishing is below institutional standards.`,
            category: 'Faculty Health',
            priority: classifyPriority(facultyHealth < 40 ? 'HIGH' : 'MEDIUM', trend),
            source: 'health_engine',
            sourceMetric: 'facultyHealth',
            currentValue: facultyHealth,
            targetValue: 75,
            reason: `Faculty health index is ${facultyHealth}%, below the 60% threshold.`,
            recommendation: 'Conduct a faculty review. Identify faculty members with low grading rates and classroom engagement and provide targeted support.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 4: LOW AI ADOPTION ─────────────────────────────────
    // Source: health_engine.aiAdoption / aiAdoptionScore
    const aiAdopt = scores.aiAdoption ?? scores.aiAdoptionScore ?? null;
    if (aiAdopt !== null && aiAdopt < 30) {
        list.push({
            id: makeId('admin', 'ai_adoption', 'aiAdoption'),
            role: 'admin',
            title: 'Increase AI Adoption',
            description: `Platform-wide AI adoption is at ${aiAdopt}%. Low AI usage limits the learning potential of both students and faculty.`,
            category: 'AI Adoption',
            priority: 'MEDIUM',
            source: 'health_engine',
            sourceMetric: 'aiAdoption',
            currentValue: aiAdopt,
            targetValue: 50,
            reason: `AI adoption score is ${aiAdopt}%, below the 30% institutional threshold.`,
            recommendation: 'Conduct campus-wide sessions on AI tool usage. Encourage faculty to assign AI-assisted tasks and students to use the AI Academic Assistant.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 5: LOW PLATFORM ACTIVITY ───────────────────────────
    // Source: health_engine.platformActivity
    const platform = scores.platformActivity ?? null;
    if (platform !== null && platform < 30) {
        list.push({
            id: makeId('admin', 'platform_engagement', 'platformActivity'),
            role: 'admin',
            title: 'Increase Platform Engagement',
            description: `Platform activity score is at ${platform}%. Low submission and engagement activity has been recorded over the past 30 days.`,
            category: 'Platform Activity',
            priority: 'MEDIUM',
            source: 'health_engine',
            sourceMetric: 'platformActivity',
            currentValue: platform,
            targetValue: 50,
            reason: `Platform activity is ${platform}%, below the 30% threshold.`,
            recommendation: 'Encourage departments to run assignments, publish materials, and create announcements to drive platform activity.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    // ── Rule 6: HIGH INSTITUTION RISK ───────────────────────────
    // Source: risk_engine
    if (riskLevel === 'HIGH') {
        const score = risk?.score ?? scores.institutionHealthScore ?? scores.systemHealth ?? null;
        list.push({
            id: makeId('admin', 'institution_risk', 'riskLevel'),
            role: 'admin',
            title: 'Institutional Academic Review',
            description: `Institution risk level is HIGH${score !== null ? ` (health score: ${score}%)` : ''}. Multiple academic health indicators require urgent attention.`,
            category: 'Institutional Risk',
            priority: isDown ? 'CRITICAL' : 'HIGH',
            source: 'risk_engine',
            sourceMetric: 'riskLevel',
            currentValue: riskLevel,
            targetValue: null,
            reason: `Risk engine classifies the institution as HIGH risk${score !== null ? ` (score: ${score}%)` : ''}.`,
            recommendation: 'Convene a review of all departmental metrics. Focus on assignment completion rates and faculty grading velocity as immediate priorities.',
            trend,
            riskLevel,
            createdAt: now,
            lastUpdated: now,
        });
    }

    return list;
};

// =========================================================
// PRIMARY EXPORT — generateInterventions
// =========================================================

/**
 * Generates deterministic intervention plans for a given user+role.
 *
 * Pipeline:
 * 1. Fetch authoritative intelligence data (all existing cached services)
 * 2. Extract metrics from authoritative snapshots
 * 3. Apply deterministic threshold rules per role
 * 4. Deduplicate overlapping signals
 * 5. Sort CRITICAL → HIGH → MEDIUM → LOW
 * 6. Cap at 5 interventions
 *
 * No LLM. No Math.random(). No fabricated data.
 */
export const generateInterventions = async (
    userId: string,
    role: InterventionRole
): Promise<InterventionsResult> => {
    const cacheKey = `interventions_v1_${userId}_${role}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const now = new Date().toISOString();

    // ── Fetch all authoritative intelligence data in parallel ───
    const [scores, risk, predictions, alerts] = await Promise.all([
        calculateHealthScores(userId, role),
        getAcademicRisk(userId, role),
        generatePredictions(userId, role, '7_DAYS'),
        getAlerts(userId, role),
    ]);

    // ── Extract primary trend from prediction engine ─────────────
    // Use the first valid prediction trend, fallback to health score trend
    let dominantTrend: string = scores?.trend ?? 'STABLE';
    if (Array.isArray(predictions) && predictions.length > 0) {
        const validPred = predictions.find(
            (p: any) => p.predictionStatus === 'VALID' && p.trend && p.trend !== 'INSUFFICIENT_DATA'
        );
        if (validPred) {
            dominantTrend = validPred.trend;
        }
    }

    // ── Normalize alerts to plain objects ────────────────────────
    const alertList: any[] = Array.isArray(alerts)
        ? alerts.map((a: any) => (typeof a.toObject === 'function' ? a.toObject() : a))
        : [];

    // ── Build role-specific interventions ────────────────────────
    let raw: Intervention[] = [];

    if (role === 'student') {
        raw = buildStudentInterventions(scores, risk, dominantTrend, alertList, now);
    } else if (role === 'faculty') {
        raw = buildFacultyInterventions(scores, risk, dominantTrend, alertList, now);
    } else {
        raw = buildAdminInterventions(scores, risk, dominantTrend, alertList, now);
    }

    // ── Deduplicate → sort → cap at 5 ───────────────────────────
    const deduped = deduplicate(raw);
    const sorted = sortInterventions(deduped);
    const final = sorted.slice(0, 5);

    const result: InterventionsResult = {
        success: true,
        role,
        generatedAt: now,
        interventionCount: final.length,
        interventions: final,
    };

    setCache(cacheKey, result);
    return result;
};
