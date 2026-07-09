import mongoose, { Schema, Document } from 'mongoose';

export interface IFlashcardItem {
    question: string;
    answer: string;
    topic?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    isBookmarked?: boolean;
}

export interface IAIFlashcard extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    topic?: string;
    cards: IFlashcardItem[];
    sourceDocuments?: string[];
    isBookmarked: boolean;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FlashcardItemSchema = new Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    topic: { type: String },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    isBookmarked: { type: Boolean, default: false },
});

const AIFlashcardSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        topic: { type: String },
        cards: { type: [FlashcardItemSchema], default: [] },
        sourceDocuments: { type: [String], default: [] },
        isBookmarked: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IAIFlashcard>('AIFlashcard', AIFlashcardSchema);
