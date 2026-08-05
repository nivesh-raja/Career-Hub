import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import Assignment from '../models/assignment.model.js';
import Classroom from '../models/classroom.model.js';
import { logActivity } from '../utils/activityLogger.js';
import { logTimelineEvent } from '../utils/timelineLogger.js';

export const getAssignments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { classroomId, subjectId } = req.query;
    const filter: any = {};

    if (classroomId) filter.classroom = classroomId;
    if (subjectId) filter.subject = subjectId;

    if (req.user?.role === 'student') {
      // Students can only see assignments for their assigned classroom
      if (!req.user.classroom) {
        res.status(200).json({ success: true, assignments: [] });
        return;
      }
      filter.classroom = req.user.classroom;
      filter.status = 'Published'; // Only see published ones
    } else if (req.user?.role === 'faculty') {
      filter.faculty = req.user._id;
    }

    const assignments = await Assignment.find(filter)
      .populate('classroom', 'className semester section')
      .populate('subject', 'name code')
      .populate('faculty', 'name email');

    res.status(200).json({ success: true, assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, subject, classroom, dueDate, maxMarks, attachments, status } = req.body;

  if (!title || !description || !subject || !classroom || !dueDate || !maxMarks) {
    res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    return;
  }

  try {
    const assignment = await Assignment.create({
      title,
      description,
      subject,
      classroom,
      faculty: req.user?._id,
      dueDate: new Date(dueDate),
      maxMarks,
      attachments: attachments || [],
      status: status || 'Published',
    });

    await logActivity(req, req.user?.name || 'Faculty', 'Assignment Created', title);
    logTimelineEvent({ userId: req.user!._id.toString(), role: 'faculty', activityType: 'assignment_creation', module: 'assignments', title: `Published Assignment: ${title}`, description: `New assignment due ${new Date(dueDate).toLocaleDateString()}, max marks: ${maxMarks}.`, icon: 'file-plus', color: 'blue' });

    res.status(201).json({ success: true, assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAssignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, subject, classroom, dueDate, maxMarks, attachments, status } = req.body;

  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found.' });
      return;
    }

    if (req.user?.role === 'faculty' && assignment.faculty.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to edit this assignment.' });
      return;
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (subject) assignment.subject = subject;
    if (classroom) assignment.classroom = classroom;
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (maxMarks) assignment.maxMarks = maxMarks;
    if (attachments) assignment.attachments = attachments;
    if (status) assignment.status = status;

    await assignment.save();

    await logActivity(req, req.user?.name || 'Faculty', 'Assignment Updated', assignment.title);
    logTimelineEvent({ userId: req.user!._id.toString(), role: 'faculty', activityType: 'assignment_update', module: 'assignments', title: `Updated Assignment: ${assignment.title}`, description: `Assignment details modified.`, icon: 'edit', color: 'amber' });

    res.status(200).json({ success: true, assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAssignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found.' });
      return;
    }

    if (req.user?.role === 'faculty' && assignment.faculty.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to delete this assignment.' });
      return;
    }

    await Assignment.findByIdAndDelete(id);

    await logActivity(req, req.user?.name || 'Faculty', 'Assignment Deleted', assignment.title);
    logTimelineEvent({ userId: req.user!._id.toString(), role: req.user!.role as any, activityType: 'assignment_deletion', module: 'assignments', title: `Deleted Assignment: ${assignment.title}`, description: `Assignment permanently removed.`, icon: 'trash-2', color: 'rose' });

    res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
