import mongoose, { Schema, Document } from 'mongoose';

export interface IAINotes extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    subject?: string;
    chapter?: string;
    topic?: string;
    noteType: 'short' | 'detailed' | 'revision' | 'bullet' | 'examprep';
    content: string;
    sourceDocuments?: string[];
    isBookmarked: boolean;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AINotesSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        subject: { type: String },
        chapter: { type: String },
        topic: { type: String },
        noteType: {
            type: String,
            enum: ['short', 'detailed', 'revision', 'bullet', 'examprep'],
            required: true,
        },
        content: { type: String, required: true },
        sourceDocuments: { type: [String], default: [] },
        isBookmarked: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IAINotes>('AINotes', AINotesSchema);
