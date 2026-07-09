import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
    question: string;
    options?: string[];
    answer: string;
    explanation?: string;
}

export interface IAIQuiz extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    quizType: 'mcq' | 'tf' | 'fitb' | 'short';
    difficulty: 'easy' | 'medium' | 'hard';
    questionsCount: number;
    questions: IQuizQuestion[];
    sourceDocuments?: string[];
    isBookmarked: boolean;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const QuizQuestionSchema = new Schema({
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    answer: { type: String, required: true },
    explanation: { type: String },
});

const AIQuizSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        quizType: { type: String, enum: ['mcq', 'tf', 'fitb', 'short'], required: true },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
        questionsCount: { type: Number, required: true },
        questions: { type: [QuizQuestionSchema], default: [] },
        sourceDocuments: { type: [String], default: [] },
        isBookmarked: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IAIQuiz>('AIQuiz', AIQuizSchema);
