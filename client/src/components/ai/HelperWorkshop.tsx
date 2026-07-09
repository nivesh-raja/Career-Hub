import React, { useState } from 'react';
import { Sparkles, GraduationCap, Download, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api.js';
import { exportToMarkdown } from '../../utils/exportHelper.js';

interface HelperWorkshopProps {
    onGenerationSuccess: () => void;
    onViewItem?: any;
}

export const HelperWorkshop: React.FC<HelperWorkshopProps> = ({ onGenerationSuccess, onViewItem }) => {
    const [assignmentText, setAssignmentText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [helperDoc, setHelperDoc] = useState<any>(onViewItem || null);

    React.useEffect(() => {
        if (onViewItem) {
            setHelperDoc(onViewItem);
        }
    }, [onViewItem]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignmentText.trim()) return;

        setIsLoading(true);
        try {
            const { data } = await api.post('/ai/assignment', {
                mode: 'helper',
                assignmentText: assignmentText.trim()
            });
            setHelperDoc(data.assignment);
            onGenerationSuccess();
        } catch (err) {
            alert('Failed to analyze assignment description.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBookmark = async () => {
        if (!helperDoc) return;
        try {
            const { data } = await api.put(`/ai/saved-items/assignments/${helperDoc._id}`, {
                isBookmarked: !helperDoc.isBookmarked
            });
            setHelperDoc(data.item);
            onGenerationSuccess();
        } catch (e) {
            console.error('Bookmark update failed');
        }
    };

    const sourceDocs = helperDoc?.sourceDocuments || [];
    const hasRAG = sourceDocs.length > 0 && !sourceDocs.includes('General AI Knowledge');

    return (
        <div className="space-y-6">
            {!onViewItem && !helperDoc && (
                <form onSubmit={handleGenerate} className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-subtle space-y-4">
                    <div className="flex items-center gap-2 border-b border-border dark:border-dark-border pb-3">
                        <GraduationCap className="h-5 w-5 text-primary dark:text-amber-500" />
                        <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-100">AI Assignment Helper</h3>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Paste Your Assignment Prompt / Instructions *</label>
                        <textarea
                            required
                            className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-400 h-32 resize-y"
                            placeholder="e.g. Implement a multi-threaded web server in Java that handles concurrent HTTP request sockets and logs processing speed in milliseconds. Detail step-by-step layout."
                            value={assignmentText}
                            onChange={(e) => setAssignmentText(e.target.value)}
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
                                Analyzing requirements & planning programming templates...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate Guide Roadmap
                            </>
                        )}
                    </button>
                </form>
            )}

            {helperDoc && (
                <div className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border dark:border-dark-border pb-4">
                        <div>
                            <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-100">{helperDoc.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className="text-[10px] bg-primary/10 text-primary dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">Assignment Helper</span>
                                {hasRAG ? (
                                    <span className="text-[10px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-450 px-2 py-0.5 rounded-full font-semibold border border-green-200 dark:border-green-900/30">
                                        📄 Context Docs: {sourceDocs.join(', ')}
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-gray-100 dark:bg-dark-surface text-slate-500 dark:text-secondary-400 px-2 py-0.5 rounded-full font-semibold">
                                        🌐 General AI Knowledge
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={toggleBookmark}
                                className={`p-2 rounded-lg border transition-all ${helperDoc.isBookmarked ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/20 dark:border-amber-900/30' : 'border-border dark:border-dark-border hover:bg-slate-100 hover:text-primary text-slate-400'}`}
                                title={helperDoc.isBookmarked ? "Bookmarked" : "Bookmark Helper Guide"}
                            >
                                <Bookmark className="h-4 w-4" fill={helperDoc.isBookmarked ? "currentColor" : "none"} />
                            </button>

                            <button
                                onClick={() => exportToMarkdown(helperDoc.title, helperDoc.content)}
                                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-subtle"
                            >
                                <Download className="h-3.5 w-3.5" /> Export Guide
                            </button>

                            {onViewItem && (
                                <button
                                    onClick={() => setHelperDoc(null)}
                                    className="border border-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-text-secondary dark:text-gray-300 text-xs px-3 py-2 rounded-lg"
                                >
                                    Close View
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-text-primary dark:text-gray-200 bg-slate-50/50 dark:bg-dark-surface/40 p-5 rounded-lg border border-border dark:border-dark-border max-h-[55vh] overflow-y-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{helperDoc.content}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};
