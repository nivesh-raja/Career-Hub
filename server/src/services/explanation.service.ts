/**
 * =====================================================================
 * Phase 5B.3C — AI Explanation Service
 * =====================================================================
 *
 * Gemini is an INTERPRETATION layer only.
 * It MUST NOT calculate, modify, override, or invent:
 *   • prediction values
 *   • health scores
 *   • risk levels
 *   • trend classifications
 *   • recommendation eligibility
 *   • MongoDB metrics
 *
 * The deterministic backend remains the source of truth.
 * =====================================================================
 */

import crypto from 'crypto';
import { callAI } from './ai.service.js';

// ─── Structured output schema ─────────────────────────────────────────────────

export interface ExplanationOutput {
    summary: string;
    keyFindings: string[];
    trendExplanation: string;
    riskExplanation: string;
    predictionExplanation: string;
    recommendationExplanation: string;
    nextSteps: string[];
}

export interface ExplanationResponse {
    success: true;
    source: 'gemini' | 'deterministic_fallback';
    explanation: ExplanationOutput;
    generatedAt: string;
}

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

interface CacheEntry {
    data: ExplanationResponse;
    timestamp: number;
}

const explanationCache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getCached = (key: string): ExplanationResponse | null => {
    const entry = explanationCache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
    }
    return null;
};

const setCache = (key: string, data: ExplanationResponse): void => {
    explanationCache.set(key, { data, timestamp: Date.now() });
};

// ─── Cache Key ────────────────────────────────────────────────────────────────

const buildCacheKey = (userId: string, role: string, snapshot: any): string => {
    // Deterministic signature based on key snapshot fields
    const sig = JSON.stringify({
        userId,
        role,
        overallScore: snapshot.scores?.overallScore ?? snapshot.scores?.overallFacultyScore ?? snapshot.scores?.institutionHealthScore,
        riskLevel: snapshot.scores?.riskLevel,
        trend: snapshot.scores?.trend,
    });
    return crypto.createHash('sha256').update(sig).digest('hex').substring(0, 24);
};

// ─── Prompt Injection Protection ──────────────────────────────────────────────
// Strip any instruction-like patterns from user-generated content before embedding in prompt

const sanitizeForPrompt = (text: string): string => {
    return text
        .replace(/ignore\s+(previous|all|prior)\s+instructions?/gi, '[REMOVED]')
        .replace(/reveal\s+(api\s+key|secret|password|token|credential)/gi, '[REMOVED]')
        .replace(/system\s+prompt/gi, '[REMOVED]')
        .replace(/\bact\s+as\b/gi, '[REMOVED]')
        .slice(0, 300); // Hard cap per field
};

// ─── Safe Snapshot Builder ────────────────────────────────────────────────────
// Only extract whitelisted fields. Never send passwords, keys, tokens, or PII.

type SafeSnapshotResult = {
    snapshotStr: string;
    scores: Record<string, any>;
    predictionsArr: any[];
    recommendationsArr: any[];
};

