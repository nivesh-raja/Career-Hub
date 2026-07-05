import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import Announcement from '../models/announcement.model.js';
import { logActivity } from '../utils/activityLogger.js';

export const getAnnouncements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { classroomId, departmentId } = req.query;
    const filter: any = {};

    if (req.user?.role === 'student') {
      // Students see global notices, their classroom's notices, or their department's notices
      const conditions: any[] = [{ targetClassroom: { $exists: false }, department: { $exists: false } }];
      if (req.user.classroom) {
        conditions.push({ targetClassroom: req.user.classroom });
      }
      if (req.user.department) {
        conditions.push({ department: req.user.department });
      }
      filter.$or = conditions;
    } else if (req.user?.role === 'faculty') {
      // Faculty see announcements they created, plus global ones
      filter.$or = [
        { faculty: req.user._id },
        { targetClassroom: { $exists: false }, department: { $exists: false } }
      ];
    } else if (req.user?.role === 'admin') {
      if (classroomId) filter.targetClassroom = classroomId;
      if (departmentId) filter.department = departmentId;
    }

    const announcements = await Announcement.find(filter)
      .populate('targetClassroom', 'className semester section')
      .populate('department', 'name code')
      .populate('faculty', 'name email')
      .sort({ publishDate: -1, createdAt: -1 });

    res.status(200).json({ success: true, announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, message, priority, targetClassroom, department, publishDate, expiryDate } = req.body;

  if (!title || !message) {
    res.status(400).json({ success: false, message: 'Please provide title and message.' });
    return;
  }

  try {
    const announcement = await Announcement.create({
      title,
      message,
      priority: priority || 'medium',
      targetClassroom: targetClassroom || undefined,
      department: department || undefined,
      faculty: req.user?._id,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });

    await logActivity(req, req.user?.name || 'User', 'Announcement Published', title);

    res.status(201).json({ success: true, announcement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, message, priority, targetClassroom, department, publishDate, expiryDate } = req.body;

  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }

    if (req.user?.role !== 'admin' && announcement.faculty.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to edit this announcement.' });
      return;
    }

    if (title) announcement.title = title;
    if (message) announcement.message = message;
    if (priority) announcement.priority = priority;
    if (targetClassroom !== undefined) announcement.targetClassroom = targetClassroom || undefined;
    if (department !== undefined) announcement.department = department || undefined;
    if (publishDate) announcement.publishDate = new Date(publishDate);
    if (expiryDate !== undefined) announcement.expiryDate = expiryDate ? new Date(expiryDate) : undefined;

    await announcement.save();

    await logActivity(req, req.user?.name || 'User', 'Announcement Updated', announcement.title);

    res.status(200).json({ success: true, announcement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }

    if (req.user?.role !== 'admin' && announcement.faculty.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to delete this announcement.' });
      return;
    }

    await Announcement.findByIdAndDelete(id);

    await logActivity(req, req.user?.name || 'User', 'Announcement Deleted', announcement.title);

    res.status(200).json({ success: true, message: 'Announcement deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
