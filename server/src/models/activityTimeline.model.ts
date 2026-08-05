import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityTimeline extends Document {
    user: mongoose.Types.ObjectId;
    role: 'student' | 'faculty' | 'admin';
    activityType: string;
    title: string;
    description: string;
    metadata?: {
        module?: string;
        icon?: string;
        color?: string;
        [key: string]: any;
    };
    createdAt: Date;
    updatedAt: Date;
}

const ActivityTimelineSchema: Schema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
        },
        role: {
            type: String,
            enum: ['student', 'faculty', 'admin'],
            required: [true, 'Role is required'],
        },
        activityType: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

ActivityTimelineSchema.index({ user: 1, createdAt: -1 });
ActivityTimelineSchema.index({ role: 1, createdAt: -1 });
ActivityTimelineSchema.index({ activityType: 1, createdAt: -1 });
ActivityTimelineSchema.index({ 'metadata.module': 1 });

export default mongoose.model<IActivityTimeline>('ActivityTimeline', ActivityTimelineSchema);
