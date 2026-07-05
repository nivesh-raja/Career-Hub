import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  adminName: string;
  action: string;
  description?: string;
  targetUser?: string;
  ipAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    adminName: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Action description is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    targetUser: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
