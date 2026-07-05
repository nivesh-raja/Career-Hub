import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  code: string;
  department: mongoose.Types.ObjectId;
  credits: number;
  description?: string;
  createdAt: Date;
}

const SubjectSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      default: 3,
      min: 1,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISubject>('Subject', SubjectSchema);
