import mongoose, { Schema, Document } from 'mongoose';

export interface IAIStudyPlan extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    examDate: Date;
    subjects: string[];
    dailyStudyHours: number;
    currentProgress?: string;
    planData: {
        dailyPlan: string;
        weeklyPlan: string;
        revisionCalendar: string;
        priorityTopics: string[];
        remainingDaysAnalysis: string;
        progressTracker: string;
    };
    isBookmarked: boolean;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AIStudyPlanSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        examDate: { type: Date, required: true },
        subjects: { type: [String], required: true },
        dailyStudyHours: { type: Number, required: true },
        currentProgress: { type: String },
        planData: {
            dailyPlan: { type: String, required: true },
            weeklyPlan: { type: String, required: true },
            revisionCalendar: { type: String, required: true },
            priorityTopics: { type: [String], default: [] },
            remainingDaysAnalysis: { type: String, required: true },
            progressTracker: { type: String, required: true },
        },
        isBookmarked: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IAIStudyPlan>('AIStudyPlan', AIStudyPlanSchema);
