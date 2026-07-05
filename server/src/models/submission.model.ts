import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  assignment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  submissionDate: Date;
  files: string[];
  feedback?: string;
  marks?: number;
  status: 'Pending' | 'Submitted' | 'Reviewed' | 'Late';
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema: Schema = new Schema(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    files: [
      {
        type: String,
        required: [true, 'Submission files are required'],
      },
    ],
    feedback: {
      type: String,
      default: '',
    },
    marks: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Submitted', 'Reviewed', 'Late'],
      default: 'Submitted',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a student can submit only one solution per assignment
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model<ISubmission>('Submission', SubmissionSchema);
