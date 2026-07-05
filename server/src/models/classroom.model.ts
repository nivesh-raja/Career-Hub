import mongoose, { Schema, Document } from 'mongoose';

export interface IClassroom extends Document {
  className: string;
  department: mongoose.Types.ObjectId;
  semester: string;
  section: string;
  faculty?: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  subjects: mongoose.Types.ObjectId[];
  capacity: number;
  academicYear: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const ClassroomSchema: Schema = new Schema(
  {
    className: {
      type: String,
      required: [true, 'Classroom name is required'],
      trim: true,
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
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      default: 60,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic Year is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IClassroom>('Classroom', ClassroomSchema);
