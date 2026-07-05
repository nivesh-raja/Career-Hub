import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionPaper extends Document {
  title: string;
  fileUrl: string;
  department: mongoose.Types.ObjectId;
  semester: string;
  subject: mongoose.Types.ObjectId;
  academicYear: string;
  uploadDate: Date;
  faculty: mongoose.Types.ObjectId;
  category: 'Previous Year Paper' | 'Internal Paper' | 'Model Paper' | 'Question Bank' | 'Solution';
  createdAt: Date;
  updatedAt: Date;
}

const QuestionPaperSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Question paper title is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic Year is required'],
      trim: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    category: {
      type: String,
      enum: ['Previous Year Paper', 'Internal Paper', 'Model Paper', 'Question Bank', 'Solution'],
      required: [true, 'Category is required'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
