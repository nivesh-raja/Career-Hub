import mongoose, { Schema, Document } from 'mongoose';

export interface IAIChat extends Document {
    user: mongoose.Types.ObjectId;
    prompt: string;
    response: string;
    role: 'student' | 'faculty' | 'admin';
    subject?: mongoose.Types.ObjectId;
    conversationTitle?: string;
    sourceDocuments?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const AIChatSchema: Schema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        prompt: {
            type: String,
            required: true,
        },
        response: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['student', 'faculty', 'admin'],
            required: true,
        },
        subject: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
        },
        conversationTitle: {
            type: String,
            default: 'New Conversation',
        },
        sourceDocuments: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IAIChat>('AIChat', AIChatSchema);