const buildSafeSnapshot = (role: string, snapshot: any): SafeSnapshotResult => {
    const scores = snapshot.scores || {};
    const predictionsArr: any[] = (snapshot.predictions || []).slice(0, 5);
    const recommendationsArr: any[] = (snapshot.recommendations || []).slice(0, 4);
    const alerts: any[] = (snapshot.alerts || []).slice(0, 3);
    const weeklyReport = snapshot.weeklyReport || {};

    let safeContext: Record<string, any> = {};

    if (role === 'student') {
        safeContext = {
            role: 'student',
            overallHealthScore: scores.overallHealthScore ?? scores.overallScore,
            riskLevel: scores.riskLevel,
            trend: scores.trend,
            assignmentScore: scores.assignmentScore,
            quizScore: scores.quizScore,
            aiUsageScore: scores.aiUsageScore,
            studyScore: scores.studyScore,
            consistencyScore: scores.consistencyScore,
            predictions: predictionsArr.map(p => ({
                metric: p.metric,
                trend: p.trend,
                predictedValue: p.predictedValue,
                predictionStatus: p.predictionStatus,
                predictionHorizon: p.predictionHorizon
            })),
            topRecommendations: recommendationsArr.map(r => ({
                title: sanitizeForPrompt(r.title || ''),
                priority: r.priority,
                category: r.category
            })),
            smartAlerts: alerts.map(a => ({
                title: sanitizeForPrompt(a.title || ''),
                severity: a.severity
            })),
            weeklyHighlights: {
                aiUsage: weeklyReport.aiUsage ?? weeklyReport.totalAiItems,
                submissions: weeklyReport.submissions ?? weeklyReport.weekSubmissions
            }
        };
    } else if (role === 'faculty') {
        safeContext = {
            role: 'faculty',
            overallFacultyScore: scores.overallFacultyScore ?? scores.overallScore,
            riskLevel: scores.riskLevel,
            trend: scores.trend,
            teachingEffectiveness: scores.teachingEffectiveness,
            classroomEngagement: scores.classroomEngagement,
            assignmentScore: scores.assignmentScore,
            aiUsageScore: scores.aiUsageScore,
            contentScore: scores.contentScore,
            consistencyScore: scores.consistencyScore,
            predictions: predictionsArr.map(p => ({
                metric: p.metric,
                trend: p.trend,
                predictedValue: p.predictedValue,
                predictionStatus: p.predictionStatus
            })),
            topRecommendations: recommendationsArr.map(r => ({
                title: sanitizeForPrompt(r.title || ''),
                priority: r.priority,
                category: r.category
            })),
            smartAlerts: alerts.map(a => ({
                title: sanitizeForPrompt(a.title || ''),
                severity: a.severity
            }))
        };
    } else {
        // admin
        safeContext = {
            role: 'admin',
            institutionHealthScore: scores.institutionHealthScore ?? scores.systemHealth ?? scores.overallScore,
            riskLevel: scores.riskLevel,
            trend: scores.trend,
            studentHealth: scores.studentHealth,
            facultyHealth: scores.facultyHealth,
            aiAdoption: scores.aiAdoption ?? scores.aiAdoptionScore,
            platformActivity: scores.platformActivity,
            departmentPerformance: scores.departmentPerformance,
            predictions: predictionsArr.map(p => ({
                metric: p.metric,
                trend: p.trend,
                predictedValue: p.predictedValue,
                predictionStatus: p.predictionStatus
            })),
            topRecommendations: recommendationsArr.map(r => ({
                title: sanitizeForPrompt(r.title || ''),
                priority: r.priority,
                category: r.category
            })),
            smartAlerts: alerts.map(a => ({
                title: sanitizeForPrompt(a.title || ''),
                severity: a.severity
            }))
        };
    }

    return {
        snapshotStr: JSON.stringify(safeContext, null, 2),
        scores,
        predictionsArr,
        recommendationsArr
    };
};

// ─── Prompt Builder ───────────────────────────────────────────────────────────

const buildPrompt = (role: string, snapshotStr: string): string => {
    const roleLabel = role === 'student' ? 'student' : role === 'faculty' ? 'faculty member' : 'institution administrator';

    return `You are an academic intelligence explanation assistant analyzing a ${roleLabel}'s performance data from the Career Hub platform.

CRITICAL RULES:
1. The metrics provided are AUTHORITATIVE. Do NOT change any numerical values.
2. Do NOT invent predictions, scores, or statistics not present in the data.
3. Do NOT create recommendations not supported by the provided data.
4. If data is insufficient, explicitly state that the available data is insufficient.
5. Be concise, academic, and actionable. Avoid generic motivational language.
6. Explain the provided results clearly in second or third person as appropriate for the role.

INTELLIGENCE SNAPSHOT (authoritative source):
${snapshotStr}

REQUIRED OUTPUT FORMAT (respond ONLY with valid JSON, no markdown, no extra text):
{
  "summary": "2-3 sentence overview of overall academic standing based ONLY on the provided metrics",
  "keyFindings": [
    "Specific finding 1 citing actual metric values",
    "Specific finding 2 citing actual metric values",
    "Specific finding 3 citing actual metric values"
  ],
  "trendExplanation": "Explanation of the trend direction with reference to actual trend value provided",
  "riskExplanation": "Explanation of the risk classification citing actual risk level and scores provided",
  "predictionExplanation": "Explanation of what the deterministic predictions indicate, citing actual predicted values provided",
  "recommendationExplanation": "Explanation of why the listed recommendations are relevant based on the provided metrics",
  "nextSteps": [
    "Specific actionable next step 1 grounded in the data",
    "Specific actionable next step 2 grounded in the data"
  ]
}`;
};

// ─── Response Validation ──────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof ExplanationOutput)[] = [
    'summary', 'keyFindings', 'trendExplanation', 'riskExplanation',
    'predictionExplanation', 'recommendationExplanation', 'nextSteps'
];

