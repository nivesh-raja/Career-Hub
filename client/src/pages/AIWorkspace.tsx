import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, Trash2, Bot, User as UserIcon, RefreshCw, FileText, Sparkles, BookOpen, X, Library, Calendar, HelpCircle, GraduationCap, Bookmark, Star, Search, Layers, ScrollText, CheckCircle, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api.js';
import { cn } from '../utils/cn.js';
import { useAuth } from '../context/AuthContext.js';
import { NotesWorkshop } from '../components/ai/NotesWorkshop.js';
import { FlashcardWorkshop } from '../components/ai/FlashcardWorkshop.js';
import { QuizWorkshop } from '../components/ai/QuizWorkshop.js';
import { PlannerWorkshop } from '../components/ai/PlannerWorkshop.js';
import { HelperWorkshop } from '../components/ai/HelperWorkshop.js';
import { FacultyAdminWorkshop } from '../components/ai/FacultyAdminWorkshop.js';

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: string;
    intent?: string;
    data?: any;
    sourceDocuments?: string[];
}

interface AIDoc {
    _id: string;
    filename: string;
    fileSize?: number;
    totalChunks?: number;
    processingStatus: string;
    createdAt: string;
}

export const AIWorkspace: React.FC = () => {
    const { user } = useAuth();
    const role = user?.role || 'student';

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [documents, setDocuments] = useState<AIDoc[]>([]);

    // Sidebar navigation tabs: 'history' | 'docs' | 'library'
    const [activeTab, setActiveTab] = useState<'history' | 'docs' | 'library'>('library');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Main workspace view: 'chat' | 'productivity' | 'notes' | 'flashcards' | 'quiz' | 'planner' | 'helper' | 'faculty-tools'
    const [activeMainView, setActiveMainView] = useState<'chat' | 'productivity' | 'notes' | 'flashcards' | 'quiz' | 'planner' | 'helper' | 'faculty-tools'>('chat');
    const [prodTab, setProdTab] = useState<'student' | 'faculty' | 'admin' | 'history' | 'bookmarks' | 'templates' | 'activity'>(
        role === 'faculty' ? 'faculty' : role === 'admin' ? 'admin' : 'student'
    );

    // Faculty quick tool selector
    const [facultyPreferredTool, setFacultyPreferredTool] = useState<string>('paper-gen');

    // Library and search states
    const [libraryItems, setLibraryItems] = useState<any[]>([]);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [selectedLibraryItem, setSelectedLibraryItem] = useState<any>(null);

    useEffect(() => {
        fetchHistory();
        fetchDocuments();
        fetchLibrary();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/ai/history');
            setHistory(data.chats || []);
        } catch (e) { console.error(e); }
    };

    const fetchDocuments = async () => {
        try {
            const { data } = await api.get('/ai/documents');
            setDocuments(data.documents || []);
        } catch (e) { console.error(e); }
    };

    const fetchLibrary = async () => {
        try {
            const { data } = await api.get('/ai/saved-items');
            setLibraryItems(data.items || []);
        } catch (e) { console.error(e); }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!globalSearchQuery.trim()) {
            fetchLibrary();
            return;
        }
        try {
            const { data } = await api.get(`/ai/search?query=${encodeURIComponent(globalSearchQuery)}`);
            setLibraryItems(data.results || []);
        } catch (e) {
            console.error('Search failed');
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userText = inputValue.trim();
        setInputValue('');
        const newMessages: ChatMessage[] = [...messages, { id: Date.now().toString(), role: 'user', text: userText, timestamp: new Date().toISOString() }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const { data } = await api.post('/ai/chat', { prompt: userText });

            // If the chat route matched an intent, hook it up!
            if (data.intent && data.intent !== 'general-chat') {
                setMessages([...newMessages, {
                    id: Date.now().toString() + '_ai',
                    role: 'ai',
                    text: data.response,
                    timestamp: new Date().toISOString(),
                    intent: data.intent,
                    data: data.data,
                    sourceDocuments: data.sourceDocuments
                }]);
                fetchLibrary();
            } else {
                setMessages([...newMessages, {
                    id: Date.now().toString() + '_ai',
                    role: 'ai',
                    text: data.response,
                    timestamp: new Date().toISOString(),
                    sourceDocuments: data.sourceDocuments
                }]);
            }
            fetchHistory();
        } catch (err: any) {
            setMessages([...newMessages, { id: Date.now().toString() + '_err', role: 'ai', text: `Error: ${err?.response?.data?.message || 'Failed to connect to AI.'}`, timestamp: new Date().toISOString() }]);
        } finally {
            setIsTyping(false);
        }
    };

    const clearChat = () => setMessages([]);

    const handleOpenItemFromChat = (intent: string, doc: any) => {
        setSelectedLibraryItem(doc);
        if (intent === 'generate-notes') {
            setActiveMainView('notes');
        } else if (intent === 'generate-flashcards') {
            setActiveMainView('flashcards');
        } else if (intent === 'generate-quiz') {
            setActiveMainView('quiz');
        } else if (intent === 'generate-study-plan') {
            setActiveMainView('planner');
        } else if (intent === 'assignment-helper') {
            setActiveMainView('helper');
        } else {
            setActiveMainView('faculty-tools');
            if (intent === 'faculty-assignment-generator') setFacultyPreferredTool('assignment-gen');
            else if (intent === 'question-paper-generator') setFacultyPreferredTool('paper-gen');
            else if (intent === 'lesson-planner') setFacultyPreferredTool('lesson-plan');
            else if (intent === 'notice-report-generator') setFacultyPreferredTool('notice-report');
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/ai/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert(data.message || `Document "${file.name}" uploaded successfully!`);
            fetchDocuments();
            setActiveTab('docs');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to upload document.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteDoc = async (id: string, name: string) => {
        if (!window.confirm(`Delete "${name}"? This will remove all its AI context.`)) return;
        try {
            await api.delete(`/ai/documents/${id}`);
            fetchDocuments();
        } catch { alert('Failed to delete document.'); }
    };

    const handleRenameHistory = async (id: string, currentTitle: string) => {
        const newTitle = window.prompt('Enter new conversation title:', currentTitle);
        if (!newTitle?.trim()) return;
        try {
            await api.put(`/ai/history/${id}`, { title: newTitle });
            fetchHistory();
        } catch { console.error('Failed to rename'); }
    };

    const handleDeleteHistory = async (id: string) => {
        if (!window.confirm('Delete conversation?')) return;
        try {
            await api.delete(`/ai/history/${id}`);
            fetchHistory();
        } catch { console.error('Failed to delete'); }
    };

    // Library operations
    const handleToggleBookmark = async (col: string, id: string, currentVal: boolean) => {
        try {
            await api.put(`/ai/saved-items/${col}/${id}`, { isBookmarked: !currentVal });
            fetchLibrary();
        } catch (e) {
            console.error('Failed to update bookmark');
        }
    };

    const handleToggleFavorite = async (col: string, id: string, currentVal: boolean) => {
        try {
            await api.put(`/ai/saved-items/${col}/${id}`, { isFavorite: !currentVal });
            fetchLibrary();
        } catch (e) {
            console.error('Failed to update favorite');
        }
    };

    const handleDeleteLibraryItem = async (col: string, id: string, title: string) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/ai/saved-items/${col}/${id}`);
            fetchLibrary();
            if (selectedLibraryItem?._id === id) {
                setSelectedLibraryItem(null);
            }
        } catch {
            alert('Failed to delete library item.');
        }
    };

    const handleOpenLibraryItem = (item: any) => {
        setSelectedLibraryItem(item);
        const col = item.collectionType || '';

        if (col === 'notes') {
            setActiveMainView('notes');
        } else if (col === 'flashcards') {
            setActiveMainView('flashcards');
        } else if (col === 'quizzes') {
            setActiveMainView('quiz');
        } else if (col === 'study-plans') {
            setActiveMainView('planner');
        } else if (col === 'assignments') {
            // Note:assignments could be student helper or faculty generator.
            if (item.assignmentHelpText || !item.pointsRubric) {
                setActiveMainView('helper');
            } else {
                setActiveMainView('faculty-tools');
                setFacultyPreferredTool('assignment-gen');
            }
        } else if (col === 'question-papers') {
            setActiveMainView('faculty-tools');
            setFacultyPreferredTool('paper-gen');
        } else if (col === 'lesson-plans') {
            setActiveMainView('faculty-tools');
            setFacultyPreferredTool('lesson-plan');
        } else if (col === 'notices') {
            setActiveMainView('faculty-tools');
            setFacultyPreferredTool('notice-report');
        }
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-transparent gap-4 p-4 overflow-hidden select-none">
            {/* Left Sidebar Panel */}
            <div className="hidden lg:flex w-80 flex-col bg-white/60 dark:bg-dark-card/60 backdrop-blur-md rounded-xl shadow-subtle border border-border dark:border-dark-border overflow-hidden shrink-0">
                {/* Tabs switcher */}
                <div className="p-3 border-b border-border dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/50 flex items-center gap-1">
                    <button onClick={() => setActiveTab('library')} className={cn("flex-1 text-[11px] font-bold py-1.5 rounded-md transition-all flex items-center justify-center gap-1", activeTab === 'library' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover')}>
                        <Library className="h-3 w-3" /> Library
                    </button>
                    <button onClick={() => setActiveTab('history')} className={cn("flex-1 text-[11px] font-bold py-1.5 rounded-md transition-all flex items-center justify-center gap-1", activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover')}>
                        Chat History
                    </button>
                    <button onClick={() => setActiveTab('docs')} className={cn("flex-1 text-[11px] font-bold py-1.5 rounded-md transition-all flex items-center justify-center gap-1", activeTab === 'docs' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover')}>
                        <BookOpen className="h-3 w-3" /> Docs
                    </button>
                </div>

                {/* Tab content view */}
                <div className="flex-1 overflow-y-auto p-3">
                    {activeTab === 'library' && (
                        <div className="space-y-4 h-full flex flex-col">
                            {/* Search bar inside library */}
                            <form onSubmit={handleSearch} className="relative flex items-center shrink-0">
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-450"
                                    placeholder="Search library assets..."
                                    value={globalSearchQuery}
                                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="absolute left-2.5 text-slate-400">
                                    <Search className="h-3.5 w-3.5" />
                                </button>
                                {globalSearchQuery && (
                                    <button type="button" onClick={() => { setGlobalSearchQuery(''); fetchLibrary(); }} className="absolute right-2.5 text-slate-400 hover:text-red-500">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </form>

                            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-text-secondary dark:text-slate-400 mb-1">Your AI Academic Library</div>
                                {libraryItems.length === 0 ? (
                                    <div className="text-xs text-text-secondary dark:text-slate-500 italic py-4 text-center">No saved items. Use generator tools below to build assets.</div>
                                ) : (
                                    libraryItems.map((item) => {
                                        const col = item.collectionType || '';
                                        return (
                                            <div
                                                key={item._id}
                                                className={cn("group p-2.5 border rounded-lg transition-all cursor-pointer flex flex-col relative", selectedLibraryItem?._id === item._id ? 'border-primary bg-primary/5' : 'border-border dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/40 hover:bg-white dark:hover:bg-dark-surface')}
                                                onClick={() => handleOpenLibraryItem(item)}
                                            >
                                                <div className="flex justify-between items-start gap-1 pr-14 min-w-0">
                                                    <span className="text-[9px] bg-primary/10 text-primary dark:text-amber-500 font-bold px-1.5 py-0.5 rounded uppercase leading-none shrink-0 mt-0.5">{col}</span>
                                                    <span className="text-xs font-semibold text-text-primary dark:text-gray-150 truncate leading-snug">{item.title}</span>
                                                </div>
                                                <div className="text-[10px] text-text-secondary dark:text-slate-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</div>

                                                {/* Float controls on hover */}
                                                <div className="absolute right-1 top-2.5 hidden group-hover:flex items-center gap-0.5">
                                                    <button onClick={(e) => { e.stopPropagation(); handleToggleBookmark(col, item._id, item.isBookmarked); }} className="text-slate-450 hover:text-amber-500 p-1">
                                                        <Bookmark className="h-3 w-3" fill={item.isBookmarked ? "currentColor" : "none"} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(col, item._id, item.isFavorite); }} className="text-slate-455 hover:text-yellow-500 p-1">
                                                        <Star className="h-3 w-3" fill={item.isFavorite ? "currentColor" : "none"} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteLibraryItem(col, item._id, item.title); }} className="text-slate-400 hover:text-red-500 p-1">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <>
                            <div className="text-[10px] uppercase font-bold tracking-wider text-text-secondary dark:text-slate-400 mb-2">Interactions Logging</div>
                            {history.length === 0 ? (
                                <p className="text-xs text-text-secondary italic">No history yet.</p>
                            ) : (
                                history.map((hist) => (
                                    <div key={hist._id} className="group p-2 mb-1 rounded-md hover:bg-slate-50 dark:hover:bg-dark-hover/60 cursor-pointer text-sm border-l-2 border-transparent hover:border-primary transition-all relative">
                                        <p className="font-semibold text-text-primary dark:text-gray-200 pr-12 truncate text-xs">{hist.conversationTitle || hist.prompt}</p>
                                        <p className="text-[10px] text-text-secondary dark:text-slate-400">{new Date(hist.createdAt).toLocaleDateString()}</p>
                                        <div className="absolute right-1 top-2 hidden group-hover:flex gap-1">
                                            <button type="button" onClick={() => handleRenameHistory(hist._id, hist.conversationTitle)} className="text-slate-405 hover:text-primary p-0.5 rounded"><FileText className="h-3 ... w-3" /></button>
                                            <button type="button" onClick={() => handleDeleteHistory(hist._id)} className="text-slate-400 hover:text-red-500 p-0.5"><Trash2 className="h-3 w-3" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {activeTab === 'docs' && (
                        <>
                            <div className="text-[10px] uppercase font-bold tracking-wider text-text-secondary dark:text-slate-400 mb-2">Target Context Documents</div>
                            {documents.length === 0 ? (
                                <p className="text-xs text-text-secondary italic py-4 text-center">No documents uploaded. Attach a PDF, DOCX or TXT to activate RAG.</p>
                            ) : (
                                documents.map((doc) => (
                                    <div key={doc._id} className="group p-2.5 mb-2 rounded-lg border border-border dark:border-dark-border hover:border-primary transition-all bg-slate-50 dark:bg-dark-surface/40">
                                        <div className="flex items-start gap-2">
                                            <FileText className="h-4 w-4 text-primary dark:text-amber-500 shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-text-primary dark:text-gray-200 truncate pr-5" title={doc.filename}>{doc.filename}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-text-secondary dark:text-slate-450">{formatBytes(doc.fileSize)}</span>
                                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded-full", doc.processingStatus === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-amber-100 text-amber-700')}>
                                                        {doc.processingStatus}
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteDoc(doc._id, doc.filename)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 shrink-0">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>

                {/* Academic Quick generators bar bottom */}
                <div className="p-3 border-t border-border dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/50 grid grid-cols-2 gap-1.5 shrink-0">
                    {role === 'student' && (
                        <>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('notes'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'notes' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <FileText className="h-3.5 w-3.5" /> Study Notes
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('flashcards'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'flashcards' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <Layers className="h-3.5 w-3.5" /> Flashcards
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('quiz'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'quiz' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <HelpCircle className="h-3.5 w-3.5" /> Quiz Cards
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('planner'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'planner' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <Calendar className="h-3.5 w-3.5" /> Study Planner
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('helper'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all col-span-2", activeMainView === 'helper' ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <GraduationCap className="h-3.5 w-3.5" /> AI Assignment Helper
                            </button>
                        </>
                    )}

                    {role === 'faculty' && (
                        <>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('paper-gen'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'faculty-tools' && facultyPreferredTool === 'paper-gen' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <ScrollText className="h-3.5 w-3.5" /> Question Papers
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('assignment-gen'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'faculty-tools' && facultyPreferredTool === 'assignment-gen' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <GraduationCap className="h-3.5 w-3.5" /> Assignments
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('lesson-plan'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'faculty-tools' && facultyPreferredTool === 'lesson-plan' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <Calendar className="h-3.5 w-3.5" /> Lesson Planner
                            </button>

                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('announcement-gen'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all col-span-2", activeMainView === 'faculty-tools' && facultyPreferredTool === 'announcement-gen' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <Sparkles className="h-3.5 w-3.5" /> Announcements
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('study-material-gen'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all col-span-2", activeMainView === 'faculty-tools' && facultyPreferredTool === 'study-material-gen' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <BookOpen className="h-3.5 w-3.5" /> Study Material
                            </button>
                        </>
                    )}

                    {role === 'admin' && (
                        <>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('notice-report'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'faculty-tools' && facultyPreferredTool === 'notice-report' ? 'bg-red-650 text-white border-red-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <FileText className="h-3.5 w-3.5" /> Notice
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('circular-gen'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'faculty-tools' && facultyPreferredTool === 'circular-gen' ? 'bg-red-650 text-white border-red-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <ScrollText className="h-3.5 w-3.5" /> Circular
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('email-gen'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'faculty-tools' && facultyPreferredTool === 'email-gen' ? 'bg-red-650 text-white border-red-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-55 text-text-primary dark:text-gray-250')}
                            >
                                <FileText className="h-3.5 w-3.5" /> Emails
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('academic-report-gen'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all", activeMainView === 'faculty-tools' && facultyPreferredTool === 'academic-report-gen' ? 'bg-red-650 text-white border-red-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <BookOpen className="h-3.5 w-3.5" /> Reports
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('dept-analytics'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all col-span-2", activeMainView === 'faculty-tools' && facultyPreferredTool === 'dept-analytics' ? 'bg-red-650 text-white border-red-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <Activity className="h-3.5 w-3.5" /> Analytics
                            </button>
                            <button
                                onClick={() => { setSelectedLibraryItem(null); setActiveMainView('faculty-tools'); setFacultyPreferredTool('dashboard-insights'); }}
                                className={cn("text-[10px] font-bold py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 focus:outline-none transition-all col-span-2", activeMainView === 'faculty-tools' && facultyPreferredTool === 'dashboard-insights' ? 'bg-red-650 text-white border-red-600' : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:bg-slate-50 text-text-primary dark:text-gray-250')}
                            >
                                <Sparkles className="h-3.5 w-3.5" /> Institution Dashboard
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Interactive Center View */}
            <div className="flex-1 flex flex-col bg-white/70 dark:bg-dark-card/70 backdrop-blur-md rounded-xl shadow-subtle border border-border dark:border-dark-border overflow-hidden">
                {/* Top View Switcher Navigation Tab bar */}
                <div className="flex border-b border-border dark:border-dark-border bg-slate-50/60 dark:bg-dark-surface/50 p-2 shrink-0 gap-2 items-center flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2 mr-3 pl-2 border-r border-border dark:border-dark-border pr-3 shrink-0">
                        <Sparkles className={cn("h-4 w-4",
                            role === 'student' ? 'text-blue-500' :
                                role === 'faculty' ? 'text-amber-500' : 'text-red-500'
                        )} />
                        <span className="text-xs font-bold uppercase tracking-wider text-text-primary dark:text-gray-250">
                            {role === 'student' && 'Student AI Workspace'}
                            {role === 'faculty' && 'Faculty AI Workspace'}
                            {role === 'admin' && 'Admin AI Workspace'}
                        </span>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase shrink-0",
                            role === 'student' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                                role === 'faculty' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-450'
                        )}>
                            {role}
                        </span>
                    </div>

                    <button
                        onClick={() => { setActiveMainView('chat'); setSelectedLibraryItem(null); }}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200",
                            activeMainView === 'chat'
                                ? "bg-primary text-white shadow-sm"
                                : "text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover"
                        )}
                    >
                        <Bot className="h-4 w-4" /> AI Chat Copilot
                    </button>
                    <button
                        onClick={() => { setActiveMainView('productivity'); setSelectedLibraryItem(null); if (!prodTab) setProdTab(role === 'admin' ? 'admin' : (role === 'faculty' ? 'faculty' : 'student')); }}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200",
                            activeMainView === 'productivity'
                                ? "bg-primary text-white shadow-sm"
                                : "text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover"
                        )}
                    >
                        <Sparkles className="h-4 w-4" /> AI Productivity Suite
                    </button>
                    {activeMainView !== 'chat' && activeMainView !== 'productivity' && (
                        <div className="ml-auto flex items-center gap-2 pr-2">
                            <span className="text-[10px] uppercase font-bold text-text-secondary dark:text-slate-400">Tool: {activeMainView}</span>
                            <button
                                onClick={() => setActiveMainView('productivity')}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-dark-surface border border-border px-2 py-0.5 rounded text-text-primary dark:text-gray-200"
                            >
                                Back to Suite
                            </button>
                        </div>
                    )}
                </div>

                {/* Visual Viewport Routing */}
                {activeMainView === 'chat' ? (
                    /* Chat Core Console */
                    <>
                        <div className="p-4 border-b border-border dark:border-dark-border flex items-center justify-between bg-slate-50/40 dark:bg-dark-surface/40">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-primary" />
                                    <h2 className="font-semibold text-text-primary dark:text-gray-100 text-sm">AI Study Coordinator (RAG Enabled)</h2>
                                </div>
                                {documents.length > 0 && (
                                    <p className="text-[10px] text-green-600 dark:text-green-450 font-medium mt-0.5">✓ {documents.length} document{documents.length > 1 ? 's' : ''} in context</p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <label className={cn("px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-2 transition-all", isUploading ? 'bg-slate-205 dark:bg-dark-surface text-slate-500' : 'bg-primary/10 text-primary dark:text-amber-500 hover:bg-primary hover:text-white dark:hover:bg-amber-600')}>
                                    {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {isUploading ? 'Embedding...' : 'Upload Document'}
                                    <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.txt,.docx,.doc,.md" disabled={isUploading} />
                                </label>
                                <button onClick={clearChat} className="p-1.5 text-text-secondary dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all animate-none" title="Clear chat view">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Interactive Chat Log stream */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/20 dark:bg-dark-surface/20">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-85 select-none text-center">
                                    <Sparkles className="h-16 w-16 text-primary/20 dark:text-amber-500/20 mb-4" />
                                    <h3 className="text-xl font-serif font-bold text-text-primary dark:text-gray-150 mb-2">Classroom AI Workspace</h3>
                                    <p className="text-sm text-text-secondary dark:text-slate-400 max-w-md mb-4 leading-relaxed">
                                        Ask queries directly, or request academic items like: <br />
                                        <code className="text-xs bg-slate-100 dark:bg-dark-surface px-1.5 py-0.5 rounded font-mono text-primary border border-border">"Generate detailed notes on CPU Scheduler"</code>
                                    </p>
                                    {documents.length > 0 && (
                                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/30 rounded-lg px-4 py-2 text-xs text-green-700 dark:text-green-400 font-medium">
                                            ✓ {documents.length} document{documents.length > 1 ? 's' : ''} ready in context
                                        </div>
                                    )}
                                </div>
                            )}

                            {messages.map((m) => (
                                <div key={m.id} className={cn("flex gap-4 animate-none", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn("h-8 w-8 rounded-full shrink-0 flex items-center justify-center border", m.role === 'user' ? "bg-primary text-white border-primary" : "bg-white dark:bg-dark-surface text-primary dark:text-gray-250 border-border dark:border-dark-border shadow-sm")}>
                                        {m.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 shadow-subtle", m.role === 'user' ? "bg-primary text-white ml-8 rounded-tr-none" : "bg-white dark:bg-dark-surface border border-border dark:border-dark-border mr-8 rounded-tl-none text-text-primary dark:text-gray-100")}>
                                        {m.role === 'user' ? (
                                            <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                                        ) : (
                                            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-sm break-words leading-relaxed dark:text-gray-205">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>

                                                {/* Shortcut to generated tools item if intent matches */}
                                                {m.intent && m.data && (
                                                    <div className="mt-4 bg-slate-100/50 dark:bg-dark-card border border-border dark:border-dark-border/40 p-3 rounded-xl flex items-center justify-between gap-4">
                                                        <div>
                                                            <div className="text-[10px] uppercase font-bold text-text-secondary dark:text-slate-400">System generated block</div>
                                                            <div className="text-xs font-serif font-black text-text-primary dark:text-white truncate max-w-xs">{m.data.title || "Academic Asset"}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleOpenItemFromChat(m.intent!, m.data)}
                                                            className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
                                                        >
                                                            <CheckCircle className="h-3 w-3" /> Open in Viewer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mt-1 text-[9px] opacity-60">
                                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {m.sourceDocuments && m.sourceDocuments.length > 0 && (
                                                <span className="font-semibold text-primary dark:text-amber-400">📄 Sources: {m.sourceDocuments.join(', ')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-4 flex-row">
                                    <div className="h-8 w-8 rounded-full bg-white dark:bg-dark-surface text-primary dark:text-gray-250 border border-border dark:border-dark-border shadow-sm shrink-0 flex items-center justify-center">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl rounded-tl-none px-4 py-3 shadow-subtle flex items-center gap-1.5">
                                        <span className="text-xs text-text-secondary dark:text-slate-400">Thinking</span>
                                        <span className="animate-bounce text-primary text-sm">.</span>
                                        <span className="animate-bounce text-primary text-sm animate-delay-150" style={{ animationDelay: '150ms' }}>.</span>
                                        <span className="animate-bounce text-primary text-sm animate-delay-300" style={{ animationDelay: '300ms' }}>.</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Form bar */}
                        <div className="p-4 border-t border-border dark:border-dark-border bg-white/60 dark:bg-dark-card/60 shrink-0">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-full pl-5 pr-14 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-text-primary dark:text-gray-150"
                                    placeholder={documents.length > 0 ? "Ask about your uploaded records, or type: 'Generate quiz on page 5'..." : "Type query or requests here..."}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    disabled={isTyping}
                                />
                                <button
                                    type="submit"
                                    disabled={isTyping || !inputValue.trim()}
                                    className="absolute right-2.5 p-2 bg-primary text-white rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                            <div className="flex gap-2 justify-center mt-3 flex-wrap">
                                {['Generate Quiz on DBMS', 'Make study notes on Operating Systems', 'Help with Distributed homework', 'Lesson Plan for Networking'].map(s => (
                                    <button key={s} onClick={() => setInputValue(s)} className="text-[10px] text-text-secondary dark:text-slate-350 cursor-pointer hover:text-text-primary border border-border dark:border-dark-border bg-slate-50 dark:bg-dark-surface px-2.5 py-1 rounded-lg">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : activeMainView === 'productivity' ? (
                    /* AI Productivity Dashboard layout */
                    <div className="flex-1 flex overflow-hidden">
                        {/* Sub-Sidebar Navigation */}
                        <div className="w-56 border-r border-border dark:border-dark-border bg-slate-50/50 dark:bg-dark-surface/30 flex flex-col p-3 gap-1 overflow-y-auto shrink-0 select-none">
                            <div className="text-[9px] uppercase font-bold tracking-wider text-text-secondary/70 dark:text-slate-500 px-2 mb-2">AI Copilot OS</div>

                            {role === 'student' && (
                                <button
                                    onClick={() => setProdTab('student')}
                                    className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                                        prodTab === 'student'
                                            ? "bg-primary/10 text-primary dark:text-amber-500 font-bold"
                                            : "text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover"
                                    )}
                                >
                                    <GraduationCap className="h-4 w-4" /> Student AI
                                </button>
                            )}

                            {role === 'faculty' && (
                                <button
                                    onClick={() => setProdTab('faculty')}
                                    className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                                        prodTab === 'faculty'
                                            ? "bg-primary/10 text-primary dark:text-amber-500 font-bold"
                                            : "text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover"
                                    )}
                                >
                                    <FileText className="h-4 w-4" /> Faculty AI
                                </button>
                            )}

                            {role === 'admin' && (
                                <button
                                    onClick={() => setProdTab('admin')}
                                    className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                                        prodTab === 'admin'
                                            ? "bg-primary/10 text-primary dark:text-amber-500 font-bold"
                                            : "text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover"
                                    )}
                                >
                                    <ScrollText className="h-4 w-4" /> Admin AI
                                </button>
                            )}

                            <div className="border-t border-border dark:border-dark-border my-2"></div>
                            <div className="text-[9px] uppercase font-bold tracking-wider text-text-secondary/70 dark:text-slate-500 px-2 mb-2">Workspace & Data</div>

                            <button
                                onClick={() => setProdTab('history')}
                                className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                                    prodTab === 'history'
                                        ? "bg-primary/10 text-primary dark:text-amber-500 font-bold"
                                        : "text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover"
                                )}
                            >
                                <Bot className="h-4 w-4" /> History
                            </button>

                            <button
                                onClick={() => setProdTab('bookmarks')}
                                className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                                    prodTab === 'bookmarks'
                                        ? "bg-primary/10 text-primary dark:text-amber-500 font-bold"
                                        : "text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover"
                                )}
                            >
                                <Bookmark className="h-4 w-4" /> Bookmarks
                            </button>

                            <button
                                onClick={() => setProdTab('templates')}
                                className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                                    prodTab === 'templates'
                                        ? "bg-primary/10 text-primary dark:text-amber-500 font-bold"
                                        : "text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover"
                                )}
                            >
                                <Sparkles className="h-4 w-4" /> Templates
                            </button>

                            <button
                                onClick={() => setProdTab('activity')}
                                className={cn("w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
                                    prodTab === 'activity'
                                        ? "bg-primary/10 text-primary dark:text-amber-500 font-bold"
                                        : "text-text-secondary dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-dark-hover"
                                )}
                            >
                                <Activity className="h-4 w-4" /> Recent Activity
                            </button>
                        </div>

                        {/* Sub-content Area */}
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/20 dark:bg-dark-surface/10 select-text leading-relaxed">
                            {prodTab === 'student' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary dark:text-white">Student AI Productivity</h3>
                                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 font-serif">Accelerate learning using advanced RAG and customized agent setups.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Card 1: Notes */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-primary font-bold">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                    <h4 className="font-bold text-sm">Smart Notes Generator</h4>
                                                </div>
                                                <p className="text-xs leading-relaxed text-text-secondary dark:text-slate-400">
                                                    Synthesize clear study notes from files or subject topic inputs. Creates summaries, bullet guides, definitions, and core formulas.
                                                </p>
                                            </div>
                                            <button onClick={() => setActiveMainView('notes')} className="mt-4 w-full bg-primary hover:bg-primary-hover text-white text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all animate-none">
                                                Launch Notes Studio
                                            </button>
                                        </div>
                                        {/* Card 2: Flashcards */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-indigo-500 font-bold">
                                                    <Layers className="h-5 w-5 text-indigo-500" />
                                                    <h4 className="font-bold text-sm">Flashcard Studio</h4>
                                                </div>
                                                <p className="text-xs leading-relaxed text-text-secondary dark:text-slate-400">
                                                    Create customizable doublesided flashcard decks with smart shuffle, study progress tracking, and category tags.
                                                </p>
                                            </div>
                                            <button onClick={() => setActiveMainView('flashcards')} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all animate-none">
                                                Launch Flashcards
                                            </button>
                                        </div>
                                        {/* Card 3: Quiz */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-emerald-500 font-bold">
                                                    <HelpCircle className="h-5 w-5 text-emerald-500" />
                                                    <h4 className="font-bold text-sm">Quiz Studio</h4>
                                                </div>
                                                <p className="text-xs leading-relaxed text-text-secondary dark:text-slate-400">
                                                    Generate interactive assessments (MCQs, Fill Blanks, True/False) with deep answers keys, score sheets, and retry-incorrect loops.
                                                </p>
                                            </div>
                                            <button onClick={() => setActiveMainView('quiz')} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all animate-none">
                                                Launch Quiz Studio
                                            </button>
                                        </div>
                                        {/* Card 4: Planner */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-amber-500 font-bold">
                                                    <Calendar className="h-5 w-5 text-amber-600" />
                                                    <h4 className="font-bold text-sm">Study Planner</h4>
                                                </div>
                                                <p className="text-xs leading-relaxed text-text-secondary dark:text-slate-400">
                                                    Generate schedules and revision calendars using target timelines, weak topics, and daily homework commitment hours.
                                                </p>
                                            </div>
                                            <button onClick={() => setActiveMainView('planner')} className="mt-4 w-full bg-amber-600 hover:bg-primary-hover text-white text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all animate-none">
                                                Launch Study Planner
                                            </button>
                                        </div>
                                        {/* Card 5: Helper */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between md:col-span-2">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-rose-500 font-bold">
                                                    <GraduationCap className="h-5 w-5 text-rose-500" />
                                                    <h4 className="font-bold text-sm">Assignment Assistant</h4>
                                                </div>
                                                <p className="text-xs leading-relaxed text-text-secondary dark:text-slate-400">
                                                    Get explanation walks, algorithmic roadmaps, documentation links, and coding structure breakdowns for your assignments.
                                                </p>
                                            </div>
                                            <button onClick={() => setActiveMainView('helper')} className="mt-4 w-full bg-rose-600 hover:bg-rose-700 text-white text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all animate-none">
                                                Launch Assignment Helper
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {prodTab === 'faculty' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary dark:text-white">Faculty Academic Assistant Dashboard</h3>
                                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 font-serif">Generate high-quality testing materials, exercises, and teaching assets.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Card 1: Question Paper */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-500">Question Paper Gen</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Design comprehensive exam sheets (2/5/10/16 marks) configured with Bloom's Taxonomy tags and answers keys.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('paper-gen'); }} className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Generator
                                            </button>
                                        </div>
                                        {/* Card 2: Assignment Gen */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-500">Assignment Generator</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Write code challenges, case study scenarios, lab exercises, homework sheets, or mini project specifications.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('assignment-gen'); }} className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Generator
                                            </button>
                                        </div>
                                        {/* Card 3: Lesson Planner */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-500">Class Lesson Planner</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Formulate comprehensive core syllabus schedules, interactive learning outcomes, and assessment goals.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('lesson-plan'); }} className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Planner
                                            </button>
                                        </div>
                                        {/* Card 4: Study Material Gen */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-500">Study Material Gen</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Generate customized course handouts, summary summaries, key definitions, and academic study material guides.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('study-material-gen'); }} className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Generator
                                            </button>
                                        </div>

                                        {/* Card 6: Classroom Assistant */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-500">Classroom AI Assistant</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Obtain course guides, dynamic lecture talking points, standard FAQs lists, and outline suggestions.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('classroom-ai'); }} className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Assistant
                                            </button>
                                        </div>
                                        {/* Card 7: Student Performance Summary */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-500">Performance Summarizer</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Review marks datasets to generate qualitative student feedback, strengths, and warnings alerts.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('student-summary'); }} className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Summaries
                                            </button>
                                        </div>
                                        {/* Card 8: Announcements */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-amber-600 dark:text-amber-500">Announcement Generator</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Generate polite and structured email declarations, bulletin boards update warnings, or student notice templates.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('announcement-gen'); }} className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Generator
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {prodTab === 'admin' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary dark:text-white">Admin Management Generator Console</h3>
                                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 font-serif">Draft official notices, circulars, department emails, and administrative reports.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Card 1: Official Board Bulletins notice-report */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">Campus Notice Board</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Draft institutional announcements, notice board updates, calendar schedules, and official releases.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('notice-report'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Editor
                                            </button>
                                        </div>
                                        {/* Card 2: circular */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">Circular Generator</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Synthesize academic circular drafts, HOD memos, operational rules, directives, and policy reports.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('circular-gen'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Generator
                                            </button>
                                        </div>
                                        {/* Card 3: email */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">Professional Emails</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Generate administrative communication templates, corporate emails, and staff notification alerts.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('email-gen'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Editor
                                            </button>
                                        </div>
                                        {/* Card 4: academic assessment reports */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">Academic Progress Reports</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Generate Dean's academic audits, student enrolment feedback reports, and campus-grade metrics layouts.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('academic-report-gen'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Compiler
                                            </button>
                                        </div>
                                        {/* Card 5: dept analytics */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">Department Analytics</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Map admissions metrics, budget trends, and departmental evaluations into clean reports.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('dept-analytics'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Analytics
                                            </button>
                                        </div>
                                        {/* Card 6: User activity summary log */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">User Activity Audits</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Generate logs audit files summary, user login stats lists, and resource creation reports.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('user-activity-sum'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Audit Desk
                                            </button>
                                        </div>
                                        {/* Card 7: Policy draft gen */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">Campus Policy Drafter</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Create regulatory rules suggestions, AI/general campus compliance codes, and honor-code files.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('policy-gen'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Policy Gen
                                            </button>
                                        </div>
                                        {/* Card 8: Dashboard Insights summary */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">Executive Portal Insights</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Run AI summarizer over system-state databases to extract executive actions items and portal summaries.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('dashboard-insights'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Insights
                                            </button>
                                        </div>
                                        {/* Card 9: accreditation board summaries */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">institutional Statistics</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Build compliance folders reports, accreditation parameters checklists, and state stats summaries.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('institution-stats'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Builder
                                            </button>
                                        </div>
                                        {/* Card 10: Sem reports */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">Semester Exam Reports</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Draft exam evaluations, passing grade charts briefs, and semester-end audit pages.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('semester-reports'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Builder
                                            </button>
                                        </div>
                                        {/* Card 11: Department reports */}
                                        <div className="p-5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-xs hover:shadow transition-all flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-red-600 dark:text-red-500">Department Evaluation Reports</h4>
                                                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed">
                                                    Draft faculty allocations reviews, departmental strength summaries, and class assessment logs.
                                                </p>
                                            </div>
                                            <button onClick={() => { setActiveMainView('faculty-tools'); setFacultyPreferredTool('dept-reports'); }} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg font-semibold animate-none">
                                                Launch Builder
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {prodTab === 'history' && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary dark:text-white">Interaction Logging</h3>
                                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 font-serif">History of past AI chats and generator items.</p>
                                    </div>

                                    {history.length === 0 ? (
                                        <div className="text-xs text-text-secondary italic py-8 text-center bg-white dark:bg-dark-card rounded-xl border border-border dark:border-dark-border">
                                            No past conversations. Ask questions in the AI Chat Copilot to start logging.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {history.map((hist) => (
                                                <div key={hist._id} className="p-3 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg flex items-center justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-xs text-text-primary dark:text-gray-150 truncate opacity-90">{hist.conversationTitle || hist.prompt}</p>
                                                        <p className="text-[10px] text-text-secondary dark:text-slate-400 mt-1">{new Date(hist.createdAt).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex gap-1.5 shrink-0">
                                                        <button
                                                            onClick={() => handleRenameHistory(hist._id, hist.conversationTitle)}
                                                            className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-primary dark:text-gray-255 px-2 py-1 rounded transition-all animate-none"
                                                        >
                                                            Rename
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteHistory(hist._id)}
                                                            className="text-[10px] bg-red-100 hover:bg-red-200 dark:bg-red-950/40 text-red-655 px-2 py-1 rounded transition-all animate-none"
                                                        >
                                                            Delete
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setMessages([{
                                                                    id: hist._id,
                                                                    role: 'user',
                                                                    text: hist.prompt,
                                                                    timestamp: hist.createdAt
                                                                }, {
                                                                    id: hist._id + '_res',
                                                                    role: 'ai',
                                                                    text: hist.response,
                                                                    timestamp: hist.createdAt,
                                                                    sourceDocuments: hist.sourceDocuments
                                                                }]);
                                                                setActiveMainView('chat');
                                                            }}
                                                            className="text-[10px] bg-primary hover:bg-primary-hover text-white px-2.5 py-1 rounded transition-all font-semibold"
                                                        >
                                                            Resume Chat
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {prodTab === 'bookmarks' && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary dark:text-white">AI Bookmarked Creations</h3>
                                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 font-serif">Bookmarked notes, flashcard study decks, evaluations, and plans.</p>
                                    </div>

                                    {libraryItems.filter(item => item.isBookmarked || item.isFavorite).length === 0 ? (
                                        <div className="text-xs text-text-secondary italic py-8 text-center bg-white dark:bg-dark-card rounded-xl border border-border dark:border-dark-border">
                                            No bookmarked items. Toggle the bookmark icon on any item from the left library panel to save here.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {libraryItems.filter(item => item.isBookmarked || item.isFavorite).map((item) => (
                                                <div
                                                    key={item._id}
                                                    onClick={() => handleOpenLibraryItem(item)}
                                                    className="p-3.5 bg-white dark:bg-dark-card border border-primary/30 rounded-xl hover:border-primary transition-all cursor-pointer flex flex-col justify-between"
                                                >
                                                    <div>
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded uppercase leading-none">{item.collectionType}</span>
                                                            <span className="text-xs font-semibold text-text-primary dark:text-gray-150 truncate leading-snug">{item.title}</span>
                                                        </div>
                                                        <p className="text-[10px] text-text-secondary dark:text-slate-400 mt-1.5">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/30">
                                                        <span className="text-[10px] text-primary hover:underline">Click to view item</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleToggleBookmark(item.collectionType, item._id, item.isBookmarked); }}
                                                            className="text-amber-500 hover:text-slate-400"
                                                        >
                                                            <Bookmark className="h-3.5 w-3.5 fill-current" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {prodTab === 'templates' && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary dark:text-white">AI Quick Templates</h3>
                                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 font-serif font-semibold">Pre-filled query blueprints to run instantly in the workspace.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { title: "Smart Notes Helper", desc: "Synthesise comprehensive notes detailing Process Synchronization constructs.", query: "Generate detailed notes on Process Synchronization in Operating Systems" },
                                            { title: "Study Flashcard Suite", desc: "Build mock memory cards for Acid properties logic.", query: "Generate 5 flashcards for Database Transaction Properties (ACID)" },
                                            { title: "Interactive Quiz Studio", desc: "Generate computer networks routing protocol MCQs.", query: "Create an MCQ quiz on Computer Networks routing protocols with 10 questions" },
                                            { title: "Study Planner Draft", desc: "Initiate schedules for Computer Science exams.", query: "Create a study planner for my exam on August 15, 2026, for DSA" }
                                        ].map((t, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl flex flex-col justify-between"
                                            >
                                                <div>
                                                    <h4 className="text-xs font-bold text-text-primary dark:text-gray-150">{t.title}</h4>
                                                    <p className="text-[11px] text-text-secondary dark:text-slate-420 mt-1 leading-snug">{t.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setInputValue(t.query);
                                                        setActiveMainView('chat');
                                                    }}
                                                    className="mt-3 text-[10px] w-full bg-slate-100 hover:bg-slate-205 text-text-primary dark:text-gray-250 py-1.5 rounded-lg border border-border transition-all font-semibold"
                                                >
                                                    Pre-fill Copilot Prompt
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {prodTab === 'activity' && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary dark:text-white">My Academic Activity Timeline</h3>
                                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 font-serif">Audit log of your generated library resources.</p>
                                    </div>

                                    {libraryItems.length === 0 ? (
                                        <div className="text-xs text-text-secondary italic py-8 text-center bg-white dark:bg-dark-card rounded-xl border border-border dark:border-dark-border">
                                            No activity logs. Start generating notes or answering quizzes to track logs.
                                        </div>
                                    ) : (
                                        <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-4">
                                            {libraryItems.slice(0, 10).map((item, idx) => (
                                                <div key={idx} className="relative">
                                                    <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-white dark:border-dark-card shrink-0"></div>
                                                    <div className="p-3 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg">
                                                        <span className="text-[10px] text-text-secondary/70 dark:text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                                                        <p className="text-xs text-text-primary dark:text-gray-150 mt-1 leading-relaxed">
                                                            Generated a new resource of type <strong className="text-primary font-bold uppercase">{item.collectionType}</strong> named: <strong>{item.title}</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Dashboard workshop tool viewport container */
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <button
                                onClick={() => { setActiveMainView('chat'); setSelectedLibraryItem(null); }}
                                className="text-xs bg-slate-100 dark:bg-dark-surface border border-border text-text-secondary dark:text-gray-300 font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                            >
                                ← Back to Chat Console
                            </button>
                            <span className="text-xs font-bold text-text-secondary dark:text-slate-400 capitalize">
                                Module viewer mode
                            </span>
                        </div>

                        {activeMainView === 'notes' && (
                            <NotesWorkshop
                                onViewItem={selectedLibraryItem}
                                onGenerationSuccess={fetchLibrary}
                            />
                        )}
                        {activeMainView === 'flashcards' && (
                            <FlashcardWorkshop
                                onViewItem={selectedLibraryItem}
                                onGenerationSuccess={fetchLibrary}
                            />
                        )}
                        {activeMainView === 'quiz' && (
                            <QuizWorkshop
                                onViewItem={selectedLibraryItem}
                                onGenerationSuccess={fetchLibrary}
                            />
                        )}
                        {activeMainView === 'planner' && (
                            <PlannerWorkshop
                                onViewItem={selectedLibraryItem}
                                onGenerationSuccess={fetchLibrary}
                            />
                        )}
                        {activeMainView === 'helper' && (
                            <HelperWorkshop
                                onViewItem={selectedLibraryItem}
                                onGenerationSuccess={fetchLibrary}
                            />
                        )}
                        {activeMainView === 'faculty-tools' && (role === 'faculty' || role === 'admin') && (
                            <FacultyAdminWorkshop
                                role={role}
                                onViewItem={selectedLibraryItem}
                                preferredTool={facultyPreferredTool}
                                onGenerationSuccess={fetchLibrary}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
