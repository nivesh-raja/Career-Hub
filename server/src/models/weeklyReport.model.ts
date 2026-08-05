import mongoose, { Schema, Document } from 'mongoose';

export interface IWeeklyReport extends Document {
    user: mongoose.Types.ObjectId;
    role: 'student' | 'faculty' | 'admin';
    startDate: Date;
    endDate: Date;
    reportData: any;
    createdAt: Date;
    updatedAt: Date;
}

const WeeklyReportSchema: Schema = new Schema(
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
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        reportData: {
            type: Schema.Types.Mixed,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

WeeklyReportSchema.index({ user: 1, startDate: -1 });

export default mongoose.model<IWeeklyReport>('WeeklyReport', WeeklyReportSchema);
