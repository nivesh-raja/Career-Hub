import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetableSlot {
  time: string;
  room: string;
  subject: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
}

export interface ITimetable extends Document {
  classroom: mongoose.Types.ObjectId;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  slots: ITimetableSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema: Schema = new Schema(
  {
    classroom: {
      type: Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Classroom reference is required'],
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: [true, 'Day of week is required'],
    },
    slots: [
      {
        time: {
          type: String,
          required: true,
          trim: true,
        },
        room: {
          type: String,
          required: true,
          trim: true,
        },
        subject: {
          type: Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        faculty: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure there is only one timetable document per day per classroom
TimetableSchema.index({ classroom: 1, dayOfWeek: 1 }, { unique: true });

export default mongoose.model<ITimetable>('Timetable', TimetableSchema);
