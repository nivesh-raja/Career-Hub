import mongoose, { Schema, Document } from 'mongoose';

export interface IAILessonPlan extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    subject: string;
    semester: string;
    topics: string[];
    duration: string;
    weeklyPlan: string;
    learningObjectives: string[];
    teachingActivities: string[];
    assessmentPlan: string;
    isBookmarked: boolean;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AILessonPlanSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        subject: { type: String, required: true },
        semester: { type: String, required: true },
        topics: { type: [String], default: [] },
        duration: { type: String, required: true },
        weeklyPlan: { type: String, required: true },
        learningObjectives: { type: [String], default: [] },
        teachingActivities: { type: [String], default: [] },
        assessmentPlan: { type: String, required: true },
        isBookmarked: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IAILessonPlan>('AILessonPlan', AILessonPlanSchema);
