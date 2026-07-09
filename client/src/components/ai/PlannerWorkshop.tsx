import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, AlertTriangle, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api.js';

interface PlannerWorkshopProps {
    onGenerationSuccess: () => void;
    onViewItem?: any;
}

export const PlannerWorkshop: React.FC<PlannerWorkshopProps> = ({ onGenerationSuccess, onViewItem }) => {
    const [examDate, setExamDate] = useState('');
    const [subjectInput, setSubjectInput] = useState('');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [dailyStudyHours, setDailyStudyHours] = useState(4);
    const [currentProgress, setCurrentProgress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState<any>(onViewItem || null);

    const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly' | 'revision' | 'analysis'>('daily');

    React.useEffect(() => {
        if (onViewItem) {
            setPlan(onViewItem);
        }
    }, [onViewItem]);

    const addSubject = () => {
        if (!subjectInput.trim()) return;
        setSubjects([...subjects, subjectInput.trim()]);
        setSubjectInput('');
    };

    const removeSubject = (index: number) => {
        setSubjects(subjects.filter((_, idx) => idx !== index));
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (subjects.length === 0 || !examDate) {
            alert('Please select exam date and add at least one subject.');
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await api.post('/ai/study-plan', {
                examDate,
                subjects,
                dailyStudyHours,
                currentProgress: currentProgress.trim()
            });
            setPlan(data.studyPlan);
            onGenerationSuccess();
        } catch (err) {
            alert('Failed to generate study planner.');
        } finally {
            setIsLoading(false);
        }
    };

    const remainingDays = plan ? Math.ceil((new Date(plan.examDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

    return (
        <div className="space-y-6">
            {!onViewItem && !plan && (
                <form onSubmit={handleGenerate} className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-subtle space-y-4">
                    <div className="flex items-center gap-2 border-b border-border dark:border-dark-border pb-3">
                        <Calendar className="h-5 w-5 text-primary dark:text-amber-500" />
                        <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-100">AI Study Planner</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Exam Target Date *</label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Daily Study Hours Committed *</label>
                            <input
                                type="number"
                                required
                                min={1}
                                max={16}
                                className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100"
                                value={dailyStudyHours}
                                onChange={(e) => setDailyStudyHours(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Subjects tags list helper */}
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Target Subjects *</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-400"
                                placeholder="Add subject e.g. Data Structures"
                                value={subjectInput}
                                onChange={(e) => setSubjectInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                            />
                            <button
                                type="button"
                                onClick={addSubject}
                                className="bg-slate-100 dark:bg-dark-surface border border-border dark:border-dark-border text-slate-700 dark:text-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-slate-200"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        {subjects.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 bg-slate-50/30 p-2 border border-dashed border-border/60 rounded-md">
                                {subjects.map((sub, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1.5 text-[10px] bg-primary/10 text-primary dark:text-amber-500 font-semibold px-2 py-0.5 rounded-full">
                                        {sub}
                                        <button type="button" onClick={() => removeSubject(idx)} className="hover:text-red-500 font-bold">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Describe Current Progress / Goal Bounds (Optional)</label>
                        <textarea
                            className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-400 h-20 resize-none"
                            placeholder="e.g. Completed Chapter 1 and 2, but very weak in tree balancing and graphing math."
                            value={currentProgress}
                            onChange={(e) => setCurrentProgress(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-subtle disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                Analyzing exam span & generating optimal schedules...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate Custom Study Plan
                            </>
                        )}
                    </button>
                </form>
            )}

            {plan && (
                <div className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-card space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border dark:border-dark-border pb-4">
                        <div>
                            <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-100">{plan.title}</h3>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="text-[10px] bg-slate-100 dark:bg-dark-surface border border-border dark:border-dark-border px-2 py-0.5 rounded-full text-text-secondary dark:text-gray-300 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {plan.dailyStudyHours} hrs/day
                                </span>
                                <span className="text-[10px] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-2 py-0.5 rounded-full text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> {remainingDays > 0 ? `${remainingDays} days remaining` : 'Exam today/passed!'}
                                </span>
                            </div>
                        </div>

                        {onViewItem && (
                            <button
                                onClick={() => setPlan(null)}
                                className="border border-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-text-secondary dark:text-gray-300 text-xs px-3 py-2 rounded-lg"
                            >
                                Close View
                            </button>
                        )}
                    </div>

                    {/* Planner Sub navigation tabs */}
                    <div className="flex border-b border-border dark:border-dark-border gap-1 overflow-x-auto pb-1">
                        {[
                            { key: 'daily', label: 'Daily Strategy' },
                            { key: 'weekly', label: 'Weekly Milestones' },
                            { key: 'revision', label: 'Revision checkpoints' },
                            { key: 'analysis', label: 'Timeline Analysis' }
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setActiveSubTab(t.key as any)}
                                className={`text-xs px-3.5 py-1.5 font-semibold rounded-t-lg transition-all ${activeSubTab === t.key ? 'bg-primary text-white' : 'text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Plan contents view */}
                    <div className="bg-slate-50/50 dark:bg-dark-surface/40 p-5 rounded-lg border border-border dark:border-dark-border prose prose-slate dark:prose-invert max-w-none text-sm max-h-[50vh] overflow-y-auto leading-relaxed">
                        {activeSubTab === 'daily' && (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan.planData.dailyPlan}</ReactMarkdown>
                        )}
                        {activeSubTab === 'weekly' && (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan.planData.weeklyPlan}</ReactMarkdown>
                        )}
                        {activeSubTab === 'revision' && (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan.planData.revisionCalendar}</ReactMarkdown>
                        )}
                        {activeSubTab === 'analysis' && (
                            <div>
                                <h4 className="font-bold border-b border-border/30 pb-1 mb-2">Priority Topics to Focus:</h4>
                                <ul className="list-disc pl-4 space-y-1 mb-4">
                                    {(plan.planData.priorityTopics || []).map((t: string, idx: number) => (
                                        <li key={idx}>{t}</li>
                                    ))}
                                </ul>
                                <h4 className="font-bold border-b border-border/30 pb-1 mb-2">Remaining Study Span Analysis:</h4>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan.planData.remainingDaysAnalysis}</ReactMarkdown>
                                <h4 className="font-bold border-b border-border/30 pb-1 mt-4 mb-2">Self-check Progress Tracker:</h4>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plan.planData.progressTracker}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
