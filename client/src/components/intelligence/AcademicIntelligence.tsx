import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api.js';
import { PredictionCard } from './predictions/PredictionCard.js';
import { HistoricalTrendChart } from './predictions/HistoricalTrendChart.js';
import { PredictionSkeleton } from './predictions/PredictionSkeleton.js';
import { PredictionEmptyState } from './predictions/PredictionEmptyState.js';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import {
    Sparkles,
    AlertOctagon,
    Clock,
    BookOpen,
    CheckCircle,
    FileText,
    CheckCheck,
    Trash2,
    Activity,
    GraduationCap,
    TrendingUp,
    TrendingDown,
    Minus,
    Shield,
    AlertTriangle,
    Info,
    RefreshCw,
    Bell,
    UserPlus,
    Key,
    LogOut,
    Edit,
    FileUp,
    UploadCloud,
    DownloadCloud,
    MessageCircle,
    Layers,
    HelpCircle,
    Calendar,
    UserCog,
    UserX,
    Book,
    Clipboard,
    Award
} from 'lucide-react';

interface AcademicIntelligenceProps {
    role: 'student' | 'faculty' | 'admin';
}

// Map string icons to components for timeline rendering
const iconMap: Record<string, React.ComponentType<any>> = {
    'sparkles': Sparkles,
    'alert-octagon': AlertOctagon,
    'clock': Clock,
    'book-open': BookOpen,
    'check-circle': CheckCircle,
    'file-text': FileText,
    'trash-2': Trash2,
    'activity': Activity,
    'graduation-cap': GraduationCap,
    'shield': Shield,
    'alert-triangle': AlertTriangle,
    'info': Info,
    'bell': Bell,
    'user-plus': UserPlus,
    'key': Key,
    'log-out': LogOut,
    'edit': Edit,
    'file-up': FileUp,
    'upload-cloud': UploadCloud,
    'download-cloud': DownloadCloud,
    'message-circle': MessageCircle,
    'layers': Layers,
    'help-circle': HelpCircle,
    'calendar': Calendar,
    'user-cog': UserCog,
    'user-x': UserX,
    'book': Book,
    'clipboard': Clipboard
};

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
        border: 'border-emerald-500/20 dark:border-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-400'
    },
    rose: {
        bg: 'bg-rose-500/10 dark:bg-rose-500/5',
        border: 'border-rose-500/20 dark:border-rose-500/10',
        text: 'text-rose-700 dark:text-rose-400'
    },
    amber: {
        bg: 'bg-amber-500/10 dark:bg-amber-500/5',
        border: 'border-amber-500/20 dark:border-amber-500/10',
        text: 'text-amber-700 dark:text-amber-400'
    },
    blue: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/5',
        border: 'border-blue-500/20 dark:border-blue-500/10',
        text: 'text-blue-700 dark:text-blue-400'
    },
    indigo: {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/5',
        border: 'border-indigo-500/20 dark:border-indigo-500/10',
        text: 'text-indigo-700 dark:text-indigo-400'
    },
    violet: {
        bg: 'bg-violet-500/10 dark:bg-violet-500/5',
        border: 'border-violet-500/20 dark:border-violet-500/10',
        text: 'text-violet-700 dark:text-violet-400'
    },
    pink: {
        bg: 'bg-pink-500/10 dark:bg-pink-500/5',
        border: 'border-pink-500/20 dark:border-pink-500/10',
        text: 'text-pink-700 dark:text-pink-400'
    },
    cyan: {
        bg: 'bg-cyan-500/10 dark:bg-cyan-500/5',
        border: 'border-cyan-500/20 dark:border-cyan-500/10',
        text: 'text-cyan-700 dark:text-cyan-400'
    },
    orange: {
        bg: 'bg-orange-500/10 dark:bg-orange-500/5',
        border: 'border-orange-500/20 dark:border-orange-500/10',
        text: 'text-orange-700 dark:text-orange-400'
    },
    teal: {
        bg: 'bg-teal-500/10 dark:bg-teal-500/5',
        border: 'border-teal-500/20 dark:border-teal-500/10',
        text: 'text-teal-700 dark:text-teal-400'
    },
    slate: {
        bg: 'bg-slate-500/10 dark:bg-slate-500/5',
        border: 'border-slate-500/20 dark:border-slate-500/10',
        text: 'text-slate-700 dark:text-slate-400'
    }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const getRiskBadgeClasses = (riskLevel?: string) => {
    switch (riskLevel) {
        case 'LOW': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
        case 'MEDIUM': return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
        case 'HIGH': return 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
        default: return 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400';
    }
};

const TrendIcon: React.FC<{ trend?: string }> = ({ trend }) => {
    if (trend === 'UP') return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
    if (trend === 'DOWN') return <TrendingDown className="h-3.5 w-3.5 text-rose-500" />;
    return <Minus className="h-3.5 w-3.5 text-slate-400" />;
};

const ScoreBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-primary' }) => (
    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
        <div
            className={`${color} h-full rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
    </div>
);

const AlertSeverityIcon: React.FC<{ severity: string }> = ({ severity }) => {
    switch (severity) {
        case 'critical': return <AlertOctagon className="h-4 w-4 text-rose-500" />;
        case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        default: return <Info className="h-4 w-4 text-blue-500" />;
    }
};

const getSeverityBg = (severity: string) => {
    switch (severity) {
        case 'critical': return 'bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/5';
        case 'warning': return 'bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/5';
        default: return 'bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/5';
    }
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const AcademicIntelligence: React.FC<AcademicIntelligenceProps> = ({ role }) => {
    const queryClient = useQueryClient();
    const [timelinePage, setTimelinePage] = useState(1);
    const [timelineFilter, setTimelineFilter] = useState('all');
    const [notificationPage, setNotificationPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'notifications' | 'timeline' | 'report' | 'recommendations' | 'predictions' | 'risk' | 'insight'>('overview');

    // ─── Phase 5B.3C: AI Insight State ───────────────────────────────────────
    const [insightLoading, setInsightLoading] = useState(false);
    const [insightResult, setInsightResult] = useState<any | null>(null);
    const [insightError, setInsightError] = useState<string | null>(null);
    const [hasGeneratedInsight, setHasGeneratedInsight] = useState(false);
    const [insightSubmitting, setInsightSubmitting] = useState(false);

    const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    // 1. Dashboard Intelligence
    const { data: intelData, isLoading: isIntelLoading, refetch: refetchIntel } = useQuery({
        queryKey: ['dashboardIntelligence', role],
        queryFn: async () => {
            const response = await api.get('/intelligence/dashboard');
            return response.data;
        },
        staleTime: 15000,
        refetchInterval: 60000
    });

    // 2. Smart Alerts from analytics
    const { data: alertsData, isLoading: isAlertsLoading, refetch: refetchAlerts } = useQuery({
        queryKey: ['smartAlerts', role],
        queryFn: async () => {
            const response = await api.get('/analytics/alerts');
            return response.data;
        },
        staleTime: 30000
    });

    // 3. Paginated and Filtered Timeline
    const { data: timelineData, isLoading: isTimelineLoading } = useQuery({
        queryKey: ['activityTimelineData', role, timelinePage, timelineFilter],
        queryFn: async () => {
            const response = await api.get(`/intelligence/timeline?page=${timelinePage}&limit=6&filter=${timelineFilter}`);
            return response.data;
        }
    });

    // 4. Notifications
    const { data: notificationsData } = useQuery({
        queryKey: ['notificationsData', notificationPage],
        queryFn: async () => {
            const response = await api.get(`/intelligence/notifications?page=${notificationPage}&limit=6`);
            return response.data;
        }
    });

    // 5. Weekly AI Performance Report
    const { data: weeklyReportData, isLoading: isWeeklyReportLoading, refetch: refetchWeeklyReport } = useQuery({
        queryKey: ['weeklyReportData', role],
        queryFn: async () => {
            const response = await api.get('/intelligence/weekly');
            return response.data;
        },
        staleTime: 30000
    });

    // 6. AI Recommendations (Phase 5B.3)
    const { data: recsData, isLoading: isRecsLoading } = useQuery({
        queryKey: ['aiRecommendations', role],
        queryFn: async () => {
            const response = await api.get('/intelligence/recommendations');
            return response.data;
        },
        staleTime: 30000
    });

    // 7. Predictive Intelligence (Phase 5B.3)
    const { data: predsData, isLoading: isPredsLoading } = useQuery({
        queryKey: ['aiPredictions', role],
        queryFn: async () => {
            const response = await api.get('/intelligence/predictions');
            return response.data;
        },
        staleTime: 30000
    });

    // 8. Academic Risk Assessment (Phase 5B.3)
    const { data: riskData, isLoading: isRiskLoading } = useQuery({
        queryKey: ['aiRiskAssessment', role],
        queryFn: async () => {
            const response = await api.get('/intelligence/risk');
            return response.data;
        },
        staleTime: 30000
    });

    // ─── Phase 5B.3C: Generate AI Explanation ────────────────────────────────
    const handleGenerateInsight = async () => {
        if (insightSubmitting || insightLoading) return;
        setInsightLoading(true);
        setInsightError(null);
        setInsightSubmitting(true);
        try {
            const response = await api.post('/intelligence/explain');
            setInsightResult(response.data);
            setHasGeneratedInsight(true);
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'AI explanation is temporarily unavailable. Please try again.';
            setInsightError(msg);
        } finally {
            setInsightLoading(false);
            // Debounce: allow retry only after 5 seconds
            setTimeout(() => setInsightSubmitting(false), 5000);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await api.put(`/intelligence/notifications/${id}/read`);
            showStatus('Notification marked as read');
            queryClient.invalidateQueries({ queryKey: ['notificationsData'] });
            refetchIntel();
        } catch {
            showStatus('Failed to update notification', 'error');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/intelligence/notifications/mark-all-read');
            showStatus('All notifications marked as read!');
            queryClient.invalidateQueries({ queryKey: ['notificationsData'] });
            refetchIntel();
        } catch {
            showStatus('Failed to clear notifications', 'error');
        }
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            await api.delete(`/intelligence/notifications/${id}`);
            showStatus('Notification deleted');
            queryClient.invalidateQueries({ queryKey: ['notificationsData'] });
            refetchIntel();
        } catch {
            showStatus('Failed to delete notification', 'error');
        }
    };

    if (isIntelLoading) {
        return (
            <div className="py-12 space-y-6">
                <div className="h-16 w-full bg-slate-100 dark:bg-dark-hover animate-pulse rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-100 dark:bg-dark-hover animate-pulse rounded-lg" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64 bg-slate-100 dark:bg-dark-hover animate-pulse rounded-lg" />
                    <div className="h-64 bg-slate-100 dark:bg-dark-hover animate-pulse rounded-lg" />
                </div>
            </div>
        );
    }

    const scores = intelData?.scores || {};
    const recommendations = intelData?.recommendations || [];
    const predictions = intelData?.predictions || [];
    const insights = intelData?.insights || [];
    const smartAlerts = alertsData?.alerts || [];

    const getPriorityBadgeColors = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
            case 'high': return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
            case 'medium': return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
            default: return 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400';
        }
    };

    // ─── Score card data per role ────────────────────────────────────────────
    const studentScoreCards = [
        { label: 'Learning Score', value: scores.learningScore, key: 'learningScore' },
        { label: 'Assignment Rate', value: scores.assignmentScore, key: 'assignmentScore' },
        { label: 'AI Usage Index', value: scores.aiUsageScore, key: 'aiUsageScore' },
        { label: 'Consistency Index', value: scores.consistencyScore, key: 'consistencyScore' },
    ];

    const facultyScoreCards = [
        { label: 'Teaching Effectiveness', value: scores.teachingEffectiveness, key: 'teachingEffectiveness' },
        { label: 'Classroom Engagement', value: scores.classroomEngagement, key: 'classroomEngagement' },
        { label: 'Assignment Metrics', value: scores.assignmentManagement, key: 'assignmentManagement' },
        { label: 'AI Adoption Ratio', value: scores.aiAdoption, key: 'aiAdoption' },
    ];

    const adminScoreCards = [
        { label: 'Department Rankings', value: scores.departmentPerformance, key: 'departmentPerformance' },
        { label: 'Faculty Performance', value: scores.facultyPerformance, key: 'facultyPerformance' },
        { label: 'Student Success Index', value: scores.studentSuccessIndex, key: 'studentSuccessIndex' },
        { label: 'AI Adoption Score', value: scores.aiAdoptionScore, key: 'aiAdoptionScore' },
    ];

    const scoreCards = role === 'student' ? studentScoreCards : role === 'faculty' ? facultyScoreCards : adminScoreCards;
    const overallScore = role === 'student' ? scores.overallScore : role === 'faculty' ? scores.overallFacultyScore : scores.institutionHealthScore;
    const overallLabel = role === 'student' ? 'Overall Score' : role === 'faculty' ? 'Overall Faculty Score' : 'Institution Health';

    const tabs = [
        { id: 'overview', label: 'Hub Dashboard' },
        { id: 'insight', label: 'AI Insight' },
        { id: 'recommendations', label: 'AI Recommendations' },
        { id: 'predictions', label: 'Predictions' },
        { id: 'risk', label: 'Risk Assessment' },
        { id: 'alerts', label: 'Smart Alerts', badge: smartAlerts.filter((a: any) => a.severity === 'critical').length },
        { id: 'notifications', label: 'Alerts Center', badge: notificationsData?.unreadCount },
        { id: 'timeline', label: 'Timeline' },
        { id: 'report', label: 'Weekly Report' },
    ];

    return (
        <div className="space-y-6">
            {/* Toast */}
            {statusMessage && (
                <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-dropdown border text-xs font-semibold select-none animate-slideIn ${statusMessage.type === 'success' ? 'bg-success-light border-success/20 text-success-text' : 'bg-danger-light border-danger/20 text-danger-text'}`}>
                    {statusMessage.text}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/40 dark:border-dark-border/40 pb-4 gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-text-primary dark:text-gray-200 flex items-center gap-2 font-serif">
                        <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" /> AI Academic Intelligence Hub
                    </h2>
                    <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
                        Dynamic recommendation engine, predictive algorithms and weekly academic reports.
                    </p>
                </div>
                {/* Tab nav */}
                <div className="flex bg-slate-100/50 dark:bg-dark-surface/50 p-1 rounded-lg border border-border dark:border-dark-border max-w-max self-start text-xs font-bold flex-wrap gap-0.5">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeTab === tab.id
                                ? 'bg-white dark:bg-dark-card shadow-subtle text-primary dark:text-primary-300'
                                : 'text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {tab.label}
                            {tab.badge && tab.badge > 0 ? (
                                <span className="h-4 min-w-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                                    {tab.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── TAB: OVERVIEW ──────────────────────────────────────────── */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Health Score Cards */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-text-primary dark:text-slate-300 uppercase tracking-wider">
                                Academic Performance Health Scores
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-text-secondary dark:text-slate-400">
                                {scores.lastUpdated && (
                                    <span className="flex items-center gap-1">
                                        <RefreshCw className="h-3 w-3" />
                                        Updated: {new Date(scores.lastUpdated).toLocaleTimeString()}
                                    </span>
                                )}
                                {scores.riskLevel && (
                                    <span className={`px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${getRiskBadgeClasses(scores.riskLevel)}`}>
                                        <Shield className="h-3 w-3" /> {scores.riskLevel} RISK
                                    </span>
                                )}
                                {scores.trend && (
                                    <span className="flex items-center gap-1 font-semibold">
                                        <TrendIcon trend={scores.trend} />
                                        {scores.trend}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {/* Individual score cards */}
                            {scoreCards.map(card => (
                                <div key={card.key} className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4 rounded-xl flex flex-col justify-between min-h-28 shadow-subtle">
                                    <span className="text-[10px] text-text-secondary dark:text-slate-400 font-bold uppercase">{card.label}</span>
                                    <h5 className="text-3xl font-extrabold text-primary dark:text-primary-300 mt-2 font-serif">
                                        {card.value !== undefined ? `${card.value}%` : '—'}
                                    </h5>
                                    <ScoreBar value={card.value ?? 0} />
                                </div>
                            ))}

                            {/* Overall score card */}
                            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 rounded-xl flex flex-col justify-between min-h-28 shadow-subtle relative overflow-hidden">
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 animate-spin" /> {overallLabel}
                                </span>
                                <h5 className="text-3xl font-extrabold text-amber-600 dark:text-amber-300 mt-2 font-serif">
                                    {overallScore !== undefined ? `${overallScore}%` : '—'}
                                </h5>
                                <ScoreBar value={overallScore ?? 0} color="bg-gradient-to-r from-amber-500 to-orange-500" />
                                {scores.riskLevel && (
                                    <div className={`absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${getRiskBadgeClasses(scores.riskLevel)}`}>
                                        {scores.riskLevel}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recommendations & Predictions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-xs font-bold text-text-primary dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                <span>Centralized AI Academic Recommendations</span>
                                <span className="text-[10px] font-normal text-text-secondary lowercase">Dynamic matches</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recommendations.map((rec: any, idx: number) => (
                                    <Card key={rec._id || idx} className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border ch-card-vibrant flex flex-col justify-between">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <Badge variant="primary" className="text-[8px] uppercase select-none tracking-wider">
                                                    {rec.category || rec.type}
                                                </Badge>
                                                <Badge className={`text-[8px] uppercase font-bold py-0.5 border ${getPriorityBadgeColors(rec.priority)}`}>
                                                    {rec.priority}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-xs font-bold text-text-primary dark:text-gray-200 mt-2">
                                                {rec.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-0">
                                            <p className="text-[11px] text-text-secondary dark:text-slate-400 leading-relaxed">
                                                {rec.description}
                                            </p>
                                            {rec.actionableItem && (
                                                <a
                                                    href={rec.actionableItem}
                                                    className="inline-flex items-center gap-1.5 text-[10px] text-primary dark:text-primary-300 font-bold hover:underline"
                                                >
                                                    Execute recommendation Directive →
                                                </a>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                                {recommendations.length === 0 && (
                                    <div className="col-span-2 py-8 text-center text-xs text-text-secondary dark:text-slate-400 italic">
                                        AI recommendations are generated dynamically. Study active subjects to populate triggers.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Predictions */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-text-primary dark:text-slate-300 uppercase tracking-wider">
                                Academic Predictive Analytics
                            </h3>
                            <div className="space-y-4">
                                {predictions.map((pred: any, idx: number) => (
                                    <Card key={idx} className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border">
                                        <CardContent className="p-4 space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-text-primary dark:text-gray-300">{pred.metric}</span>
                                                <Badge className={`text-[9px] font-bold py-0.5 ${pred.trend === 'UPWARD' || pred.trend === 'UP'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                                                    }`}>
                                                    {pred.trend}
                                                </Badge>
                                            </div>
                                            <div className="flex items-baseline justify-between pt-1">
                                                <span className="text-sm font-extrabold text-primary dark:text-primary-300">{pred.predictionValue}</span>
                                                <span className="text-[10px] text-text-secondary dark:text-slate-400">Confidence: {pred.confidence}%</span>
                                            </div>
                                            <p className="text-[10px] text-text-secondary dark:text-slate-400 leading-relaxed">
                                                {pred.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Intelligence Insights */}
                    {insights.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-text-primary dark:text-slate-300 uppercase tracking-wider">
                                Academic Intelligence Insights
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {insights.map((ins: any, idx: number) => (
                                    <Card key={idx} className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="font-bold text-text-secondary dark:text-slate-400 uppercase select-none">{ins.title}</span>
                                                <Badge variant="primary" className="text-[8px] py-0.5">{ins.highlight}</Badge>
                                            </div>
                                            <h4 className="text-sm font-extrabold text-text-primary dark:text-gray-200 font-serif">
                                                {ins.detail}
                                            </h4>
                                            <p className="text-[10px] text-text-secondary dark:text-slate-400 leading-snug">
                                                {ins.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: AI INSIGHT (Phase 5B.3C) ──────────────────────────── */}
            {activeTab === 'insight' && (
                <Card className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border animate-fadeIn">
                    <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <CardTitle className="text-sm font-bold flex items-center gap-1.5 font-serif text-amber-600 dark:text-amber-400">
                                    <Sparkles className="h-4 w-4 animate-pulse" /> AI Intelligent Explanation
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Gemini interprets your verified intelligence snapshot — scores, trends, predictions and recommendations.
                                    Backend data remains authoritative; AI only explains.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasGeneratedInsight && !insightLoading && (
                                    <span className="text-[9px] text-text-secondary dark:text-slate-500 italic">
                                        {insightResult?.source === 'deterministic_fallback' ? '⚠ Fallback active' : '✓ Gemini'}
                                    </span>
                                )}
                                <Button
                                    id="btn-generate-ai-insight"
                                    onClick={handleGenerateInsight}
                                    disabled={insightLoading || insightSubmitting}
                                    className="text-xs flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {insightLoading ? (
                                        <><RefreshCw className="h-3 w-3 animate-spin" /> Generating...</>
                                    ) : hasGeneratedInsight ? (
                                        <><RefreshCw className="h-3 w-3" /> Refresh AI Insight</>
                                    ) : (
                                        <><Sparkles className="h-3 w-3" /> Generate Insight</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Loading Skeleton */}
                        {insightLoading && (
                            <div className="space-y-4 py-4">
                                <div className="text-center py-6">
                                    <Sparkles className="h-8 w-8 mx-auto mb-3 text-amber-500 animate-pulse" />
                                    <p className="text-xs text-text-secondary dark:text-slate-400 font-medium">Generating explanation...</p>
                                    <p className="text-[10px] text-text-secondary dark:text-slate-500 mt-1">Gemini is analysing your intelligence snapshot</p>
                                </div>
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-16 bg-slate-100 dark:bg-dark-surface animate-pulse rounded-lg border border-border/10" />
                                ))}
                            </div>
                        )}

                        {/* Not yet generated */}
                        {!insightLoading && !hasGeneratedInsight && !insightError && (
                            <div className="py-16 text-center space-y-4">
                                <Sparkles className="h-10 w-10 mx-auto text-amber-400 opacity-60" />
                                <p className="text-sm font-semibold text-text-primary dark:text-gray-300">
                                    Generate your personalised AI Insight
                                </p>
                                <p className="text-xs text-text-secondary dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                                    Click <strong>Generate Insight</strong> above. Gemini will interpret your verified academic health,
                                    risk classification, predictions, and recommendations into a clear, actionable explanation.
                                    Backend data is always authoritative — Gemini only explains.
                                </p>
                                <div className="flex gap-2 justify-center flex-wrap text-[10px] text-text-secondary dark:text-slate-500">
                                    <span className="bg-slate-100 dark:bg-dark-surface px-2 py-1 rounded border border-border/20">✓ Role-scoped</span>
                                    <span className="bg-slate-100 dark:bg-dark-surface px-2 py-1 rounded border border-border/20">✓ Server-authoritative</span>
                                    <span className="bg-slate-100 dark:bg-dark-surface px-2 py-1 rounded border border-border/20">✓ Fallback-safe</span>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {!insightLoading && insightError && !insightResult && (
                            <div className="py-8 text-center space-y-3">
                                <AlertTriangle className="h-8 w-8 mx-auto text-amber-500" />
                                <p className="text-sm font-semibold text-text-primary dark:text-gray-300">AI explanation is temporarily unavailable.</p>
                                <p className="text-xs text-text-secondary dark:text-slate-400">{insightError}</p>
                                <Button
                                    id="btn-retry-ai-insight"
                                    onClick={handleGenerateInsight}
                                    disabled={insightSubmitting}
                                    className="text-xs mt-2"
                                >
                                    Retry
                                </Button>
                                <p className="text-[9px] text-text-secondary dark:text-slate-500 italic mt-2">
                                    Deterministic scores, trends, predictions and recommendations remain fully available.
                                </p>
                            </div>
                        )}

                        {/* Success: AI Explanation Output */}
                        {!insightLoading && insightResult?.explanation && (
                            <div className="space-y-5">
                                {/* Source Badge */}
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border select-none ${insightResult.source === 'gemini'
                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                                            : 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400'
                                        }`}>
                                        {insightResult.source === 'gemini' ? '✦ GEMINI AI' : '⚙ DETERMINISTIC FALLBACK'}
                                    </span>
                                    <span className="text-[9px] text-text-secondary dark:text-slate-500">
                                        Generated at {new Date(insightResult.generatedAt).toLocaleTimeString()}
                                    </span>
                                </div>

                                {/* Summary */}
                                <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider select-none">AI Summary</span>
                                    </div>
                                    <p className="text-[12px] text-text-primary dark:text-gray-200 leading-relaxed font-serif">
                                        {insightResult.explanation.summary}
                                    </p>
                                </div>

                                {/* Key Findings + Next Steps */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/30 dark:bg-dark-card/20 border border-border dark:border-dark-border rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-3.5 w-3.5 text-primary dark:text-primary-300" />
                                            <span className="text-[10px] font-bold text-text-primary dark:text-slate-300 uppercase tracking-wider select-none">Key Findings</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {(insightResult.explanation.keyFindings || []).map((f: string, i: number) => (
                                                <li key={i} className="flex gap-2 items-start text-[11px] text-text-secondary dark:text-slate-300">
                                                    <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-primary/10 text-primary dark:text-primary-300 flex items-center justify-center text-[9px] font-bold">{i + 1}</span>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider select-none">Next Steps</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {(insightResult.explanation.nextSteps || []).map((s: string, i: number) => (
                                                <li key={i} className="flex gap-2 items-start text-[11px] text-text-secondary dark:text-slate-300">
                                                    <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Trend + Risk */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/30 dark:bg-dark-card/20 border border-border dark:border-dark-border rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-[10px] font-bold text-text-primary dark:text-slate-300 uppercase tracking-wider select-none">Trend Analysis</span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary dark:text-slate-300 leading-relaxed">
                                            {insightResult.explanation.trendExplanation}
                                        </p>
                                    </div>
                                    <div className="bg-white/30 dark:bg-dark-card/20 border border-border dark:border-dark-border rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Shield className="h-3.5 w-3.5 text-rose-500" />
                                            <span className="text-[10px] font-bold text-text-primary dark:text-slate-300 uppercase tracking-wider select-none">Risk Explanation</span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary dark:text-slate-300 leading-relaxed">
                                            {insightResult.explanation.riskExplanation}
                                        </p>
                                    </div>
                                </div>

                                {/* Prediction + Recommendation */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Activity className="h-3.5 w-3.5 text-indigo-500" />
                                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider select-none">Prediction Explanation</span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary dark:text-slate-300 leading-relaxed">
                                            {insightResult.explanation.predictionExplanation}
                                        </p>
                                    </div>
                                    <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <GraduationCap className="h-3.5 w-3.5 text-violet-500" />
                                            <span className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider select-none">Recommendation Context</span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary dark:text-slate-300 leading-relaxed">
                                            {insightResult.explanation.recommendationExplanation}
                                        </p>
                                    </div>
                                </div>

                                {/* Disclaimer */}
                                <div className="pt-2 border-t border-border/20 text-[9px] text-text-secondary dark:text-slate-500 italic">
                                    AI Insight generated by Gemini via OpenRouter. Backend deterministic calculations (scores, risk, predictions, recommendations) remain the authoritative source of truth and are not modified by AI output.
                                    {insightResult.source === 'deterministic_fallback' && ' Currently using deterministic fallback — AI provider temporarily unavailable.'}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── TAB: AI RECOMMENDATIONS ────────────────────────────────── */}
            {activeTab === 'recommendations' && (
                <Card className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border animate-fadeIn">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5 font-serif text-amber-600 dark:text-amber-400">
                            <Sparkles className="h-4 w-4 animate-pulse" /> AI Academic Recommendations
                        </CardTitle>
                        <CardDescription>
                            Personalized guidance for optimized learning outcomes explained by Gemini AI.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isRecsLoading ? (
                            <div className="space-y-4 py-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-28 bg-slate-100 dark:bg-dark-surface animate-pulse rounded-lg border border-border/10" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(recsData?.recommendations || []).map((rec: any, idx: number) => (
                                    <Card key={rec._id || idx} className="bg-gradient-to-br from-white/30 to-slate-50/20 dark:from-dark-card/20 dark:to-dark-surface/10 border border-border/60 dark:border-dark-border/40 relative overflow-hidden shadow-subtle flex flex-col justify-between">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-center gap-2">
                                                <Badge variant="primary" className="text-[8px] uppercase tracking-wider select-none">
                                                    {rec.category || rec.type}
                                                </Badge>
                                                <Badge className={`text-[8px] uppercase font-bold py-0.5 border ${getPriorityBadgeColors(rec.priority)}`}>
                                                    {rec.priority}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-xs font-bold text-text-primary dark:text-gray-200 mt-2 font-serif">
                                                {rec.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-0 text-xs">
                                            <p className="text-[11px] text-text-secondary dark:text-slate-450 leading-relaxed">
                                                {rec.description}
                                            </p>

                                            {/* Gemini Explanation Reason (Module 6) */}
                                            {rec.reason && (
                                                <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-2 items-start">
                                                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                                    <div>
                                                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 block uppercase mb-0.5 select-none">Gemini Evaluation</span>
                                                        <p className="text-[10px] text-text-secondary dark:text-slate-300 italic font-serif leading-relaxed">
                                                            "{rec.reason}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Confidence gauge (Module 8) */}
                                            <div className="flex items-center justify-between pt-1 text-[10px]">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-text-secondary dark:text-slate-500">Confidence Index:</span>
                                                    <span className="font-bold text-primary dark:text-primary-300">{rec.confidence || 80}%</span>
                                                </div>
                                                <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-primary dark:bg-primary-400 h-full rounded-full" style={{ width: `${rec.confidence || 80}%` }} />
                                                </div>
                                            </div>

                                            {rec.actionableItem && (
                                                <a
                                                    href={rec.actionableItem}
                                                    className="inline-flex items-center gap-1 text-[10px] text-primary dark:text-primary-300 font-bold hover:underline select-none pt-2"
                                                >
                                                    Execute recommendation directive →
                                                </a>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                                {(recsData?.recommendations || []).length === 0 && (
                                    <div className="col-span-2 py-12 text-center text-xs text-text-secondary dark:text-slate-400 italic">
                                        No recommendations active currently. Keep updating study logs to seed intelligence.
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── TAB: PREDICTIONS (Phase 5B.3B) ─────────────────────────── */}
            {activeTab === 'predictions' && (
                <Card className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border animate-fadeIn">
                    <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <CardTitle className="text-sm font-bold flex items-center gap-1.5 font-serif text-amber-600 dark:text-amber-400">
                                    <TrendingUp className="h-4 w-4" /> Predictive Intelligence Engine
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Deterministic statistical forecasts using least squares linear regression and weighted moving averages on historical MongoDB activity data. Prediction horizon: next 7 days.
                                </CardDescription>
                            </div>
                            <div className="flex bg-slate-100/50 dark:bg-dark-surface/50 p-0.5 rounded-lg border border-border dark:border-dark-border text-[10px] font-bold gap-0.5 shrink-0">
                                <span className="px-3 py-1.5 rounded-md bg-white dark:bg-dark-card shadow-subtle text-primary dark:text-primary-300 select-none">7 Days</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isPredsLoading ? (
                            <PredictionSkeleton />
                        ) : (
                            <>
                                {/* Chart: valid predictions only */}
                                <HistoricalTrendChart predictions={predsData?.predictions || []} />

                                {/* Prediction Cards */}
                                {(predsData?.predictions || []).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {(predsData?.predictions || []).map((pred: any, idx: number) => (
                                            <PredictionCard key={idx} pred={pred} />
                                        ))}
                                    </div>
                                ) : (
                                    <PredictionEmptyState />
                                )}

                                {/* Method footnote */}
                                {(predsData?.predictions || []).some((p: any) => p.predictionStatus === 'VALID') && (
                                    <div className="pt-2 border-t border-border/20 text-[9px] text-text-secondary dark:text-slate-500 italic">
                                        Predictions computed using least squares linear regression (OLS) on 4-week historical activity data from MongoDB.
                                        Trend threshold: slope &gt; 5% of weekly mean = UP/DOWN, otherwise STABLE.
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── TAB: RISK ASSESSMENT ───────────────────────────────────── */}
            {activeTab === 'risk' && (
                <Card className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border animate-fadeIn">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5 font-serif text-amber-600 dark:text-amber-400">
                            <Shield className="h-4 w-4" /> Academic Risk Assessment &amp; Early Intervention
                        </CardTitle>
                        <CardDescription>
                            Predictive risk index calculated from assignment submission rates, consistency scores, and AI activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isRiskLoading ? (
                            <div className="space-y-4 py-6 text-center text-xs text-text-secondary">
                                <RefreshCw className="h-8 w-8 mx-auto mb-3 text-amber-500 animate-spin" />
                                Assessing academic risk indicators and compiling details...
                            </div>
                        ) : (
                            (() => {
                                const r = riskData?.risk || {};
                                const breakdown = r.breakdown || {};

                                return (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Risk Status Indicator */}
                                        <Card className="bg-gradient-to-br from-white/30 to-slate-50/20 dark:from-dark-card/20 dark:to-dark-surface/10 border border-border/65 p-6 flex flex-col justify-between items-center text-center">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none">
                                                    Academic Risk Classification
                                                </span>
                                                <div className="pt-2">
                                                    <span className={`px-4 py-1.5 rounded-full border text-xs font-extrabold shadow-sm ${getRiskBadgeClasses(r.riskLevel)}`}>
                                                        {r.riskLevel || 'LOW'} RISK
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Score gauge */}
                                            <div className="my-6 relative flex items-center justify-center">
                                                <div className="h-28 w-28 rounded-full border-4 border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                                                    <span className="text-[10px] text-text-secondary dark:text-slate-500 font-bold uppercase select-none">Score</span>
                                                    <h3 className={`text-3xl font-black font-serif ${r.riskColor === 'red' ? 'text-rose-500' : r.riskColor === 'yellow' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                        {r.score || 100}
                                                    </h3>
                                                    <div className={`absolute inset-0 bg-${r.riskColor}-550/5 animate-pulse`} />
                                                </div>
                                            </div>

                                            <div className="space-y-1 w-full">
                                                <span className="text-[9px] text-text-secondary dark:text-slate-500 font-semibold block">Academic Health Rating (0 - 100)</span>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${r.riskColor === 'red' ? 'bg-rose-500' : r.riskColor === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${r.score || 100}%` }} />
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Risk Reasons */}
                                        <Card className="lg:col-span-2 bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border p-6 space-y-4">
                                            <h4 className="text-xs font-bold text-text-primary dark:text-slate-350 uppercase tracking-wider select-none border-b border-border/20 pb-2">
                                                Performance Indicator Analysis &amp; Diagnostics
                                            </h4>

                                            <div className="space-y-3">
                                                {(r.reasons || []).map((reason: string, index: number) => (
                                                    <div key={index} className="flex gap-2.5 items-start text-xs">
                                                        <div className="shrink-0 mt-0.5">
                                                            {r.riskLevel === 'HIGH' ? (
                                                                <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
                                                            ) : r.riskLevel === 'MEDIUM' ? (
                                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-text-secondary dark:text-slate-350 leading-relaxed">
                                                            {reason}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Metrics breakdown */}
                                            <div className="pt-4 border-t border-border/20 space-y-3">
                                                <h5 className="text-[10px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none">
                                                    Risk Factors Breakdown
                                                </h5>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                                                    <div className="p-3 bg-slate-500/5 dark:bg-dark-surface/50 border border-border/40 dark:border-dark-border/40 rounded-xl space-y-1">
                                                        <span className="text-text-secondary dark:text-slate-505 block font-semibold">Submissions</span>
                                                        <span className="font-extrabold text-xs block text-text-primary dark:text-gray-300">{breakdown.assignmentCompletion ?? 0}%</span>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                                                            <div className="bg-primary h-full" style={{ width: `${breakdown.assignmentCompletion ?? 0}%` }} />
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-slate-500/5 dark:bg-dark-surface/50 border border-border/40 dark:border-dark-border/40 rounded-xl space-y-1">
                                                        <span className="text-text-secondary dark:text-slate-505 block font-semibold">Quiz Mastery</span>
                                                        <span className="font-extrabold text-xs block text-text-primary dark:text-gray-300">{breakdown.quizPerformance ?? 0}%</span>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                                                            <div className="bg-primary h-full" style={{ width: `${breakdown.quizPerformance ?? 0}%` }} />
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-slate-500/5 dark:bg-dark-surface/50 border border-border/40 dark:border-dark-border/40 rounded-xl space-y-1">
                                                        <span className="text-text-secondary dark:text-slate-505 block font-semibold">Consistency</span>
                                                        <span className="font-extrabold text-xs block text-text-primary dark:text-gray-300">{breakdown.studyConsistency ?? 0}%</span>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                                                            <div className="bg-primary h-full" style={{ width: `${breakdown.studyConsistency ?? 0}%` }} />
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-slate-500/5 dark:bg-dark-surface/50 border border-border/40 dark:border-dark-border/40 rounded-xl space-y-1">
                                                        <span className="text-text-secondary dark:text-slate-505 block font-semibold">AI Assistant</span>
                                                        <span className="font-extrabold text-xs block text-text-primary dark:text-gray-300">{breakdown.aiUsage ?? 0}%</span>
                                                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                                                            <div className="bg-primary h-full" style={{ width: `${breakdown.aiUsage ?? 0}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                );
                            })()
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── TAB: SMART ALERTS ──────────────────────────────────────── */}
            {activeTab === 'alerts' && (
                <Card className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border">
                    <CardHeader className="border-b border-border/40 dark:border-dark-border/40 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Bell className="h-4 w-4 text-amber-500" />
                                Smart Academic Alert Engine
                            </CardTitle>
                            <CardDescription>Live MongoDB-driven alerts generated from your real academic data.</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] font-bold flex items-center gap-1.5 h-8 select-none"
                            onClick={() => refetchAlerts()}
                        >
                            <RefreshCw className="h-3.5 w-3.5" /> Refresh Alerts
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        {isAlertsLoading ? (
                            <div className="space-y-3">
                                {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 dark:bg-dark-hover animate-pulse rounded-lg" />)}
                            </div>
                        ) : smartAlerts.length > 0 ? (
                            smartAlerts.map((alert: any, idx: number) => (
                                <div
                                    key={idx}
                                    className={`p-4 border rounded-xl flex items-start gap-3 ${getSeverityBg(alert.severity)}`}
                                >
                                    <div className="shrink-0 mt-0.5">
                                        <AlertSeverityIcon severity={alert.severity} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-xs font-bold text-text-primary dark:text-gray-200">{alert.title}</h4>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${alert.severity === 'critical'
                                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                                : alert.severity === 'warning'
                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                                                }`}>
                                                {alert.priority}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary dark:text-slate-400 mt-1 leading-relaxed">
                                            {alert.description}
                                        </p>
                                        <span className="text-[9px] text-text-secondary dark:text-slate-500 font-semibold block mt-1.5">
                                            Generated: {new Date(alert.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-xs text-text-secondary dark:text-slate-400 italic">
                                <Shield className="h-8 w-8 mx-auto mb-3 text-emerald-500 opacity-60" />
                                No active alerts. Your academic health indicators are all clear!
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── TAB: NOTIFICATIONS (INTELLIGENCE) ──────────────────────── */}
            {activeTab === 'notifications' && (
                <Card className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border">
                    <CardHeader className="border-b border-border/40 dark:border-dark-border/40 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-sm font-bold">Smart Notification Alert Center</CardTitle>
                            <CardDescription>Real-time warning signs, checklist deadlocks, and system notifications.</CardDescription>
                        </div>
                        {notificationsData?.notifications?.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-[10px] font-bold flex items-center gap-1.5 h-8 select-none"
                                onClick={handleMarkAllRead}
                            >
                                <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {notificationsData?.notifications?.map((not: any) => (
                            <div
                                key={not._id}
                                className={`p-4 border rounded-xl flex items-start justify-between gap-4 transition-all ${not.isRead
                                    ? 'bg-slate-50/50 dark:bg-dark-surface/30 border-border dark:border-dark-border'
                                    : 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/20 shadow-subtle'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${getPriorityBadgeColors(not.priority)}`}>
                                        <AlertOctagon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-xs font-bold text-text-primary dark:text-gray-200">{not.title}</h4>
                                            {!not.isRead && (
                                                <span className="px-1.5 py-0.5 bg-primary text-white rounded text-[8px] font-bold select-none">New</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 leading-relaxed">{not.message}</p>
                                        <span className="text-[9px] text-text-secondary dark:text-slate-400 font-semibold block mt-2">
                                            Alert Triggered: {new Date(not.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {!not.isRead && (
                                        <button
                                            onClick={() => handleMarkRead(not._id)}
                                            className="p-1 px-2 border border-border dark:border-dark-border bg-white dark:bg-dark-surface text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-dark-hover rounded font-semibold text-[9px] select-none"
                                        >
                                            Acknowledge
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteNotification(not._id)}
                                        className="p-1 text-danger hover:bg-danger-light dark:hover:bg-danger/10 rounded"
                                        title="Dismiss notification"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!notificationsData || notificationsData.notifications.length === 0) && (
                            <div className="py-12 text-center text-xs text-text-secondary dark:text-slate-400 italic">
                                Your warning alerts list is completely clear. Excellent work keeping up with classroom syllabus deadlines!
                            </div>
                        )}
                        {notificationsData?.total > 6 && (
                            <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs font-bold">
                                <span className="text-text-secondary dark:text-slate-300">
                                    Showing alert page {notificationPage} of {Math.ceil(notificationsData.total / 6)}
                                </span>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" disabled={notificationPage <= 1} onClick={() => setNotificationPage(p => p - 1)}>Previous Page</Button>
                                    <Button size="sm" variant="outline" disabled={notificationPage >= Math.ceil(notificationsData.total / 6)} onClick={() => setNotificationPage(p => p + 1)}>Next Page</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── TAB: TIMELINE ──────────────────────────────────────────── */}
            {activeTab === 'timeline' && (
                <Card className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border">
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-border/40 dark:border-dark-border/40 gap-4">
                        <div>
                            <CardTitle className="text-sm font-bold">Activity Chronological logs Stream</CardTitle>
                            <CardDescription>Trace all actions including study note compile milestones, chats, and quiz operations.</CardDescription>
                        </div>
                        {/* Interactive Filter bar */}
                        <div className="flex bg-slate-100/50 dark:bg-dark-surface/50 p-0.5 rounded-lg border border-border dark:border-dark-border max-w-max self-start text-[10px] font-bold flex-wrap gap-0.5">
                            {[
                                { id: 'all', label: 'All Activities' },
                                { id: 'ai', label: 'AI Helpers' },
                                { id: 'assignments', label: 'Assignments' },
                                { id: 'classrooms', label: 'Classrooms' },
                                { id: 'documents', label: 'Resources' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setTimelineFilter(f.id as any)}
                                    className={`px-2.5 py-1.5 rounded-md transition-all ${timelineFilter === f.id
                                        ? 'bg-white dark:bg-dark-card shadow-subtle text-primary dark:text-primary-300'
                                        : 'text-text-secondary hover:text-text-primary dark:text-slate-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-0 pt-4">
                        {isTimelineLoading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 dark:bg-dark-hover animate-pulse rounded-lg" />)}
                            </div>
                        ) : (timelineData?.events || []).length > 0 ? (
                            <>
                                {(timelineData?.events || []).map((event: any, idx: number) => {
                                    const IconComponent = iconMap[event.icon] || Activity;
                                    const colors = colorMap[event.color] || colorMap.slate;
                                    return (
                                        <div key={idx} className="flex gap-3 items-start pb-4 relative">
                                            {idx < (timelineData?.events || []).length - 1 && (
                                                <div className="absolute left-4 top-8 bottom-0 w-px bg-border/30 dark:bg-dark-border/30" />
                                            )}
                                            <div className={`p-2 rounded-lg border shrink-0 z-10 ${colors.bg} ${colors.border}`}>
                                                <IconComponent className={`h-3.5 w-3.5 ${colors.text}`} />
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                                    <p className="text-[11px] font-semibold text-text-primary dark:text-gray-200 leading-snug">
                                                        {event.description}
                                                    </p>
                                                    <span className="text-[9px] text-text-secondary dark:text-slate-500 shrink-0 font-semibold">
                                                        {new Date(event.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider ${colors.text}`}>{event.type}</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Timeline Pagination */}
                                {(timelineData?.total ?? 0) > 10 && (
                                    <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs font-bold">
                                        <span className="text-text-secondary dark:text-slate-300">
                                            Page {timelinePage} of {Math.ceil((timelineData?.total ?? 0) / 10)}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" disabled={timelinePage <= 1} onClick={() => setTimelinePage(p => p - 1)}>Previous</Button>
                                            <Button size="sm" variant="outline" disabled={timelinePage >= Math.ceil((timelineData?.total ?? 0) / 10)} onClick={() => setTimelinePage(p => p + 1)}>Next</Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-12 text-center text-xs text-text-secondary dark:text-slate-400 italic">
                                No timeline events found for the selected filter.
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── TAB: WEEKLY REPORT ─────────────────────────────────────── */}
            {activeTab === 'report' && (
                <Card className="bg-white/40 dark:bg-dark-card/30 border border-border dark:border-dark-border">
                    {isWeeklyReportLoading ? (
                        <div className="p-8 space-y-4 animate-pulse">
                            <div className="h-8 bg-slate-100 dark:bg-dark-hover rounded-lg" />
                            <div className="grid grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 dark:bg-dark-hover rounded-lg" />)}
                            </div>
                        </div>
                    ) : (
                        <>
                            {(() => {
                                const rData = weeklyReportData || {};
                                return (
                                    <>
                                        <CardHeader className="border-b border-border/40 dark:border-dark-border/40 pb-4">
                                            <div className="flex justify-between items-center flex-wrap gap-4">
                                                <div>
                                                    <CardTitle className="text-md font-extrabold flex items-center gap-1.5 font-serif text-amber-600 dark:text-amber-400">
                                                        <Sparkles className="h-5 w-5 animate-pulse text-amber-500" /> Weekly AI Intelligence Narrative Report
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Semester evaluation period: {rData.weekPeriod || 'Current Week'}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-[10px] font-bold flex items-center gap-1 h-8 select-none"
                                                        onClick={() => refetchWeeklyReport()}
                                                    >
                                                        <RefreshCw className="h-3.5 w-3.5" /> Re-Evaluate
                                                    </Button>
                                                    <Badge variant="success" className="px-3 py-1 select-none text-[10px] font-bold">Active Week</Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6 pt-6 text-xs leading-relaxed">
                                            {/* AI Summary Box */}
                                            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 inline-flex p-2 bg-amber-500/10 rounded-bl-xl text-amber-600 dark:text-amber-400">
                                                    <Sparkles className="h-4 w-4" />
                                                </div>
                                                <h4 className="font-extrabold text-amber-700 dark:text-amber-300 mb-1.5 text-xs flex items-center gap-1">
                                                    AI Copilot Narrative Insight
                                                </h4>
                                                <p className="text-text-secondary dark:text-slate-300 leading-relaxed font-serif text-xs italic">
                                                    &quot;{rData.summary || 'Summary is being drafted by our RAG analyst.'}&quot;
                                                </p>
                                            </div>

                                            {role === 'student' && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <div className="flex justify-between items-center text-text-secondary dark:text-slate-400 uppercase select-none tracking-widest text-[9px] font-bold">
                                                                <span>Tasks Completed</span>
                                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                            </div>
                                                            <div className="text-2xl font-extrabold text-text-primary dark:text-gray-200">
                                                                {rData.assignmentsCompleted ?? 0}
                                                            </div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block truncate">
                                                                {rData.submittedTitles?.length > 0 ? rData.submittedTitles.slice(0, 2).join(', ') : 'No assignments submitted'}
                                                            </span>
                                                        </div>

                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <div className="flex justify-between items-center text-text-secondary dark:text-slate-400 uppercase select-none tracking-widest text-[9px] font-bold">
                                                                <span>AI Interaction Index</span>
                                                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                                            </div>
                                                            <div className="text-2xl font-extrabold text-text-primary dark:text-gray-200">
                                                                {rData.aiUsageTotal ?? 0}
                                                            </div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">
                                                                {rData.aiChats ?? 0} chats, {rData.notesGenerated ?? 0} notes folder(s)
                                                            </span>
                                                        </div>

                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <div className="flex justify-between items-center text-text-secondary dark:text-slate-400 uppercase select-none tracking-widest text-[9px] font-bold">
                                                                <span>Top Subject</span>
                                                                <Award className="h-3.5 w-3.5 text-violet-500" />
                                                            </div>
                                                            <div className="text-lg font-extrabold text-text-primary dark:text-gray-200 truncate pt-1">
                                                                {rData.strongestSubject || 'None yet'}
                                                            </div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">
                                                                Least active: {rData.weakestSubject || 'N/A'}
                                                            </span>
                                                        </div>

                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <div className="flex justify-between items-center text-text-secondary dark:text-slate-400 uppercase select-none tracking-widest text-[9px] font-bold">
                                                                <span>Consistency</span>
                                                                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                                            </div>
                                                            <div className="text-2xl font-extrabold text-text-primary dark:text-gray-200">
                                                                {rData.learningConsistency ?? 0}%
                                                            </div>
                                                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1.5">
                                                                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${rData.learningConsistency || 0}%` }} />
                                                            </div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">
                                                                Peak day: {rData.mostActiveDay || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {role === 'faculty' && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <span className="text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none block">Assignments Published</span>
                                                            <div className="text-2xl font-extrabold text-text-primary dark:text-gray-200">{rData.assignmentsPublished ?? 0}</div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">Across {rData.activeClassrooms ?? 0} classrooms</span>
                                                        </div>

                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <span className="text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none block">Total Student Submissions</span>
                                                            <div className="text-2xl font-extrabold text-text-primary dark:text-gray-200">{rData.studentSubmissions ?? 0}</div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">Classrooms response index</span>
                                                        </div>

                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <span className="text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none block">AI-Assisted Materials</span>
                                                            <div className="text-lg font-extrabold text-text-primary dark:text-gray-200 truncate pt-1">
                                                                Plans: {rData.lessonPlansGenerated ?? 0} | Papers: {rData.questionPapersCreated ?? 0}
                                                            </div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">Adoption index: {rData.aiUsage ?? 0} tools used</span>
                                                        </div>

                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <span className="text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none block">Active Classrooms</span>
                                                            <div className="text-lg font-bold text-text-primary dark:text-gray-200 truncate pt-1">
                                                                {rData.mostActiveClassroom && rData.mostActiveClassroom !== 'N/A' ? rData.mostActiveClassroom : 'None'}
                                                            </div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block truncate">Least active: {rData.leastActiveClassroom || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {role === 'admin' && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <span className="text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none block">Total Users Directory</span>
                                                            <div className="text-2xl font-extrabold text-text-primary dark:text-gray-200">{rData.totalUsers ?? 0}</div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">+{rData.newUsersThisWeek ?? 0} new this week</span>
                                                        </div>

                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <span className="text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none block">Active Directory Roll</span>
                                                            <div className="text-lg font-extrabold text-text-primary dark:text-gray-200 pt-1">
                                                                Stud: {rData.activeStudents ?? 0} | Fac: {rData.activeFaculty ?? 0}
                                                            </div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">Access levels verified</span>
                                                        </div>

                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <span className="text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none block">Document Intelligence RAG</span>
                                                            <div className="text-2xl font-extrabold text-text-primary dark:text-gray-200">{rData.documentsProcessed ?? 0} docs</div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">Vector indices synced</span>
                                                        </div>

                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <span className="text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-widest select-none block">Weekly RAG Load</span>
                                                            <div className="text-2xl font-extrabold text-text-primary dark:text-gray-200">{rData.totalAIUsage ?? 0} calls</div>
                                                            <span className="text-[10px] text-text-secondary dark:text-slate-500 block">Chats: {rData.aiChats ?? 0} sessions</span>
                                                        </div>
                                                    </div>

                                                    {/* Department Activity List */}
                                                    {rData.departmentActivity?.length > 0 && (
                                                        <div className="border border-border dark:border-dark-border/50 p-4 rounded-xl space-y-2 bg-white/20 dark:bg-dark-card/25">
                                                            <h5 className="font-bold text-text-primary dark:text-slate-350 text-[10px] uppercase select-none tracking-widest">
                                                                Department Resource &amp; Activity Metrics
                                                            </h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                                                {rData.departmentActivity.map((dept: any, index: number) => (
                                                                    <div key={index} className="flex justify-between items-center text-xs border-b border-border/40 dark:border-dark-border/40 pb-2">
                                                                        <div>
                                                                            <span className="font-bold text-text-primary dark:text-slate-300">{dept.name}</span>
                                                                            <span className="text-[9px] text-text-secondary dark:text-slate-500 block">Code: {dept.code}</span>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="font-semibold text-text-primary dark:text-slate-300 block">{dept.classrooms} Classrooms</span>
                                                                            <span className="text-[9.5px] text-text-secondary dark:text-slate-500 block">{dept.faculty} Faculty</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </>
                                );
                            })()}
                        </>
                    )}
                </Card>
            )}
        </div>
    );
};
