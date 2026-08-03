import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import {
    TrendingUp,
    Award,
    BookOpen,
    CheckSquare,
    Sparkles,
    Users,
    HardDrive,
    Clock,
    Zap,
    CheckCircle,
    Calendar,
    Layers,
    Activity,
    Filter,
    Brain,
    Layout,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// Reusable Count-up animation component using requestAnimationFrame & IntersectionObserver
const AnimatedCounter: React.FC<{
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}> = ({ value, duration = 1000, prefix = '', suffix = '', decimals = 0 }) => {
    const [count, setCount] = useState<number>(0);
    const [hasAnimated, setHasAnimated] = useState<boolean>(false);
    const elementRef = useRef<HTMLSpanElement>(null);
    const valueRef = useRef<number>(value);

    // Keep valueRef updated
    useEffect(() => {
        valueRef.current = value;
        if (hasAnimated) {
            setCount(value);
        }
    }, [value, hasAnimated]);

    useEffect(() => {
        const targetValue = valueRef.current;
        if (targetValue === 0) {
            setCount(0);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    let startTimestamp: number | null = null;
                    const step = (timestamp: number) => {
                        if (!startTimestamp) startTimestamp = timestamp;
                        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                        const current = progress * targetValue;
                        setCount(current);
                        if (progress < 1) {
                            window.requestAnimationFrame(step);
                        } else {
                            setCount(targetValue);
                        }
                    };
                    window.requestAnimationFrame(step);
                }
            },
            { threshold: 0.1 }
        );

        const currentElement = elementRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, [duration, hasAnimated]);

    return (
        <span ref={elementRef}>
            {prefix}
            {count.toFixed(decimals)}
            {suffix}
        </span>
    );
};

