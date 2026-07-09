import mongoose, { Schema, Document } from 'mongoose';

export interface IAIQuestionPaper extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    examType: 'internal' | 'semester' | 'lab';
    difficulty: 'easy' | 'medium' | 'hard';
    bloomTaxonomy: string;
    questionTypes: string[];
    content: string;
    sourceDocuments?: string[];
    isBookmarked: boolean;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AIQuestionPaperSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        examType: { type: String, enum: ['internal', 'semester', 'lab'], required: true },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
        bloomTaxonomy: { type: String, required: true },
        questionTypes: { type: [String], default: [] },
        content: { type: String, required: true },
        sourceDocuments: { type: [String], default: [] },
        isBookmarked: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IAIQuestionPaper>('AIQuestionPaper', AIQuestionPaperSchema);
