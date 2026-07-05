import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import Timetable from '../models/timetable.model.js';
import { logActivity } from '../utils/activityLogger.js';

export const getTimetable = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { classroomId } = req.query;
    const filter: any = {};

    if (classroomId) {
      filter.classroom = classroomId;
    }

    if (req.user?.role === 'student') {
      if (!req.user.classroom) {
        res.status(200).json({ success: true, timetables: [] });
        return;
      }
      filter.classroom = req.user.classroom;
    }

    const timetables = await Timetable.find(filter)
      .populate('classroom', 'className semester section')
      .populate('slots.subject', 'name code credits')
      .populate('slots.faculty', 'name email');

    res.status(200).json({ success: true, timetables });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrUpdateTimetable = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { classroom, dayOfWeek, slots } = req.body;

  if (!classroom || !dayOfWeek || !slots || !Array.isArray(slots)) {
    res.status(400).json({ success: false, message: 'Please provide classroom, dayOfWeek, and slots array.' });
    return;
  }

  try {
    let timetable = await Timetable.findOne({ classroom, dayOfWeek });
    if (timetable) {
      timetable.slots = slots;
      await timetable.save();
    } else {
      timetable = await Timetable.create({
        classroom,
        dayOfWeek,
        slots,
      });
    }

    await logActivity(req, req.user?.name || 'User', 'Timetable Updated', dayOfWeek);

    res.status(200).json({ success: true, timetable });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTimetable = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const timetable = await Timetable.findById(id);
    if (!timetable) {
      res.status(404).json({ success: false, message: 'Timetable not found.' });
      return;
    }

    await Timetable.findByIdAndDelete(id);

    await logActivity(req, req.user?.name || 'User', 'Timetable Deleted', timetable.dayOfWeek);

    res.status(200).json({ success: true, message: 'Timetable day deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
