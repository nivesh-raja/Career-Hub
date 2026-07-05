import mongoose, { Schema, Document } from 'mongoose';

export interface IAIDocument extends Document {
    filename: string;
    originalName: string;
    mimeType?: string;
    fileSize?: number;
    totalChunks?: number;
    extractedTextLength?: number;
    processingStatus: 'processing' | 'ready' | 'failed';
    sourceType: 'Material' | 'QuestionPaper' | 'Assignment' | 'UserUpload';
    sourceId?: mongoose.Types.ObjectId;
    uploader: mongoose.Types.ObjectId;
    role: 'student' | 'faculty' | 'admin';
    subject?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AIDocumentSchema: Schema = new Schema(
    {
        filename: {
            type: String,
            required: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        sourceType: {
            type: String,
            enum: ['Material', 'QuestionPaper', 'Assignment', 'UserUpload'],
            required: true,
        },
        mimeType: { type: String },
        fileSize: { type: Number },
        totalChunks: { type: Number, default: 0 },
        extractedTextLength: { type: Number, default: 0 },
        processingStatus: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
        sourceId: { type: Schema.Types.ObjectId },
        uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
        subject: { type: Schema.Types.ObjectId, ref: 'Subject' },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IAIDocument>('AIDocument', AIDocumentSchema);
