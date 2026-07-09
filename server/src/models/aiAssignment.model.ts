import mongoose, { Schema, Document } from 'mongoose';

export interface IAIAssignment extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    type: 'helper' | 'programming' | 'theory' | 'miniproject' | 'lab' | 'homework';
    difficulty?: 'easy' | 'medium' | 'hard';
    subject?: string;
    content: string;
    sourceDocuments?: string[];
    isBookmarked: boolean;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AIAssignmentSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        type: {
            type: String,
            enum: ['helper', 'programming', 'theory', 'miniproject', 'lab', 'homework'],
            required: true,
        },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
        subject: { type: String },
        content: { type: String, required: true },
        sourceDocuments: { type: [String], default: [] },
        isBookmarked: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IAIAssignment>('AIAssignment', AIAssignmentSchema);