export const AnalyticsDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const role = user?.role || 'student';

    // Filters state
    const [timeframe, setTimeframe] = useState<string>('30days');
    const [selectedClassroom, setSelectedClassroom] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'role' | 'ai'>('role');

    // Fetch helper options
    const { data: classroomsData } = useQuery({
        queryKey: ['classrooms-list'],
        queryFn: async () => {
            if (role !== 'faculty' && role !== 'admin') return [];
            const res = await api.get('/classrooms');
            return res.data.classrooms || [];
        },
        enabled: role === 'faculty' || role === 'admin'
    });

    const { data: deptsData } = useQuery({
        queryKey: ['departments-list'],
        queryFn: async () => {
            if (role !== 'admin') return [];
            const res = await api.get('/departments');
            return res.data.departments || [];
        },
        enabled: role === 'admin'
    });

    // Fetch Main Role Analytics
    const {
        data: roleAnalytics,
        isLoading: isRoleLoading,
        isFetching: isRoleFetching,
        error: roleError,
        refetch: refetchRole
    } = useQuery({
        queryKey: ['analytics-role', role, timeframe, selectedClassroom, selectedSubject, selectedDept],
        queryFn: async () => {
            let url = `/analytics/${role}?timeframe=${timeframe}`;
            if (selectedClassroom) url += `&classroom=${selectedClassroom}`;
            if (selectedSubject) url += `&subject=${selectedSubject}`;
            if (selectedDept) url += `&department=${selectedDept}`;
            const res = await api.get(url);
            return res.data.data;
        }
    });

    // Fetch AI Analytics & Insights
    const {
        data: aiAnalytics,
        isLoading: isAiLoading,
        isFetching: isAiFetching,
        refetch: refetchAi
    } = useQuery({
        queryKey: ['analytics-ai', timeframe],
        queryFn: async () => {
            const res = await api.get(`/analytics/ai?timeframe=${timeframe}`);
            return res.data.data;
        }
    });

    // Fetch System Overview & Insights
    const {
        data: insightsData,
        isLoading: isInsightsLoading,
        isFetching: isInsightsFetching,
        refetch: refetchInsights
    } = useQuery({
        queryKey: ['analytics-overview', timeframe],
        queryFn: async () => {
            const res = await api.get(`/analytics/overview?timeframe=${timeframe}`);
            return res.data.insights || [];
        }
    });

    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        if (roleAnalytics || aiAnalytics || insightsData) {
            setLastUpdated(new Date());
        }
    }, [roleAnalytics, aiAnalytics, insightsData]);

    const handleRefresh = () => {
        refetchRole();
        refetchAi();
        refetchInsights();
    };

    // Color scheme for PIE charts
    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

    const isLoading = isRoleLoading || isAiLoading || isInsightsLoading || isRoleFetching || isAiFetching || isInsightsFetching;

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary-900/40 via-purple-900/20 to-transparent p-6 rounded-2xl border border-primary-500/10 dark:border-primary-500/10 backdrop-blur-md">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary-500/10 text-primary-400 dark:text-primary-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-primary-500/20 flex items-center gap-1.5 animate-pulse">
                            <Activity className="h-3 w-3" /> Live Metrics
                        </span>
                        <span className="text-secondary-400 dark:text-secondary-500 text-xs">• Dynamic Aggregation</span>
                        <span className="text-slate-400 dark:text-secondary-500 text-xs font-mono flex items-center gap-1 ml-1">
                            <Clock className="h-3.5 w-3.5" /> Last Updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-secondary-100 to-secondary-400 bg-clip-text text-transparent">
                        Performance Analytics Hub
                    </h1>
                    <p className="text-sm text-text-secondary dark:text-secondary-400">
                        Real-time MongoDB-driven calculations of classroom performance, AI usage patterns, and academic consistency metrics.
                    </p>
                </div>

                {/* Global Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Timeframe selector */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-card border border-border dark:border-dark-border rounded-lg p-1.5">
                        {['today', '7days', '30days', 'semester', 'year'].map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`text-xs px-2.5 py-1 rounded-md capitalize font-medium transition-all ${timeframe === tf
                                    ? 'bg-primary text-white shadow-glow'
                                    : 'text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200'
                                    }`}
                            >
                                {tf === '7days' ? '7 Days' : tf === '30days' ? '30 Days' : tf}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border dark:border-dark-border">
                <button
                    onClick={() => setActiveTab('role')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'role'
                        ? 'border-primary text-primary dark:text-primary-400'
                        : 'border-transparent text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200'
                        }`}
                >
                    <Layout className="h-4 w-4" />
                    {role === 'admin' ? 'Executive Overview' : role === 'faculty' ? 'Classroom Performance' : 'Academic Analytics'}
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'ai'
                        ? 'border-primary text-primary dark:text-primary-400'
                        : 'border-transparent text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200'
                        }`}
                >
                    <Brain className="h-4 w-4" />
                    AI Usage & Insights
                </button>
            </div>

            {/* Filter Row */}
            {activeTab === 'role' && (
                <div className="flex flex-wrap items-center gap-3 bg-white/40 dark:bg-dark-card/20 p-4 rounded-xl border border-slate-100 dark:border-dark-border/40">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary dark:text-secondary-400 uppercase tracking-wider mr-2">
                        <Filter className="h-3.5 w-3.5" /> Filter by
                    </div>

                    {/* Admin filters */}
                    {role === 'admin' && (
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="text-xs px-3 py-1.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-text-primary dark:text-secondary-200"
                        >
                            <option value="">All Departments</option>
                            {deptsData?.map((d: any) => (
                                <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                            ))}
                        </select>
                    )}

                    {/* Faculty filters */}
                    {role === 'faculty' && (
                        <>
                            <select
                                value={selectedClassroom}
                                onChange={(e) => setSelectedClassroom(e.target.value)}
                                className="text-xs px-3 py-1.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-text-primary dark:text-secondary-200"
                            >
                                <option value="">All Classrooms</option>
                                {classroomsData?.map((c: any) => (
                                    <option key={c._id} value={c._id}>{c.className}</option>
                                ))}
                            </select>

                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="text-xs px-3 py-1.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-text-primary dark:text-secondary-200"
                            >
                                <option value="">All Subjects</option>
                                {/* Dynamically extract subjects from classrooms */}
                                {classroomsData
                                    ?.filter((c: any) => !selectedClassroom || c._id === selectedClassroom)
                                    ?.flatMap((c: any) => c.subjects || [])
                                    ?.reduce((acc: any[], current: any) => {
                                        if (!acc.some(x => x._id === current._id)) acc.push(current);
                                        return acc;
                                    }, [])
                                    ?.map((s: any) => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                                    ))
                                }
                            </select>
                        </>
                    )}

                    {/* Student filters */}
                    {role === 'student' && roleAnalytics?.subjectPerformance && (
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="text-xs px-3 py-1.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-text-primary dark:text-secondary-200"
                        >
                            <option value="">All Subjects</option>
                            {roleAnalytics?.subjectPerformance.map((item: any) => (
                                <option key={item.subject} value={item.subject}>{item.subject}</option>
                            ))}
                        </select>
                    )}

                    {/* Clear Filter button */}
                    {(selectedClassroom || selectedSubject || selectedDept) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSelectedClassroom('');
                                setSelectedSubject('');
                                setSelectedDept('');
                            }}
                            className="text-xs text-rose-500 hover:text-rose-600"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            )}

            {/* Loading Skeleton */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse bg-white dark:bg-dark-card/50">
                            <CardContent className="p-6 space-y-3">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 w-1/3 rounded" />
                                <div className="h-8 bg-slate-200 dark:bg-slate-700 w-2/3 rounded" />
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 w-1/2 rounded" />
                            </CardContent>
                        </Card>
                    ))}
                    <div className="md:col-span-2 lg:col-span-3 h-[300px] bg-slate-200 dark:bg-slate-800/20 rounded-2xl animate-pulse" />
                    <div className="h-[300px] bg-slate-200 dark:bg-slate-800/20 rounded-2xl animate-pulse" />
                </div>
            ) : roleError ? (
                <div className="min-h-[250px] flex items-center justify-center border border-dashed border-red-500/30 rounded-2xl p-6 bg-red-500/5">
                    <div className="text-center space-y-2">
                        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                        <h3 className="font-semibold text-text-primary dark:text-secondary-100">Failed to load analytics</h3>
                        <p className="text-xs text-text-secondary dark:text-secondary-400">
                            There was an error communicating with the database analytics route.
                        </p>
                        <Button size="sm" variant="outline" onClick={handleRefresh}>Try Again</Button>
                    </div>
                </div>
            ) : activeTab === 'role' ? (
                // RENDER ROLE SPECIFIC VIEW
                role === 'student' ? (
                    /* ========================================================
                       STUDENT DASHBOARD FRONTEND
                       ======================================================== */
                    <div className="space-y-6">
                        {/* KPI Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Academic Progress</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.academicProgress || 0} suffix="%" />
                                        </h3>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full"
                                                style={{ width: `${roleAnalytics?.academicProgress || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Assignments Completed</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.assignmentsCompleted || 0} />
                                        </h3>
                                        <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                                            <CheckCircle className="h-3 w-3" /> {roleAnalytics?.assignmentsPending} pending assignments
                                        </p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                        <CheckSquare className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">AI Chats & Queries</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.aiChatsUsed || 0} />
                                        </h3>
                                        <p className="text-xs text-text-secondary dark:text-secondary-400 mt-1">
                                            Using RAG document index
                                        </p>
                                    </div>
                                    <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Learning Consistency</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.learningConsistencyScore || 0} suffix="%" />
                                        </h3>
                                        <p className="text-xs text-purple-400 mt-1">
                                            Streak consistency index
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                                        <Award className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">AI Study Plans</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.studyPlannerCount || 0} />
                                        </h3>
                                        <p className="text-xs text-text-secondary dark:text-secondary-400 mt-1">
                                            Active generated study plans
                                        </p>
                                    </div>
                                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Uploaded Study Materials</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.uploadedStudyMaterials || 0} />
                                        </h3>
                                        <div className="text-[10px] text-text-secondary dark:text-secondary-400 mt-1 space-y-0.5">
                                            {roleAnalytics?.lastStudyMaterialUpload ? (
                                                <>
                                                    <span className="block truncate max-w-[180px]">Last: {new Date(roleAnalytics.lastStudyMaterialUpload).toLocaleDateString()}</span>
                                                    <span className="block truncate max-w-[180px]">Subject: {roleAnalytics.recentStudyMaterialSubject || 'N/A'}</span>
                                                </>
                                            ) : (
                                                <span className="block">No uploaded materials yet</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* AI Recommendation Alert */}
                        {roleAnalytics?.aiStudyRecommendation && (
                            <div className="flex gap-4 items-start bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl">
                                <Brain className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-text-primary dark:text-secondary-200">AI Academic Insight</h4>
                                    <p className="text-xs text-text-secondary dark:text-secondary-400 leading-relaxed">
                                        {roleAnalytics.aiStudyRecommendation}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Visual Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Weekly Activity LineChart */}
                            <Card className="glass-card lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">Weekly Study Activities</CardTitle>
                                    <CardDescription className="text-xs">Learning interactions mapped across weekly days</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={roleAnalytics?.weeklyStudyActivity || []}>
                                            <defs>
                                                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/10" />
                                            <XAxis dataKey="day" className="text-xs text-text-secondary dark:text-secondary-500" />
                                            <YAxis className="text-xs text-text-secondary dark:text-secondary-500" />
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }} />
                                            <Area type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSessions)" name="Interactions" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* AI Tools Usage Pie Chart */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">AI Component Partition</CardTitle>
                                    <CardDescription className="text-xs">Distribution of tools requested</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[280px] flex flex-col justify-center">
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={roleAnalytics?.aiUsagePie?.filter((p: any) => p.value > 0) || []}
                                                    innerRadius={50}
                                                    outerRadius={75}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {roleAnalytics?.aiUsagePie?.map((_entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '8px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-[10px] text-text-secondary dark:text-secondary-400">
                                        {roleAnalytics?.aiUsagePie?.map((entry: any, index: number) => (
                                            <span key={entry.name} className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                {entry.name} ({entry.value})
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bottom Row - Subject Performance Bar Chart & Heatmap */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Subject Performance */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">Subject Task Progress</CardTitle>
                                    <CardDescription className="text-xs">Completed vs total files/tasks</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={roleAnalytics?.subjectPerformance || []}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/10" />
                                            <XAxis dataKey="subject" className="text-xs text-text-secondary dark:text-secondary-500" />
                                            <YAxis className="text-xs text-text-secondary dark:text-secondary-500" />
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.90)', border: 'none', borderRadius: '8px' }} />
                                            <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed" />
                                            <Bar dataKey="total" fill="#a855f7" opacity={0.3} radius={[4, 4, 0, 0]} name="Total Tasks" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Learning Consistency Heatmap */}
                            <Card className="glass-card lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">Consistency Heatmap (Last 30 Days)</CardTitle>
                                    <CardDescription className="text-xs">Calendar tracking of study interactions per day</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto w-full">
                                        <div className="grid grid-cols-10 gap-2 min-w-[340px] justify-items-center py-2">
                                            {roleAnalytics?.monthlyActivityHeatmap?.map((day: any) => {
                                                const getHeatColor = (count: number) => {
                                                    if (count === 0) return 'bg-slate-100 dark:bg-dark-sidebar border-border';
                                                    if (count < 3) return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20';
                                                    if (count < 6) return 'bg-indigo-500/40 text-indigo-300 border-indigo-500/30';
                                                    return 'bg-indigo-500 text-white border-indigo-500';
                                                };

                                                return (
                                                    <div
                                                        key={day.date}
                                                        className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs font-semibold border ${getHeatColor(
                                                            day.count
                                                        )} transition-all transform hover:scale-105 pointer-events-auto`}
                                                        title={`${day.date}: ${day.count} activities`}
                                                    >
                                                        <span>{day.date.split('-')[2]}</span>
                                                        {day.count > 0 && <span className="text-[7px] leading-3 block opacity-80">{day.count}x</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 text-[10px] text-text-secondary dark:text-secondary-400 mt-4 px-2">
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-100 dark:bg-dark-sidebar border border-border rounded" /> 0 activity</span>
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500/25 border border-indigo-500/20 rounded" /> 1-2 activities</span>
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500/50 border border-indigo-500/30 rounded" /> 3-5 activities</span>
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded" /> 6+ activities</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : role === 'faculty' ? (
                    /* ========================================================
                       FACULTY DASHBOARD FRONTEND
                       ======================================================== */
                    <div className="space-y-6">
                        {/* KPI cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Active Students</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.totalStudents || 0} />
                                        </h3>
                                        <p className="text-xs text-text-secondary dark:text-secondary-400 mt-1">
                                            Taught across {roleAnalytics?.totalClassrooms} classrooms
                                        </p>
                                    </div>
                                    <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl">
                                        <Users className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Assignments Created</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.assignmentsCreated || 0} />
                                        </h3>
                                        <p className="text-xs text-emerald-400 mt-1">
                                            {roleAnalytics?.assignmentsPublished} published to classrooms
                                        </p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                        <CheckSquare className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Study Materials Uploaded</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.studyMaterialsUploaded || 0} />
                                        </h3>
                                        <p className="text-xs mt-1 text-primary-400">
                                            {roleAnalytics?.questionPapersUploaded} Question papers uploaded
                                        </p>
                                    </div>
                                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Average Student Progress</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.averageAssignmentCompletion || 0} suffix="%" />
                                        </h3>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2">
                                            <div
                                                className="bg-gradient-to-r from-violet-500 to-indigo-600 h-1.5 rounded-full"
                                                style={{ width: `${roleAnalytics?.averageAssignmentCompletion || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl">
                                        <TrendingUp className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Student engagement insight banner */}
                        <div className="flex gap-4 items-start bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl">
                            <Brain className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-text-primary dark:text-secondary-200">AI Student Performance Appraisal</h4>
                                <p className="text-xs text-text-secondary dark:text-secondary-400 leading-relaxed">
                                    Based on classroom activity index, average submission rate is {roleAnalytics?.averageAssignmentCompletion}%. We recommend enabling auto-reviews or uploading new AI Study plans in subjects with completion indexes below 60%.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Classroom Performance */}
                            <Card className="glass-card lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">Classroom Performance Comparison</CardTitle>
                                    <CardDescription className="text-xs">Completion rate & student distribution per classroom</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={roleAnalytics?.classroomPerformance || []}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/10" />
                                            <XAxis dataKey="name" className="text-xs text-text-secondary dark:text-secondary-500" />
                                            <YAxis className="text-xs text-text-secondary dark:text-secondary-500" />
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.90)', border: 'none', borderRadius: '8px' }} />
                                            <Bar dataKey="completionRate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completion Rate (%)" />
                                            <Bar dataKey="students" fill="#a855f7" radius={[4, 4, 0, 0]} name="Headcount" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Subject distribution */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">Students Taught by Subject</CardTitle>
                                    <CardDescription className="text-xs">Subject headcount distribution</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[280px] flex flex-col justify-center">
                                    {roleAnalytics?.subjectDistribution?.length > 0 ? (
                                        <>
                                            <div className="h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={roleAnalytics.subjectDistribution}
                                                            innerRadius={45}
                                                            outerRadius={70}
                                                            paddingAngle={2}
                                                            dataKey="studentsCount"
                                                        >
                                                            {roleAnalytics.subjectDistribution.map((_entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.90)', border: 'none', borderRadius: '8px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 text-[10px] text-text-secondary dark:text-secondary-400">
                                                {roleAnalytics.subjectDistribution.map((entry: any, index: number) => (
                                                    <span key={entry.name} className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                        {entry.name} ({entry.studentsCount})
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-xs text-text-secondary py-10">No mapped subjects with active students.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent assignments stats */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">Assignments Hand-in Rate</CardTitle>
                                    <CardDescription className="text-xs">Submission check of recent assignments</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {roleAnalytics?.assignmentCompletion?.map((ass: any, index: number) => (
                                            <div key={index} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-text-primary dark:text-secondary-200">{ass.title}</span>
                                                    <span className="text-text-secondary dark:text-secondary-400 flex items-center gap-2">
                                                        <span className="text-[10px] bg-slate-100 dark:bg-dark-card border border-border dark:border-dark-border px-1.5 py-0.5 rounded text-text-secondary">{ass.subject}</span>
                                                        {ass.completionRate}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full">
                                                    <div
                                                        className="bg-indigo-500 h-1.5 rounded-full"
                                                        style={{ width: `${ass.completionRate}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {(!roleAnalytics?.assignmentCompletion || roleAnalytics.assignmentCompletion.length === 0) && (
                                            <div className="text-center text-xs text-text-secondary py-6">No assignments posted.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Student participation table */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">Most Active Students</CardTitle>
                                    <CardDescription className="text-xs">Students with higher assignment submissions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto relative">
                                        <table className="w-full text-left text-xs text-text-secondary dark:text-secondary-400">
                                            <thead className="text-[10px] text-text-primary dark:text-secondary-200 uppercase border-b border-border dark:border-dark-border">
                                                <tr>
                                                    <th scope="col" className="pb-2 font-bold">Student Name</th>
                                                    <th scope="col" className="pb-2 font-bold text-right">Submissions logged</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {roleAnalytics?.studentParticipation?.map((st: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-border/50 dark:border-dark-border/40 hover:bg-slate-50 dark:hover:bg-dark-hover/10">
                                                        <td className="py-2.5 font-medium text-text-primary dark:text-secondary-200 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {st.name}
                                                        </td>
                                                        <td className="py-2.5 text-right font-semibold">{st.submissions} submissions</td>
                                                    </tr>
                                                ))}
                                                {(!roleAnalytics?.studentParticipation || roleAnalytics.studentParticipation.length === 0) && (
                                                    <tr>
                                                        <td colSpan={2} className="text-center py-6">No active submissions logged.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    /* ========================================================
                       ADMIN DASHBOARD FRONTEND
                       ======================================================== */
                    <div className="space-y-6">
                        {/* KPI Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">System Users</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.totalUsers || 0} />
                                        </h3>
                                        <p className="text-xs text-text-secondary dark:text-secondary-400 mt-1">
                                            {roleAnalytics?.students} Students | {roleAnalytics?.faculty} Faculty
                                        </p>
                                    </div>
                                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                                        <Users className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">AI Tokens Storage</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={parseFloat(roleAnalytics?.storageUsage || '0')} decimals={2} suffix=" MB" />
                                        </h3>
                                        <p className="text-xs text-emerald-400 mt-1">
                                            {roleAnalytics?.documentsUploaded} processed files (RAG)
                                        </p>
                                    </div>
                                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                        <HardDrive className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Average AI Latency</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={parseFloat(roleAnalytics?.averageAIResponseTime || '0')} decimals={2} suffix="s" />
                                        </h3>
                                        <p className="text-xs mt-1 text-rose-400">
                                            LLM pipeline health check normal
                                        </p>
                                    </div>
                                    <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card hover-glow transition-all">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Academic Components</p>
                                        <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                            <AnimatedCounter value={roleAnalytics?.classrooms || 0} />
                                        </h3>
                                        <p className="text-xs text-text-secondary dark:text-secondary-400 mt-1">
                                            {roleAnalytics?.departments} Depts | {roleAnalytics?.subjects} Subjects
                                        </p>
                                    </div>
                                    <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
                                        <Layers className="h-6 w-6" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Admin Insights banner */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Dynamic Insights column */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="glass-card">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">System Activity Trend</CardTitle>
                                        <CardDescription className="text-xs">Status distribution of users in database</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={[
                                                    { name: 'Active', count: roleAnalytics?.activeUsers || 0 },
                                                    { name: 'Inactive', count: roleAnalytics?.inactiveUsers || 0 }
                                                ]}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/10" />
                                                <XAxis dataKey="name" className="text-xs text-text-secondary dark:text-secondary-500" />
                                                <YAxis className="text-xs text-text-secondary dark:text-secondary-500" />
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.90)', border: 'none', borderRadius: '8px' }} />
                                                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Account Count">
                                                    <Cell fill="#10b981" />
                                                    <Cell fill="#ef4444" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Role Distribution Pie chart */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">User Role Distribution</CardTitle>
                                    <CardDescription className="text-xs">Database role records</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[280px] flex flex-col justify-center">
                                    <div className="h-[180px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={roleAnalytics?.roleDistribution || []}
                                                    innerRadius={45}
                                                    outerRadius={70}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {roleAnalytics?.roleDistribution?.map((_entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.90)', border: 'none', borderRadius: '8px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3 text-[10px] text-text-secondary dark:text-secondary-400">
                                        {roleAnalytics?.roleDistribution?.map((entry: any, index: number) => (
                                            <span key={entry.name} className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                {entry.name} ({entry.value})
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bottom Row - Recent Registrations List */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">Recent User Registrations</CardTitle>
                                <CardDescription className="text-xs">Last registered accounts on platform</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-text-secondary dark:text-secondary-400">
                                        <thead className="text-[10px] text-text-primary dark:text-secondary-200 uppercase border-b border-border dark:border-dark-border">
                                            <tr>
                                                <th className="pb-3 font-semibold">User Name</th>
                                                <th className="pb-3 font-semibold font-mono">Email Address</th>
                                                <th className="pb-3 font-semibold">System Role</th>
                                                <th className="pb-3 font-semibold">Department</th>
                                                <th className="pb-3 font-semibold">Registered</th>
                                                <th className="pb-3 font-semibold text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roleAnalytics?.recentRegistrations?.map((registered: any, idx: number) => (
                                                <tr key={idx} className="border-b border-border/50 dark:border-dark-border/40 hover:bg-slate-50 dark:hover:bg-dark-hover/10">
                                                    <td className="py-3 font-semibold text-text-primary dark:text-secondary-200">{registered.name}</td>
                                                    <td className="py-3 font-mono">{registered.email}</td>
                                                    <td className="py-3 capitalize">
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${registered.role === 'admin'
                                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                            : registered.role === 'faculty'
                                                                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            }`}>
                                                            {registered.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">{registered.department?.name || 'N/A'}</td>
                                                    <td className="py-3">{new Date(registered.createdAt).toLocaleDateString()}</td>
                                                    <td className="py-3 text-right">
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${registered.status === 'Active'
                                                            ? 'bg-emerald-500/10 text-emerald-400'
                                                            : 'bg-slate-500/10 text-slate-400'
                                                            }`}>
                                                            {registered.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            ) : (
                /* ========================================================
                   AI USAGE & INSIGHTS TAB (UNIVERSAL)
                   ======================================================== */
                <div className="space-y-6">
                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="glass-card hover-glow transition-all">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">AI Queries Total</p>
                                    <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                        <AnimatedCounter value={aiAnalytics?.totalAIRequests || 0} />
                                    </h3>
                                    <p className="text-xs text-text-secondary dark:text-secondary-400 mt-1">
                                        <AnimatedCounter value={aiAnalytics?.todayAIRequests || 0} /> chats generated today
                                    </p>
                                </div>
                                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                                    <Brain className="h-6 w-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card hover-glow transition-all">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">LLM Response Latency</p>
                                    <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                        <AnimatedCounter value={parseFloat(aiAnalytics?.averageResponseTime || '0')} decimals={2} suffix="s" />
                                    </h3>
                                    <p className="text-xs text-emerald-400 mt-1">
                                        Optimal response time
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                    <Clock className="h-6 w-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card hover-glow transition-all">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Avg Tokens/Request</p>
                                    <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                        <AnimatedCounter value={aiAnalytics?.averageTokensUsed || 0} />
                                    </h3>
                                    <p className="text-xs text-purple-400 mt-1">
                                        ~{(aiAnalytics?.averageTokensUsed * 0.75).toFixed(0)} words generated
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                                    <Zap className="h-6 w-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card hover-glow transition-all">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-text-secondary dark:text-secondary-500">Peak Usage Window</p>
                                    <h3 className="text-3xl font-bold font-display text-text-primary dark:text-secondary-100">
                                        {aiAnalytics?.peakUsageTime}
                                    </h3>
                                    <p className="text-xs text-text-secondary dark:text-secondary-400 mt-1">
                                        Top feature: {aiAnalytics?.topUsedAITool}
                                    </p>
                                </div>
                                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                                    <Calendar className="h-6 w-6" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* System Insight List Sidebar */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">System Log Insights</CardTitle>
                                <CardDescription className="text-xs">Database-derived intelligence</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {insightsData && insightsData.length > 0 ? (
                                        insightsData.map((insight: string, ix: number) => (
                                            <div key={ix} className="flex gap-3 items-center bg-slate-50 dark:bg-dark-card/30 p-3 rounded-lg border border-border/50 dark:border-dark-border/40">
                                                <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                                                <span className="text-xs text-text-secondary dark:text-secondary-300 font-medium leading-relaxed">{insight}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-xs text-text-secondary py-6">No historical records available.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Uploaded Subjects Radar / Bar chart */}
                        <Card className="glass-card lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">RAG Document Upload Activity</CardTitle>
                                <CardDescription className="text-xs">Unique subject syllabus materials indexed</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={aiAnalytics?.topUploadedSubjects || []}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/10" />
                                        <XAxis dataKey="subject" className="text-xs text-text-secondary dark:text-secondary-500" />
                                        <YAxis className="text-xs text-text-secondary dark:text-secondary-500" />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.90)', border: 'none', borderRadius: '8px' }} />
                                        <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} name="Uploaded Index Files">
                                            {aiAnalytics?.topUploadedSubjects?.map((_entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LLM Pipeline Health cards */}
                        <Card className="glass-card lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">RAG Semantic Query Rate</CardTitle>
                                <CardDescription className="text-xs">Document reference rate</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col justify-center h-[200px] space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-text-primary dark:text-secondary-200">Retrieval Precision (average chunk context success)</span>
                                    <span className="text-emerald-400 font-bold">{aiAnalytics?.successRate}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full">
                                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: aiAnalytics?.successRate || '98%' }} />
                                </div>
                                <div className="flex justify-between items-center text-xs pt-2">
                                    <span className="font-semibold text-text-secondary dark:text-secondary-400">Context Misses / Retrieval Fallbacks</span>
                                    <span className="text-slate-400 font-bold">{aiAnalytics?.failureRate}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full">
                                    <div className="bg-slate-500 h-2.5 rounded-full" style={{ width: aiAnalytics?.failureRate || '2%' }} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-text-primary dark:text-secondary-200">Average Sources Queried</CardTitle>
                                <CardDescription className="text-xs">Context reference counts per prompt session</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center h-[200px]">
                                <div className="text-center space-y-2">
                                    <div className="relative inline-flex items-center justify-center">
                                        <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                                            <span className="text-3xl font-extrabold text-indigo-400">{aiAnalytics?.averageDocumentsQueried || 2.1}</span>
                                        </div>
                                        <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-indigo-500/40 border-b-transparent border-l-transparent rounded-full animate-spin [animation-duration:3s]" />
                                    </div>
                                    <p className="text-xs text-text-secondary dark:text-secondary-400 font-medium">Reference docs / query</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AnalyticsDashboardPage;