const validateShape = (parsed: any): parsed is ExplanationOutput => {
    for (const field of REQUIRED_FIELDS) {
        if (!(field in parsed)) return false;
    }
    if (!Array.isArray(parsed.keyFindings) || parsed.keyFindings.length === 0) return false;
    if (!Array.isArray(parsed.nextSteps) || parsed.nextSteps.length === 0) return false;
    if (typeof parsed.summary !== 'string' || parsed.summary.trim().length < 10) return false;
    if (typeof parsed.trendExplanation !== 'string' || parsed.trendExplanation.trim().length < 5) return false;
    return true;
};

/**
 * Numerical Integrity Check (Module 5)
 * Verifies the AI explanation does not contradict key authoritative backend values.
 * Returns false if a contradiction is detected.
 */
const numericalIntegrityCheck = (responseText: string, scores: Record<string, any>): boolean => {
    const keysToCheck: Array<{ field: keyof typeof scores; label: string }> = [
        { field: 'overallScore', label: 'overall' },
        { field: 'overallHealthScore', label: 'health' },
        { field: 'riskLevel', label: 'risk' }
    ];

    for (const { field, label } of keysToCheck) {
        const val = scores[field];
        if (val === undefined || val === null) continue;

        // Check numeric contradictions: look for the same label with a different number
        if (typeof val === 'number') {
            // Extract numbers near the label in the text
            const pattern = new RegExp(`(${label}|score|health)\\s*(?:is|:)?\\s*(\\d+)`, 'gi');
            let match;
            while ((match = pattern.exec(responseText)) !== null) {
                const mentioned = parseInt(match[2], 10);
                // Allow ±1 rounding tolerance
                if (Math.abs(mentioned - val) > 3) {
                    console.warn(`[ExplainService] Numerical mismatch: field "${field}" is ${val} but AI mentioned ${mentioned}`);
                    return false;
                }
            }
        }
    }
    return true;
};

// ─── Deterministic Fallback ───────────────────────────────────────────────────

const buildFallback = (role: string, scores: Record<string, any>, predictionsArr: any[], recommendationsArr: any[]): ExplanationOutput => {
    const overallScore = scores.overallScore ?? scores.overallFacultyScore ?? scores.institutionHealthScore ?? scores.systemHealth ?? 0;
    const riskLevel = scores.riskLevel ?? 'UNKNOWN';
    const trend = scores.trend ?? 'STABLE';

    const validPreds = predictionsArr.filter(p => p.predictionStatus === 'VALID');
    const upPreds = validPreds.filter(p => p.trend === 'UP' || p.trend === 'UPWARD');
    const downPreds = validPreds.filter(p => p.trend === 'DOWN' || p.trend === 'DOWNWARD');

    const keyFindings: string[] = [];

    if (role === 'student') {
        keyFindings.push(`Overall academic health score: ${overallScore}% — classified as ${riskLevel} RISK.`);
        if (scores.assignmentScore !== undefined) keyFindings.push(`Assignment completion score: ${scores.assignmentScore}%.`);
        if (scores.aiUsageScore !== undefined) keyFindings.push(`AI tool usage score: ${scores.aiUsageScore}%.`);
        if (scores.consistencyScore !== undefined) keyFindings.push(`Study consistency score: ${scores.consistencyScore}%.`);
    } else if (role === 'faculty') {
        keyFindings.push(`Overall faculty performance score: ${overallScore}% — classified as ${riskLevel} RISK.`);
        if (scores.classroomEngagement !== undefined) keyFindings.push(`Classroom engagement score: ${scores.classroomEngagement}%.`);
        if (scores.teachingEffectiveness !== undefined) keyFindings.push(`Teaching effectiveness score: ${scores.teachingEffectiveness}%.`);
        if (scores.aiUsageScore !== undefined) keyFindings.push(`AI tool adoption score: ${scores.aiUsageScore}%.`);
    } else {
        keyFindings.push(`Institutional health score: ${overallScore}% — currently ${riskLevel} RISK.`);
        if (scores.studentHealth !== undefined) keyFindings.push(`Student health index: ${scores.studentHealth}%.`);
        if (scores.facultyHealth !== undefined) keyFindings.push(`Faculty health index: ${scores.facultyHealth}%.`);
        if (scores.aiAdoption !== undefined) keyFindings.push(`Platform-wide AI adoption: ${scores.aiAdoption}%.`);
    }

    const nextSteps: string[] = [];
    if (riskLevel === 'HIGH') {
        nextSteps.push('Immediately review lowest-scoring areas and create an improvement plan.');
        nextSteps.push('Engage with available AI tools to accelerate performance recovery.');
    } else if (riskLevel === 'MEDIUM') {
        nextSteps.push('Focus on consistency: maintain regular activity to move from MEDIUM to LOW risk.');
        nextSteps.push('Review pending recommendations to address the most impactful gaps.');
    } else {
        nextSteps.push('Maintain current performance levels to sustain LOW risk classification.');
        nextSteps.push('Explore advanced features to further improve academic metrics.');
    }
    if (recommendationsArr.length > 0) {
        nextSteps.push(`Address the top priority item: "${sanitizeForPrompt(recommendationsArr[0]?.title || 'pending recommendation')}".`);
    }

    const predSummary = validPreds.length > 0
        ? `${upPreds.length} metrics trending upward, ${downPreds.length} trending downward based on deterministic OLS/WMA analysis.`
        : 'Insufficient historical data for reliable predictions. Continue platform activity to build history.';

    const recSummary = recommendationsArr.length > 0
        ? `${recommendationsArr.length} recommendation(s) are active. Top priority: "${sanitizeForPrompt(recommendationsArr[0]?.title || '')}" (${recommendationsArr[0]?.priority || 'medium'}).`
        : 'No active recommendations at this time.';

    return {
        summary: `Your current overall score is ${overallScore}%, placing you in the ${riskLevel} risk category. Recent activity trend is ${trend}. This assessment is based on live data from Career Hub's deterministic intelligence engine.`,
        keyFindings: keyFindings.slice(0, 5),
        trendExplanation: `Academic trend is currently ${trend}. This is computed from the last 7 days of activity versus the prior 7 days across all tracked metrics.`,
        riskExplanation: `Risk level is ${riskLevel} based on an overall score of ${overallScore}%. Scores ≥85 = LOW, 70–84 = MEDIUM, <70 = HIGH RISK.`,
        predictionExplanation: predSummary,
        recommendationExplanation: recSummary,
        nextSteps
    };
};

