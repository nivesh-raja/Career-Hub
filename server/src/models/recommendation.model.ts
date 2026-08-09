import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendation extends Document {
    user: mongoose.Types.ObjectId;
    role: 'student' | 'faculty' | 'admin';
    type: string;
    title: string;
    description: string;
    actionableItem?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    reason?: string;
    confidence?: number;
    createdAt: Date;
    updatedAt: Date;
}

const RecommendationSchema: Schema = new Schema(
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
        type: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        actionableItem: {
            type: String,
            trim: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        reason: {
            type: String,
            trim: true,
            default: '',
        },
        confidence: {
            type: Number,
            default: 80,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for query performance
RecommendationSchema.index({ user: 1, role: 1 });
RecommendationSchema.index({ createdAt: -1 });

export default mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
