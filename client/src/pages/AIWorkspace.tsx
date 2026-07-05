import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Send, Upload, Trash2, Bot, User as UserIcon, RefreshCw, FileText, Sparkles, BookOpen, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api.js';
import { cn } from '../utils/cn.js';

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: string;
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
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [documents, setDocuments] = useState<AIDoc[]>([]);
    const [activeTab, setActiveTab] = useState<'history' | 'docs'>('history');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchHistory();
        fetchDocuments();
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
            setMessages([...newMessages, { id: Date.now().toString() + '_ai', role: 'ai', text: data.response, timestamp: new Date().toISOString() }]);
            fetchHistory();
        } catch (err: any) {
            setMessages([...newMessages, { id: Date.now().toString() + '_err', role: 'ai', text: `Error: ${err?.response?.data?.message || 'Failed to connect to AI.'}`, timestamp: new Date().toISOString() }]);
        } finally {
            setIsTyping(false);
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

    const clearChat = () => setMessages([]);

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 gap-4 p-4 overflow-hidden">
            {/* Sidebar */}
            <div className="hidden lg:flex w-72 flex-col bg-white rounded-xl shadow-subtle border border-border overflow-hidden">
                <div className="p-3 border-b border-border bg-slate-50 flex items-center gap-2">
                    <button onClick={() => setActiveTab('history')} className={cn("flex-1 text-xs font-semibold py-1.5 rounded-md transition-all", activeTab === 'history' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-100')}>
                        Recent
                    </button>
                    <button onClick={() => setActiveTab('docs')} className={cn("flex-1 text-xs font-semibold py-1.5 rounded-md transition-all flex items-center justify-center gap-1", activeTab === 'docs' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-slate-100')}>
                        <BookOpen className="h-3 w-3" /> Docs {documents.length > 0 && `(${documents.length})`}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                    {activeTab === 'history' ? (
                        <>
                            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Recent Interactions</div>
                            {history.length === 0 ? (
                                <p className="text-xs text-text-secondary italic">No history yet.</p>
                            ) : (
                                history.map((hist) => (
                                    <div key={hist._id} className="group p-2 mb-1 rounded-md hover:bg-slate-50 cursor-pointer text-sm border-l-2 border-transparent hover:border-primary transition-all relative">
                                        <p className="font-medium text-text-primary pr-12 truncate text-xs">{hist.conversationTitle || hist.prompt}</p>
                                        <p className="text-[10px] text-text-secondary">{new Date(hist.createdAt).toLocaleDateString()}</p>
                                        <div className="absolute right-1 top-2 hidden group-hover:flex gap-1">
                                            <button onClick={() => handleRenameHistory(hist._id, hist.conversationTitle)} className="text-slate-400 hover:text-primary p-0.5 rounded"><FileText className="h-3 w-3" /></button>
                                            <button onClick={() => handleDeleteHistory(hist._id)} className="text-slate-400 hover:text-red-500 p-0.5 rounded"><Trash2 className="h-3 w-3" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        <>
                            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Uploaded Documents</div>
                            {documents.length === 0 ? (
                                <p className="text-xs text-text-secondary italic">No documents uploaded yet. Upload a PDF, DOCX or TXT to enable RAG.</p>
                            ) : (
                                documents.map((doc) => (
                                    <div key={doc._id} className="group p-2 mb-2 rounded-lg border border-border hover:border-primary transition-all bg-slate-50 hover:bg-white">
                                        <div className="flex items-start gap-2">
                                            <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-text-primary truncate pr-5" title={doc.filename}>{doc.filename}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-text-secondary">{formatBytes(doc.fileSize)}</span>
                                                    {doc.totalChunks ? <span className="text-[10px] text-text-secondary">· {doc.totalChunks} chunks</span> : null}
                                                    <span className={cn("text-[10px] font-medium", doc.processingStatus === 'ready' ? 'text-green-600' : doc.processingStatus === 'processing' ? 'text-amber-500' : 'text-red-500')}>
                                                        · {doc.processingStatus}
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteDoc(doc._id, doc.filename)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all shrink-0">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-subtle border border-border overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="font-semibold text-text-primary text-sm">Gemini Neural Architecture (RAG)</h2>
                        {documents.length > 0 && (
                            <p className="text-[10px] text-green-600 font-medium mt-0.5">✓ {documents.length} document{documents.length > 1 ? 's' : ''} in context</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <label className={cn("px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer flex items-center gap-2 transition-all", isUploading ? 'bg-slate-200 text-slate-500' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white')}>
                            {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {isUploading ? 'Processing...' : 'Embed Document'}
                            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.txt,.docx,.doc,.md" disabled={isUploading} />
                        </label>
                        <button onClick={clearChat} className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-md transition-all" title="Clear chat view">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Chat Feed */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-80 select-none">
                            <Sparkles className="h-16 w-16 text-primary/20 mb-4" />
                            <h3 className="text-xl font-bold text-text-primary mb-2">How can I assist your studies?</h3>
                            <p className="text-sm text-text-secondary max-w-md text-center mb-4">
                                Upload a PDF, DOCX or TXT file — then ask questions about it. I'll retrieve the most relevant context automatically.
                            </p>
                            {documents.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-xs text-green-700 font-medium">
                                    ✓ {documents.length} document{documents.length > 1 ? 's' : ''} ready in context
                                </div>
                            )}
                        </div>
                    )}

                    {messages.map((m) => (
                        <div key={m.id} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn("h-8 w-8 rounded-full shrink-0 flex items-center justify-center border", m.role === 'user' ? "bg-primary text-white border-primary" : "bg-white text-primary border-border shadow-sm")}>
                                {m.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 shadow-subtle", m.role === 'user' ? "bg-primary text-white ml-8 rounded-tr-none" : "bg-white border border-border mr-8 rounded-tl-none")}>
                                {m.role === 'user' ? (
                                    <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                                ) : (
                                    <div className="prose prose-sm prose-slate max-w-none text-sm break-words">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                                    </div>
                                )}
                                <p className={cn("text-[10px] mt-1", m.role === 'user' ? 'text-white/60 text-right' : 'text-text-secondary')}>
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-4 flex-row">
                            <div className="h-8 w-8 rounded-full bg-white text-primary border border-border shadow-sm shrink-0 flex items-center justify-center">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-white border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-subtle flex items-center gap-1.5">
                                <span className="text-sm text-slate-500">Thinking</span>
                                <span className="animate-bounce text-primary">.</span>
                                <span className="animate-bounce text-primary" style={{ animationDelay: '150ms' }}>.</span>
                                <span className="animate-bounce text-primary" style={{ animationDelay: '300ms' }}>.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border bg-white">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-border rounded-full pl-5 pr-14 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary placeholder:text-slate-400"
                            placeholder={documents.length > 0 ? "Ask about your uploaded documents or any topic..." : "Ask anything or upload a document to chat with it..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isTyping}
                        />
                        <button
                            type="submit"
                            disabled={isTyping || !inputValue.trim()}
                            className="absolute right-2 p-2 bg-primary text-white rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-subtle"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                    <div className="flex gap-2 justify-center mt-3 flex-wrap">
                        {['Generate Notes from file', 'Solve Question Paper', 'Summarize this document', 'Generate MCQs'].map(s => (
                            <button key={s} onClick={() => setInputValue(s)} className="text-[10px] text-text-secondary cursor-pointer hover:text-primary transition-all flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 hover:border-primary">
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
