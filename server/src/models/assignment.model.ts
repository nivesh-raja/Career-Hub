import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description: string;
  subject: mongoose.Types.ObjectId;
  classroom: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
  dueDate: Date;
  maxMarks: number;
  attachments: string[];
  status: 'Draft' | 'Published' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    classroom: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Classroom is required'],
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due Date is required'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum Marks is required'],
      min: 1,
    },
    attachments: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Closed'],
      default: 'Published',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
