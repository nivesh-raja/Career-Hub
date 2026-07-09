import mongoose, { Schema, Document } from 'mongoose';

export interface IAINotice extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    type: 'circular' | 'notice' | 'email' | 'report_academic' | 'report_dept' | 'report_sem';
    content: string;
    isBookmarked: boolean;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AINoticeSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        type: {
            type: String,
            enum: ['circular', 'notice', 'email', 'report_academic', 'report_dept', 'report_sem'],
            required: true,
        },
        content: { type: String, required: true },
        isBookmarked: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IAINotice>('AINotice', AINoticeSchema);
