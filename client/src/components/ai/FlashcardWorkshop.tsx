import React, { useState } from 'react';
import { Sparkles, Layers, RefreshCw, Bookmark, Search, Shuffle, FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import api from '../../services/api.js';
import { exportToTxt, exportToMarkdown } from '../../utils/exportHelper.js';

interface Flashcard {
    _id?: string;
    question: string;
    answer: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    isBookmarked?: boolean;
}

interface FlashcardWorkshopProps {
    onGenerationSuccess: () => void;
    onViewItem?: any;
}

export const FlashcardWorkshop: React.FC<FlashcardWorkshopProps> = ({ onGenerationSuccess, onViewItem }) => {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [isLoading, setIsLoading] = useState(false);
    const [deck, setDeck] = useState<any>(onViewItem || null);

    // Active decks indices
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [studyMode, setStudyMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cardsList, setCardsList] = useState<Flashcard[]>([]);

    React.useEffect(() => {
        if (onViewItem) {
            setDeck(onViewItem);
            setCardsList(onViewItem.cards || []);
            setCurrentIndex(0);
            setIsFlipped(false);
        }
    }, [onViewItem]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsLoading(true);
        try {
            const { data } = await api.post('/ai/flashcards', {
                topic: topic.trim(),
                difficulty
            });
            setDeck(data.flashcard);
            setCardsList(data.flashcard.cards || []);
            setCurrentIndex(0);
            setIsFlipped(false);
            onGenerationSuccess();
        } catch (err) {
            alert('Failed to generate study flashcards.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShuffle = () => {
        if (cardsList.length <= 1) return;
        const shuffled = [...cardsList].sort(() => Math.random() - 0.5);
        setCardsList(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const toggleCardBookmarkInDeck = async (cardIdx: number) => {
        if (!deck) return;
        const updatedCards = [...cardsList];
        updatedCards[cardIdx].isBookmarked = !updatedCards[cardIdx].isBookmarked;

        try {
            const { data } = await api.put(`/ai/saved-items/flashcards/${deck._id}`, {
                cards: updatedCards
            });
            setDeck(data.item);
            setCardsList(data.item.cards);
        } catch (e) {
            console.error('Failed to change bookmark state on flashcard');
        }
    };

    const filteredCards = cardsList.filter(c =>
        c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleExport = (format: 'txt' | 'md') => {
        if (!deck) return;
        const mdText = cardsList.map((c, idx) =>
            `### Card ${idx + 1} (${c.difficulty.toUpperCase()})\n**Question:** ${c.question}\n**Answer:** ${c.answer}\n`
        ).join('\n---\n\n');

        if (format === 'txt') {
            exportToTxt(deck.title, mdText);
        } else {
            exportToMarkdown(deck.title, mdText);
        }
    };

    const sourceDocs = deck?.sourceDocuments || [];
    const hasRAG = sourceDocs.length > 0 && !sourceDocs.includes('General AI Knowledge');

    return (
        <div className="space-y-6">
            {!onViewItem && !deck && (
                <form onSubmit={handleGenerate} className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-subtle space-y-4">
                    <div className="flex items-center gap-2 border-b border-border dark:border-dark-border pb-3">
                        <Layers className="h-5 w-5 text-primary dark:text-amber-500" />
                        <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-100">AI Flashcard Generator</h3>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Topic Name *</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-400"
                            placeholder="e.g. CPU Scheduling Algorithms"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Target Difficulty Level</label>
                        <select
                            className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as any)}
                        >
                            <option value="easy">Easy Basic Terms & Key Definitions</option>
                            <option value="medium">Medium Standard Conceptual Explanations</option>
                            <option value="hard">Hard Critical Analysis & Calculations</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-subtle disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Extracting terms & creating flashcards...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate Deck
                            </>
                        )}
                    </button>
                </form>
            )}

            {deck && cardsList.length > 0 && (
                <div className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-card space-y-6">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border dark:border-dark-border pb-4">
                        <div>
                            <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-100">{deck.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className="text-[10px] bg-primary/10 text-primary dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">{deck.topic}</span>
                                <span className="text-[10px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-440 px-2 py-0.5 rounded-full font-medium">
                                    {hasRAG ? `📄 Sources: ${sourceDocs.join(', ')}` : '🌐 General Knowledge'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setStudyMode(!studyMode)}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${studyMode ? 'bg-primary text-white border-primary' : 'bg-transparent text-text-secondary border-border dark:border-dark-border dark:text-gray-200'}`}
                            >
                                {studyMode ? "Exit Study Mode" : "Start Study Mode"}
                            </button>
                            <button onClick={handleShuffle} className="p-2 border border-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover rounded-lg text-text-secondary dark:text-gray-300" title="Shuffle Deck">
                                <Shuffle className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleExport('md')} className="p-2 border border-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover rounded-lg text-text-secondary dark:text-gray-300" title="Export as Markdown">
                                <FileText className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Search query cards */}
                    {!studyMode && (
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-400"
                                placeholder="Search questions or answers in deck..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Interactive Active Study view */}
                    {studyMode ? (
                        <div className="flex flex-col items-center py-8">
                            <div
                                onClick={() => setIsFlipped(!isFlipped)}
                                className="w-full max-w-lg aspect-[5/3] bg-gradient-to-br from-white to-slate-50 dark:from-dark-card dark:to-dark-surface border-2 border-border dark:border-dark-border rounded-xl shadow-subtle hover:shadow-card cursor-pointer p-8 flex flex-col justify-between select-none relative transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-text-secondary dark:text-slate-500">
                                    {isFlipped ? "Answer Card" : "Question Card"} · {filteredCards[currentIndex]?.difficulty}
                                </span>

                                <div className="flex-1 flex items-center justify-center leading-relaxed text-center">
                                    {isFlipped ? (
                                        <p className="text-sm font-semibold text-text-primary dark:text-gray-150 whitespace-pre-wrap">{filteredCards[currentIndex]?.answer}</p>
                                    ) : (
                                        <p className="text-base font-serif font-bold text-text-primary dark:text-white leading-snug">{filteredCards[currentIndex]?.question}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-border/40 dark:border-dark-border/40 pt-4 text-xs text-text-secondary dark:text-slate-400">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCardBookmarkInDeck(currentIndex);
                                        }}
                                        className={`flex items-center gap-1 hover:text-amber-500 ${filteredCards[currentIndex]?.isBookmarked ? 'text-amber-500 font-bold' : ''}`}
                                    >
                                        <Bookmark className="h-3.5 w-3.5" fill={filteredCards[currentIndex]?.isBookmarked ? "currentColor" : "none"} /> Bookmarked
                                    </button>
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" /> Toggle click to flip
                                    </span>
                                </div>
                            </div>

                            {/* Deck Navigation footer */}
                            <div className="flex items-center gap-6 mt-6">
                                <button
                                    onClick={() => {
                                        setCurrentIndex(c => Math.max(0, c - 1));
                                        setIsFlipped(false);
                                    }}
                                    disabled={currentIndex === 0}
                                    className="p-2 border border-border dark:border-dark-border rounded-full hover:bg-slate-100 dark:hover:bg-dark-hover text-text-secondary dark:text-gray-300 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <span className="text-sm font-medium text-text-primary dark:text-white">
                                    Card {currentIndex + 1} of {filteredCards.length}
                                </span>
                                <button
                                    onClick={() => {
                                        setCurrentIndex(c => Math.min(filteredCards.length - 1, c + 1));
                                        setIsFlipped(false);
                                    }}
                                    disabled={currentIndex === filteredCards.length - 1}
                                    className="p-2 border border-border dark:border-dark-border rounded-full hover:bg-slate-100 dark:hover:bg-dark-hover text-text-secondary dark:text-gray-300 disabled:opacity-50"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Flat library grid display of cards */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                            {filteredCards.map((c, idx) => (
                                <div key={idx} className="bg-slate-50/50 dark:bg-dark-surface/40 p-4 border border-border dark:border-dark-border rounded-lg relative hover:border-primary transition-all">
                                    <div className="flex items-start justify-between gap-3 mb-2 border-b border-border/20 dark:border-dark-border/20 pb-1.5">
                                        <span className="text-[10px] font-bold text-text-secondary dark:text-slate-400">Card {idx + 1}</span>
                                        <button
                                            onClick={() => toggleCardBookmarkInDeck(idx)}
                                            className={`text-slate-400 hover:text-amber-500`}
                                        >
                                            <Bookmark className="h-3.5 w-3.5" fill={c.isBookmarked ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                    <p className="text-xs font-serif font-bold text-text-primary dark:text-white mb-2 leading-relaxed">{c.question}</p>
                                    <p className="text-xs text-text-secondary dark:text-secondary-300 border-l-2 border-primary/30 pl-2 leading-relaxed">{c.answer}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
