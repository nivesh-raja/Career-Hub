import React, { useState } from 'react';
import { Sparkles, FileText, Download, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api.js';
import { exportToTxt, exportToMarkdown, exportToDocx, exportToPdf } from '../../utils/exportHelper.js';

interface NotesWorkshopProps {
    onGenerationSuccess: () => void;
    onViewItem?: any;
}

export const NotesWorkshop: React.FC<NotesWorkshopProps> = ({ onGenerationSuccess, onViewItem }) => {
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [topic, setTopic] = useState('');
    const [noteType, setNoteType] = useState<'short' | 'detailed' | 'revision' | 'bullet' | 'examprep'>('detailed');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedNotes, setGeneratedNotes] = useState<any>(onViewItem || null);

    React.useEffect(() => {
        if (onViewItem) {
            setGeneratedNotes(onViewItem);
        }
    }, [onViewItem]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsLoading(true);
        try {
            const { data } = await api.post('/ai/notes', {
                subject: subject.trim(),
                chapter: chapter.trim(),
                topic: topic.trim(),
                noteType
            });
            setGeneratedNotes(data.notes);
            onGenerationSuccess();
        } catch (err) {
            alert('Failed to generate notes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (format: 'txt' | 'md' | 'doc' | 'pdf') => {
        if (!generatedNotes) return;
        const { title, content } = generatedNotes;

        if (format === 'txt') {
            exportToTxt(title, content);
        } else if (format === 'md') {
            exportToMarkdown(title, content);
        } else if (format === 'doc') {
            exportToDocx(title, `<div style="font-family: sans-serif; white-space: pre-wrap;">${content}</div>`);
        } else if (format === 'pdf') {
            exportToPdf(title, `<div style="white-space: pre-wrap;">${content}</div>`);
        }
    };

    const toggleBookmark = async () => {
        if (!generatedNotes) return;
        try {
            const { data } = await api.put(`/ai/saved-items/notes/${generatedNotes._id}`, {
                isBookmarked: !generatedNotes.isBookmarked
            });
            setGeneratedNotes(data.item);
            onGenerationSuccess();
        } catch (e) {
            console.error('Bookmark update failed');
        }
    };

    const sourceDocs = generatedNotes?.sourceDocuments || [];
    const hasRAG = sourceDocs.length > 0 && !sourceDocs.includes('General AI Knowledge');

    return (
        <div className="space-y-6">
            {!onViewItem && !generatedNotes && (
                <form onSubmit={handleGenerate} className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-subtle space-y-4">
                    <div className="flex items-center gap-2 border-b border-border dark:border-dark-border pb-3">
                        <Sparkles className="h-5 w-5 text-primary dark:text-amber-500" />
                        <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-100">AI Notes Generator</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Subject Name</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-400"
                                placeholder="e.g. Operating Systems"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Chapter / Unit</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-400"
                                placeholder="e.g. Chapter 2: Process Management"
                                value={chapter}
                                onChange={(e) => setChapter(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Topic / Keywords *</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-400"
                            placeholder="e.g. Semaphores and Mutex Locks key mechanics"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Notes Format Style</label>
                        <select
                            className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100"
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value as any)}
                        >
                            <option value="detailed">Comprehensive Detailed Notes Planning</option>
                            <option value="short">Short Concise Notes Quick Summary</option>
                            <option value="revision">Cheat Sheet / Revision Notes Focus</option>
                            <option value="bullet">Bullet Points Outline Guide</option>
                            <option value="examprep">Exam Prep QA Structured Notes</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-subtle disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                Analyzing context papers & composing notes...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate AI Notes
                            </>
                        )}
                    </button>
                </form>
            )}

            {generatedNotes && (
                <div className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border dark:border-dark-border pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary dark:text-amber-500" />
                                <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-150">{generatedNotes.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className="text-[10px] bg-primary/10 text-primary dark:text-amber-400 px-2 py-0.5 rounded-full font-medium uppercase">{generatedNotes.noteType}</span>
                                {hasRAG ? (
                                    <span className="text-[10px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-450 border border-green-200 dark:border-green-905 px-2 py-0.5 rounded-full font-semibold">
                                        📄 Source Documents: {sourceDocs.join(', ')}
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-gray-100 dark:bg-dark-surface text-slate-500 dark:text-secondary-400 px-2 py-0.5 rounded-full font-semibold border border-transparent">
                                        🌐 General AI Knowledge
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={toggleBookmark}
                                className={`p-2 rounded-lg border transition-all ${generatedNotes.isBookmarked ? 'bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/20 dark:border-amber-900/30' : 'border-border dark:border-dark-border hover:bg-slate-100 hover:text-primary text-slate-400'}`}
                                title={generatedNotes.isBookmarked ? "Bookmarked" : "Bookmark Notes"}
                            >
                                <Bookmark className="h-4 w-4" fill={generatedNotes.isBookmarked ? "currentColor" : "none"} />
                            </button>

                            <div className="relative group">
                                <button className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-subtle">
                                    <Download className="h-3.5 w-3.5" /> Export Notes
                                </button>
                                <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg shadow-elevated py-1 hidden group-hover:block z-20">
                                    <button onClick={() => handleDownload('md')} className="w-full text-left text-xs px-3 py-2 text-text-primary dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-dark-hover">Markdown (.md)</button>
                                    <button onClick={() => handleDownload('txt')} className="w-full text-left text-xs px-3 py-2 text-text-primary dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-dark-hover">Text file (.txt)</button>
                                    <button onClick={() => handleDownload('doc')} className="w-full text-left text-xs px-3 py-2 text-text-primary dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-dark-hover">Word document (.doc)</button>
                                    <button onClick={() => handleDownload('pdf')} className="w-full text-left text-xs px-3 py-2 text-text-primary dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-dark-hover">Print / PDF (.pdf)</button>
                                </div>
                            </div>

                            {onViewItem && (
                                <button
                                    onClick={() => setGeneratedNotes(null)}
                                    className="border border-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-text-secondary dark:text-gray-300 text-xs px-3 py-2 rounded-lg"
                                >
                                    Clear View
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-text-primary dark:text-gray-200 bg-slate-50/50 dark:bg-dark-surface/40 p-4 sm:p-6 rounded-lg border border-border dark:border-dark-border max-h-[60vh] overflow-y-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedNotes.content}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};
