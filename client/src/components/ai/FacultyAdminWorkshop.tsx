import React, { useState } from 'react';
import { Sparkles, ScrollText, Download, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api.js';
import { exportToPdf } from '../../utils/exportHelper.js';

interface FacultyAdminWorkshopProps {
    role: 'student' | 'faculty' | 'admin';
    onGenerationSuccess: () => void;
    onViewItem?: any;
    preferredTool?: string;
}

export const FacultyAdminWorkshop: React.FC<FacultyAdminWorkshopProps> = ({ onGenerationSuccess, onViewItem, preferredTool }) => {
    // Selection state: covers all Faculty and Admin tools
    const [selectedTool, setSelectedTool] = useState<string>((preferredTool as any) || 'paper-gen');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedArtifact, setGeneratedArtifact] = useState<any>(onViewItem || null);

    // Form states
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    // Assignment gen specific
    const [assignmentType, setAssignmentType] = useState('homework');

    // Question Paper Gen specific
    const [examType, setExamType] = useState('semester');
    const [bloomTaxonomy, setBloomTaxonomy] = useState('Apply');
    const [qTypes] = useState<string[]>(['2 Marks', '5 Marks', '10 Marks']);

    // Lesson Plan specific
    const [semester, setSemester] = useState('1');
    const [lessonTopics, setLessonTopics] = useState('');
    const [duration, setDuration] = useState('12 weeks');

    // Notice/General prompt details
    const [noticeType, setNoticeType] = useState('notice');
    const [noticeBrief, setNoticeBrief] = useState('');

    React.useEffect(() => {
        if (onViewItem) {
            setGeneratedArtifact(onViewItem);
            const col = onViewItem.collectionType || '';
            if (col === 'question-papers') setSelectedTool('paper-gen');
            else if (col === 'assignments') setSelectedTool('assignment-gen');
            else if (col === 'lesson-plans') setSelectedTool('lesson-plan');
            else if (col === 'notices') setSelectedTool('notice-report');
        }
        if (preferredTool) {
            setSelectedTool(preferredTool);
        }
    }, [onViewItem, preferredTool]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Check roles and trigger respective endpoint
            if (selectedTool === 'paper-gen') {
                if (!subject) throw new Error('Subject is required');
                const { data } = await api.post('/ai/question-paper', {
                    subject: subject.trim(),
                    examType,
                    difficulty,
                    bloomTaxonomy,
                    questionTypes: qTypes
                });
                setGeneratedArtifact({ ...data.questionPaper, collectionType: 'question-papers' });
            } else if (selectedTool === 'assignment-gen') {
                if (!subject || !topic) throw new Error('Subject and topic are required');
                const { data } = await api.post('/ai/assignment', {
                    mode: 'faculty',
                    subject: subject.trim(),
                    topic: topic.trim(),
                    assignmentType,
                    difficulty
                });
                setGeneratedArtifact({ ...data.assignment, collectionType: 'assignments' });
            } else if (selectedTool === 'lesson-plan') {
                if (!subject || !lessonTopics || !duration) throw new Error('Subject, topics and duration are required');
                const parsedTopics = lessonTopics.split(',').map(s => s.trim()).filter(Boolean);
                const { data } = await api.post('/ai/lesson-plan', {
                    subject: subject.trim(),
                    semester,
                    topics: parsedTopics,
                    duration: duration.trim()
                });
                setGeneratedArtifact({ ...data.lessonPlan, collectionType: 'lesson-plans' });
            } else if (selectedTool === 'study-material-gen') {
                if (!subject || !topic) throw new Error('Subject and topic are required');
                const { data } = await api.post('/ai/study-material', { subject: subject.trim(), topic: topic.trim(), difficulty });
                setGeneratedArtifact({ ...data.notes, collectionType: 'notes' });
            } else if (selectedTool === 'rubric-builder') {
                if (!subject || !topic) throw new Error('Subject and topic/assignment details are required');
                const { data } = await api.post('/ai/rubric', { subject: subject.trim(), topic: topic.trim() });
                setGeneratedArtifact({ ...data.notes, collectionType: 'notes' });
            } else if (selectedTool === 'classroom-ai') {
                if (!noticeBrief) throw new Error('Details/Topic is required');
                const { data } = await api.post('/ai/classroom-assistant', { topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notes, collectionType: 'notes' });
            } else if (selectedTool === 'student-summary') {
                const { data } = await api.post('/ai/performance-summary', { classroomId: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notes, collectionType: 'notes' });
            } else if (selectedTool === 'announcement-gen') {
                if (!noticeBrief) throw new Error('Announcement topic details are required');
                const { data } = await api.post('/ai/announcement', { topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'notice-report') {
                if (!noticeBrief) throw new Error('Notice description details are required');
                const { data } = await api.post('/ai/notice-report', { type: noticeType, topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'circular-gen') {
                if (!noticeBrief) throw new Error('Circular specifications are required');
                const { data } = await api.post('/ai/notice-report', { type: 'circular', topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'email-gen') {
                if (!noticeBrief) throw new Error('Email details are required');
                const { data } = await api.post('/ai/notice-report', { type: 'email', topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'academic-report-gen') {
                const { data } = await api.post('/ai/notice-report', { type: 'report_academic', topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'semester-reports') {
                const { data } = await api.post('/ai/notice-report', { type: 'report_sem', topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'dept-reports') {
                const { data } = await api.post('/ai/notice-report', { type: 'report_dept', topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'dept-analytics') {
                const { data } = await api.post('/ai/dept-analytics', { topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'user-activity-sum') {
                const { data } = await api.post('/ai/user-activity-sum', { topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'policy-gen') {
                if (!noticeBrief) throw new Error('Policy topic details are required');
                const { data } = await api.post('/ai/policy-gen', { topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'dashboard-insights') {
                const { data } = await api.post('/ai/dashboard-insights', { topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            } else if (selectedTool === 'institution-stats') {
                const { data } = await api.post('/ai/institution-stats', { topic: noticeBrief.trim() });
                setGeneratedArtifact({ ...data.notice, collectionType: 'notices' });
            }

            onGenerationSuccess();
        } catch (err: any) {
            alert(err.message || 'Generation failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBookmark = async () => {
        if (!generatedArtifact) return;
        const col = generatedArtifact.collectionType;
        try {
            const { data } = await api.put(`/ai/saved-items/${col}/${generatedArtifact._id}`, {
                isBookmarked: !generatedArtifact.isBookmarked
            });
            setGeneratedArtifact({ ...data.item, collectionType: col });
            onGenerationSuccess();
        } catch (e) {
            console.error('Bookmark update failed');
        }
    };

    const sourceDocs = generatedArtifact?.sourceDocuments || [];
    const hasRAG = sourceDocs.length > 0 && !sourceDocs.includes('General AI Knowledge');
    const rawContent = generatedArtifact?.content || generatedArtifact?.weeklyPlan || '';

    // Human-friendly titles mapping
    const getToolTitle = (tool: string) => {
        switch (tool) {
            case 'paper-gen': return 'Question Paper Generator';
            case 'assignment-gen': return 'Course Assignment Creator';
            case 'lesson-plan': return 'Class Lesson Planner';
            case 'study-material-gen': return 'Study Material Generator';
            case 'rubric-builder': return 'Grading Rubric Builder';
            case 'classroom-ai': return 'Classroom AI Assistant';
            case 'student-summary': return 'Student Performance Summary';
            case 'announcement-gen': return 'AI Announcement Generator';
            case 'circular-gen': return 'Official Circular Generator';
            case 'email-gen': return 'Official Email Writer';
            case 'academic-report-gen': return 'Academic Report Generator';
            case 'semester-reports': return 'Semester Exam Performance Report';
            case 'dept-reports': return 'Departmental Evaluation Report';
            case 'dept-analytics': return 'Admissions / HOD Departmental Analytics';
            case 'user-activity-sum': return 'User Activity Log & Portal Audit';
            case 'policy-gen': return 'Campus AI Policy Drafter';
            case 'dashboard-insights': return 'Executive System Insights';
            case 'institution-stats': return 'Institutional Accreditations Board Desk';
            default: return 'Administrative Forms Console';
        }
    };

    return (
        <div className="space-y-6">
            {!onViewItem && !generatedArtifact && (
                <form onSubmit={handleGenerate} className="bg-slate-900/90 p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <ScrollText className="h-5 w-5 text-amber-500" />
                        <h3 className="font-bold text-lg text-white">
                            {getToolTitle(selectedTool)}
                        </h3>
                    </div>

                    {/* Class/Subject parameter tools */}
                    {(selectedTool === 'paper-gen' || selectedTool === 'assignment-gen' || selectedTool === 'lesson-plan' || selectedTool === 'study-material-gen' || selectedTool === 'rubric-builder') ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Subject Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white placeholder:text-slate-600"
                                    placeholder="e.g. Distributed Systems"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            {selectedTool === 'paper-gen' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Exam Type</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white"
                                        value={examType}
                                        onChange={(e) => setExamType(e.target.value)}
                                    >
                                        <option value="semester">End Semester Examination</option>
                                        <option value="internal">Mid-term Internal Assessment</option>
                                        <option value="lab">Practical Lab Exam</option>
                                    </select>
                                </div>
                            )}

                            {(selectedTool === 'assignment-gen' || selectedTool === 'study-material-gen' || selectedTool === 'rubric-builder') && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Topic details *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white placeholder:text-slate-600"
                                        placeholder="e.g. MapReduce consensus, database replication, or assignment title"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                    />
                                </div>
                            )}

                            {selectedTool === 'lesson-plan' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Target Semester</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white"
                                        value={semester}
                                        onChange={(e) => setSemester(e.target.value)}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <option key={s} value={String(s)}>Semester {s}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* Advanced specific fields */}
                    {selectedTool === 'paper-gen' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Difficulty Level</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as any)}
                                >
                                    <option value="easy">Easy (Concept Recalls)</option>
                                    <option value="medium">Medium (Analytical Balance)</option>
                                    <option value="hard">Hard (Advanced Solutions)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Bloom's Taxonomy Level</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white"
                                    value={bloomTaxonomy}
                                    onChange={(e) => setBloomTaxonomy(e.target.value)}
                                >
                                    <option value="Remember">Remember & Recall</option>
                                    <option value="Understand">Understand & Explain</option>
                                    <option value="Apply">Apply & Execute</option>
                                    <option value="Analyze">Analyze & Correlate</option>
                                    <option value="Evaluate">Evaluate & Rate</option>
                                    <option value="Create">Create & Synthesize</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {(selectedTool === 'assignment-gen' || selectedTool === 'study-material-gen') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedTool === 'assignment-gen' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Assignment Type</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white"
                                        value={assignmentType}
                                        onChange={(e) => setAssignmentType(e.target.value)}
                                    >
                                        <option value="homework">Homework Practice Sheet</option>
                                        <option value="programming">Programming Practical Task</option>
                                        <option value="theory">Theoretical Essay Questions</option>
                                        <option value="miniproject">Mini Project Rubrics Specification</option>
                                        <option value="lab">Lab Examination Exercise</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Difficulty Level</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as any)}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {selectedTool === 'lesson-plan' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Lesson topics comma list *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white placeholder:text-slate-600"
                                    placeholder="Vector clocks, Bully algorithm, Raft consensus"
                                    value={lessonTopics}
                                    onChange={(e) => setLessonTopics(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Total Duration / Semester Hours *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white placeholder:text-slate-600"
                                    placeholder="e.g. 12 weeks or 45 lectures"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Notice/Reports Prompt Text Area input fields */}
                    {!(selectedTool === 'paper-gen' || selectedTool === 'assignment-gen' || selectedTool === 'lesson-plan' || selectedTool === 'study-material-gen' || selectedTool === 'rubric-builder') && (
                        <div className="space-y-4">
                            {selectedTool === 'notice-report' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Template Target Type</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white"
                                            value={noticeType}
                                            onChange={(e) => setNoticeType(e.target.value)}
                                        >
                                            <option value="notice">Campus Bulletin Notice Board</option>
                                            <option value="circular">Academic Board Senate Circular</option>
                                            <option value="email">Professional Department Email</option>
                                            <option value="report_academic">Dean Yearly Progress Audit</option>
                                            <option value="report_dept">HOD Department Performance Summary</option>
                                            <option value="report_sem">Semester Examination Statistics Report</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end text-xs text-amber-500 font-bold mb-2">⭐ High contrast institutional formatting applied</div>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Describe details or topic prompts *</label>
                                <textarea
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-white placeholder:text-slate-600 h-28 resize-none"
                                    placeholder="Describe specific details for the generator e.g. details of the policy, performance metrics, announcement topic, audit period..."
                                    value={noticeBrief}
                                    onChange={(e) => setNoticeBrief(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-lg hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                                Processing dynamic parameters ...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Compile & Generate Dynamic Asset
                            </>
                        )}
                    </button>
                </form>
            )}

            {generatedArtifact && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                        <div>
                            <h3 className="font-bold text-lg text-white">{generatedArtifact.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className="text-[10px] bg-amber-500/10 text-amber-550 border border-amber-500/25 px-2 py-0.5 rounded-md font-bold uppercase">{generatedArtifact.collectionType}</span>
                                {hasRAG ? (
                                    <span className="text-[10px] bg-green-950/40 text-green-400 border border-green-900/30 px-2 py-0.5 rounded-md font-semibold">
                                        📄 Sources: {sourceDocs.join(', ')}
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-850 px-2 py-0.5 rounded-md font-semibold">
                                        🌐 General AI Intelligence
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={toggleBookmark}
                                className={`p-2 rounded-lg border transition-all ${generatedArtifact.isBookmarked ? 'bg-amber-950/30 border-amber-500/50 text-amber-450' : 'border-slate-800 text-slate-500 hover:text-white'}`}
                                title={generatedArtifact.isBookmarked ? "Bookmarked" : "Bookmark item"}
                            >
                                <Bookmark className="h-4 w-4" fill={generatedArtifact.isBookmarked ? "currentColor" : "none"} />
                            </button>

                            <button
                                onClick={() => exportToPdf(generatedArtifact.title, `<div style="white-space: pre-wrap; font-family: sans-serif; color: #333;">${rawContent}</div>`)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                            >
                                <Download className="h-3.5 w-3.5" /> PDF
                            </button>

                            {onViewItem && (
                                <button
                                    onClick={() => setGeneratedArtifact(null)}
                                    className="border border-slate-800 text-slate-400 hover:text-white text-xs px-3 py-2 rounded-lg"
                                >
                                    Close View
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-200 bg-slate-950 p-6 rounded-lg border border-slate-850 max-h-[50vh] overflow-y-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{rawContent}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};