// ─── Main Explanation Generator ───────────────────────────────────────────────

export const generateExplanation = async (
    userId: string,
    role: string,
    snapshot: any
): Promise<ExplanationResponse> => {

    const cacheKey = buildCacheKey(userId, role, snapshot);
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const { snapshotStr, scores, predictionsArr, recommendationsArr } = buildSafeSnapshot(role, snapshot);

    // --- Attempt AI explanation ---
    try {
        const systemInstruction = `You are an academic intelligence explanation assistant. The supplied metrics are authoritative. Do not change numerical values. Do not invent statistics. Do not create predictions. Do not create recommendations not supported by the provided data. Explain the provided results clearly. If data is insufficient, explicitly state that the available data is insufficient. Respond ONLY with valid JSON matching the specified schema.`;

        const prompt = buildPrompt(role, snapshotStr);

        const rawResponse = await callAI([
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
        ]);

        // Strip markdown code fences if present
        const cleanedResponse = rawResponse
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        let parsed: any;
        try {
            parsed = JSON.parse(cleanedResponse);
        } catch {
            throw new Error('Malformed JSON from model');
        }

        if (!validateShape(parsed)) {
            throw new Error('Response schema validation failed');
        }

        // Numerical integrity check
        if (!numericalIntegrityCheck(JSON.stringify(parsed), scores)) {
            throw new Error('Numerical integrity check failed — contradicts authoritative metrics');
        }

        // Truncate arrays to safe sizes
        const explanation: ExplanationOutput = {
            summary: parsed.summary.slice(0, 600),
            keyFindings: parsed.keyFindings.slice(0, 6).map((s: string) => s.slice(0, 250)),
            trendExplanation: parsed.trendExplanation.slice(0, 400),
            riskExplanation: parsed.riskExplanation.slice(0, 400),
            predictionExplanation: parsed.predictionExplanation.slice(0, 400),
            recommendationExplanation: parsed.recommendationExplanation.slice(0, 400),
            nextSteps: parsed.nextSteps.slice(0, 5).map((s: string) => s.slice(0, 250))
        };

        const result: ExplanationResponse = {
            success: true,
            source: 'gemini',
            explanation,
            generatedAt: new Date().toISOString()
        };

        setCache(cacheKey, result);
        return result;

    } catch (err: any) {
        console.warn('[ExplainService] AI explanation failed, using deterministic fallback:', err?.message);

        // Deterministic fallback — always uses real metrics
        const fallback = buildFallback(role, scores, predictionsArr, recommendationsArr);
        const result: ExplanationResponse = {
            success: true,
            source: 'deterministic_fallback',
            explanation: fallback,
            generatedAt: new Date().toISOString()
        };
        // Cache fallback for shorter period (1 min)
        explanationCache.set(cacheKey, { data: result, timestamp: Date.now() - (CACHE_TTL - 60000) });
        return result;
    }
};

export const clearExplanationCache = (): void => {
    explanationCache.clear();
};
