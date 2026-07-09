import React, { useState } from 'react';
import { Sparkles, HelpCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api.js';

interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
}

interface QuizWorkshopProps {
    onGenerationSuccess: () => void;
    onViewItem?: any;
}

export const QuizWorkshop: React.FC<QuizWorkshopProps> = ({ onGenerationSuccess, onViewItem }) => {
    const [topic, setTopic] = useState('');
    const [quizType, setQuizType] = useState<'mcq' | 'tf' | 'fitb' | 'short'>('mcq');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [questionsCount, setQuestionsCount] = useState<number>(10);
    const [isLoading, setIsLoading] = useState(false);
    const [quizDoc, setQuizDoc] = useState<any>(onViewItem || null);

    // Active answering state
    const [studentAnswers, setStudentAnswers] = useState<Record<number, string>>({});
    const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
    const [calculatedScore, setCalculatedScore] = useState(0);

    React.useEffect(() => {
        if (onViewItem) {
            setQuizDoc(onViewItem);
            setStudentAnswers({});
            setIsQuizSubmitted(false);
            setCalculatedScore(0);
        }
    }, [onViewItem]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsLoading(true);
        try {
            const { data } = await api.post('/ai/quiz', {
                topic: topic.trim(),
                quizType,
                difficulty,
                questionsCount
            });
            setQuizDoc(data.quiz);
            setStudentAnswers({});
            setIsQuizSubmitted(false);
            setCalculatedScore(0);
            onGenerationSuccess();
        } catch (err) {
            alert('Failed to generate quiz.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerSelect = (qIdx: number, val: string) => {
        if (isQuizSubmitted) return;
        setStudentAnswers({ ...studentAnswers, [qIdx]: val });
    };

    const handleSubmitQuiz = () => {
        if (!quizDoc) return;
        let score = 0;
        const questionsList: QuizQuestion[] = quizDoc.questions || [];

        questionsList.forEach((q, idx) => {
            const selected = (studentAnswers[idx] || '').trim().toLowerCase();
            const correct = q.answer.trim().toLowerCase();

            if (quizDoc.quizType === 'mcq' || quizDoc.quizType === 'tf') {
                if (selected === correct) score++;
            } else {
                // Fuzzy check for keywords or soft text
                if (selected.includes(correct) || correct.includes(selected)) {
                    if (selected.length > 1) score++;
                }
            }
        });

        setCalculatedScore(score);
        setIsQuizSubmitted(true);
    };

    const sourceDocs = quizDoc?.sourceDocuments || [];
    const hasRAG = sourceDocs.length > 0 && !sourceDocs.includes('General AI Knowledge');
    const questions: QuizQuestion[] = quizDoc?.questions || [];

    return (
        <div className="space-y-6">
            {!onViewItem && !quizDoc && (
                <form onSubmit={handleGenerate} className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-subtle space-y-4">
                    <div className="flex items-center gap-2 border-b border-border dark:border-dark-border pb-3">
                        <HelpCircle className="h-5 w-5 text-primary dark:text-amber-500" />
                        <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-100">AI Quiz Generator</h3>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Topic / Study Objective *</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100 placeholder:text-slate-400"
                            placeholder="e.g. Memory management paging vs segmentation"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Questions Count</label>
                            <select
                                className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100"
                                value={questionsCount}
                                onChange={(e) => setQuestionsCount(Number(e.target.value))}
                            >
                                <option value={10}>10 Questions</option>
                                <option value={20}>20 Questions</option>
                                <option value={30}>30 Questions</option>
                                <option value={50}>50 Questions</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Quiz Type</label>
                            <select
                                className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100"
                                value={quizType}
                                onChange={(e) => setQuizType(e.target.value as any)}
                            >
                                <option value="mcq">Multiple Choice MCQ</option>
                                <option value="tf">True / False</option>
                                <option value="fitb">Fill in the Blanks</option>
                                <option value="short">Short Answer Theory</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary dark:text-slate-400 mb-1">Difficulty</label>
                            <select
                                className="w-full bg-slate-50/50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-text-primary dark:text-gray-100"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as any)}
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-subtle disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Reviewing materials & preparing quiz card...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate Course Quiz
                            </>
                        )}
                    </button>
                </form>
            )}

            {quizDoc && questions.length > 0 && (
                <div className="bg-white/80 dark:bg-dark-card/85 p-6 rounded-xl border border-border dark:border-dark-border shadow-card space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border dark:border-dark-border pb-4">
                        <div>
                            <h3 className="font-serif font-bold text-lg text-text-primary dark:text-gray-100">{quizDoc.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className="text-[10px] bg-primary/10 text-primary dark:text-amber-400 px-2 py-0.5 rounded-full font-medium uppercase">{quizDoc.quizType}</span>
                                <span className="text-[10px] bg-slate-100 dark:bg-dark-surface text-text-secondary dark:text-slate-300 px-2 py-0.5 rounded-full font-medium uppercase">{quizDoc.difficulty}</span>
                                <span className="text-[10px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-440 px-2 py-0.5 rounded-full font-medium">
                                    {hasRAG ? `📄 Sources: ${sourceDocs.join(', ')}` : '🌐 General Knowledge'}
                                </span>
                            </div>
                        </div>

                        {isQuizSubmitted && (
                            <div className="bg-primary/10 border border-primary/20 dark:border-amber-900/30 rounded-lg px-4 py-2 text-center text-primary dark:text-amber-400">
                                <div className="text-xs font-bold uppercase">Result Calculated</div>
                                <div className="text-xl font-black">{calculatedScore} / {questions.length}</div>
                            </div>
                        )}
                    </div>

                    {/* Question Card Solver */}
                    <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
                        {questions.map((q, idx) => {
                            const isCorrect = (studentAnswers[idx] || '').trim().toLowerCase() === q.answer.trim().toLowerCase();

                            return (
                                <div key={idx} className="bg-slate-50/50 dark:bg-dark-surface/40 p-5 border border-border dark:border-dark-border rounded-xl">
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <h4 className="font-serif font-bold text-sm text-text-primary dark:text-white">
                                            Q{idx + 1}. {q.question}
                                        </h4>
                                        {isQuizSubmitted && (
                                            isCorrect ? (
                                                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                            )
                                        )}
                                    </div>

                                    {/* MCQ OR TF Choices Selection */}
                                    {(quizDoc.quizType === 'mcq' || quizDoc.quizType === 'tf') ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                            {q.options.map((opt, oIdx) => {
                                                const isSelected = studentAnswers[idx] === opt;
                                                const isThisCorrectOption = opt.trim().toLowerCase() === q.answer.trim().toLowerCase();

                                                let btnBorder = 'border-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-text-primary dark:text-gray-200';
                                                if (isSelected) {
                                                    btnBorder = 'bg-primary border-primary text-white';
                                                }
                                                if (isQuizSubmitted) {
                                                    if (isThisCorrectOption) {
                                                        btnBorder = 'bg-green-100 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400 font-bold';
                                                    } else if (isSelected) {
                                                        btnBorder = 'bg-red-100 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-400 font-bold';
                                                    } else {
                                                        btnBorder = 'opacity-60 border-border dark:border-dark-border text-slate-400';
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={oIdx}
                                                        type="button"
                                                        onClick={() => handleAnswerSelect(idx, opt)}
                                                        disabled={isQuizSubmitted}
                                                        className={`w-full text-left text-xs px-4 py-2.5 rounded-lg border transition-all ${btnBorder}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        /* Fill in Blank / Essay Input */
                                        <div className="mt-2 space-y-2">
                                            <input
                                                type="text"
                                                disabled={isQuizSubmitted}
                                                className={`w-full bg-slate-50/50 dark:bg-dark-surface border rounded-lg px-3 py-2 text-xs focus:outline-none ${isQuizSubmitted ? (isCorrect ? 'border-green-500 text-green-700 dark:text-green-400' : 'border-red-500 text-red-700 dark:text-red-400') : 'border-border dark:border-dark-border focus:ring-1 focus:ring-primary'}`}
                                                placeholder="Type your answer here..."
                                                value={studentAnswers[idx] || ''}
                                                onChange={(e) => handleAnswerSelect(idx, e.target.value)}
                                            />
                                            {isQuizSubmitted && !isCorrect && (
                                                <div className="text-[10px] text-green-600 dark:text-green-400 font-semibold">
                                                    Correct Answer: {q.answer}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Detail Explanation toggling */}
                                    {isQuizSubmitted && q.explanation && (
                                        <div className="mt-3 bg-slate-100/60 dark:bg-dark-surface/50 border-l-2 border-primary p-3 rounded text-[11px] text-text-secondary dark:text-secondary-300">
                                            <strong>Explanation:</strong> {q.explanation}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 border-t border-border dark:border-dark-border pt-4">
                        {!isQuizSubmitted ? (
                            <button
                                onClick={handleSubmitQuiz}
                                disabled={Object.keys(studentAnswers).length === 0}
                                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-subtle transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                Submit Quiz Answers
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setIsQuizSubmitted(false);
                                    setStudentAnswers({});
                                }}
                                className="border border-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-text-secondary dark:text-gray-300 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all"
                            >
                                Reset & Retake Quiz
                            </button>
                        )}
                        {onViewItem && (
                            <button
                                onClick={() => setQuizDoc(null)}
                                className="border border-border dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-hover text-text-secondary dark:text-gray-300 text-xs px-3 py-2 rounded-lg"
                            >
                                Close View
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
