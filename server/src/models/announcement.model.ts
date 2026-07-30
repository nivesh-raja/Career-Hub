import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  targetClassroom?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  targetRole?: 'student' | 'faculty';
  faculty: mongoose.Types.ObjectId;
  publishDate: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    targetClassroom: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    targetRole: {
      type: String,
      enum: ['student', 'faculty'],
      default: 'student',
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
