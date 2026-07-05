import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  title: string;
  description?: string;
  subject: mongoose.Types.ObjectId;
  classroom: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
  category: 'PDF' | 'DOCX' | 'PPT' | 'ZIP' | 'Image' | 'Video' | 'Other';
  fileUrl: string;
  uploadDate: Date;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    classroom: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Classroom reference is required'],
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    category: {
      type: String,
      enum: ['PDF', 'DOCX', 'PPT', 'ZIP', 'Image', 'Video', 'Other'],
      required: [true, 'Category is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL or path is required'],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMaterial>('Material', MaterialSchema);
