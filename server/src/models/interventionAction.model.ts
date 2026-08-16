import mongoose, { Schema, Document } from 'mongoose';

export type InterventionActionStatus =
  | 'PENDING'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DISMISSED'
  | 'EXPIRED';

export interface IInterventionAction extends Document {
  user: mongoose.Types.ObjectId;
  sourceInterventionId: string;
  role: 'student' | 'faculty' | 'admin';
  title: string;
  description: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  sourceMetric: string;
  currentValue: any;
  targetValue: number | null;
  reason: string;
  recommendation: string;
  trend: string;
  riskLevel: string;
  status: InterventionActionStatus;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  dismissedAt?: Date;
  baselineValue?: any;
  baselineRiskLevel?: string;
  baselineTrend?: string;
}

const InterventionActionSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    sourceInterventionId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
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
    category: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      required: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    sourceMetric: {
      type: String,
      required: true,
      trim: true,
    },
    currentValue: {
      type: Schema.Types.Mixed,
    },
    targetValue: {
      type: Number,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
    },
    recommendation: {
      type: String,
      trim: true,
    },
    trend: {
      type: String,
      trim: true,
    },
    riskLevel: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    dismissedAt: {
      type: Date,
    },
    baselineValue: {
      type: Schema.Types.Mixed,
    },
    baselineRiskLevel: {
      type: String,
      trim: true,
    },
    baselineTrend: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find an active action for a given user and deterministic intervention ID
InterventionActionSchema.index({ user: 1, sourceInterventionId: 1, status: 1 });

export default mongoose.model<IInterventionAction>('InterventionAction', InterventionActionSchema);
