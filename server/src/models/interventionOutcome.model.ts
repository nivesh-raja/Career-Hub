import mongoose, { Schema, Document } from 'mongoose';

export interface IInterventionOutcome extends Document {
  interventionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'student' | 'faculty' | 'admin';
  metric: string;
  baselineValue: number | null;
  postValue: number | null;
  delta: number | null;
  percentageChange: number | null;
  baselineRiskLevel: string | null;
  postRiskLevel: string | null;
  riskChange: 'IMPROVED' | 'DECLINED' | 'NO_CHANGE' | null;
  baselineTrend: string | null;
  postTrend: string | null;
  status: 'AWAITING_MEASUREMENT' | 'OBSERVED_IMPROVEMENT' | 'NO_SIGNIFICANT_CHANGE' | 'OBSERVED_DECLINE' | 'INSUFFICIENT_DATA';
  measurementWindowDays: number;
  completedAt: Date;
  measuredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InterventionOutcomeSchema: Schema = new Schema(
  {
    interventionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterventionAction',
      required: [true, 'Intervention Action reference is required'],
      unique: true, // Prevents duplicate outcome records
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: true,
    },
    metric: {
      type: String,
      required: true,
      trim: true,
    },
    baselineValue: {
      type: Number,
      default: null,
    },
    postValue: {
      type: Number,
      default: null,
    },
    delta: {
      type: Number,
      default: null,
    },
    percentageChange: {
      type: Number,
      default: null,
    },
    baselineRiskLevel: {
      type: String,
      default: null,
      trim: true,
    },
    postRiskLevel: {
      type: String,
      default: null,
      trim: true,
    },
    riskChange: {
      type: String,
      enum: ['IMPROVED', 'DECLINED', 'NO_CHANGE', null],
      default: null,
    },
    baselineTrend: {
      type: String,
      default: null,
      trim: true,
    },
    postTrend: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['AWAITING_MEASUREMENT', 'OBSERVED_IMPROVEMENT', 'NO_SIGNIFICANT_CHANGE', 'OBSERVED_DECLINE', 'INSUFFICIENT_DATA'],
      required: true,
      default: 'AWAITING_MEASUREMENT',
      index: true,
    },
    measurementWindowDays: {
      type: Number,
      required: true,
      default: 7,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    measuredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InterventionOutcomeSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IInterventionOutcome>('InterventionOutcome', InterventionOutcomeSchema);
