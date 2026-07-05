import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import Submission from '../models/submission.model.js';
import Assignment from '../models/assignment.model.js';
import User from '../models/user.model.js';
import { logActivity } from '../utils/activityLogger.js';

export const getSubmissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.query;
    const filter: any = {};

    if (assignmentId) filter.assignment = assignmentId;

    if (req.user?.role === 'student') {
      filter.student = req.user._id;
    }

    const submissions = await Submission.find(filter)
      .populate({
        path: 'assignment',
        select: 'title dueDate maxMarks subject',
        populate: { path: 'subject', select: 'name code' }
      })
      .populate('student', 'name email department phone');

    res.status(200).json({ success: true, submissions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubmission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { assignment, files } = req.body;

  if (!assignment || !files || !Array.isArray(files) || files.length === 0) {
    res.status(400).json({ success: false, message: 'Please provide assignment reference and files.' });
    return;
  }

  try {
    const targetAssignment = await Assignment.findById(assignment);
    if (!targetAssignment) {
      res.status(404).json({ success: false, message: 'Assignment not found.' });
      return;
    }

    // Check if classroom matches
    if (req.user?.classroom?.toString() !== targetAssignment.classroom.toString()) {
      res.status(403).json({ success: false, message: 'You are not enrolled in this classroom section.' });
      return;
    }

    // Determine if late
    const isLate = new Date() > new Date(targetAssignment.dueDate);
    const status = isLate ? 'Late' : 'Submitted';

    // Check if submission already exists (update or create)
    let submission = await Submission.findOne({ assignment, student: req.user._id });
    if (submission) {
      submission.files = files;
      submission.submissionDate = new Date();
      submission.status = status;
      await submission.save();
    } else {
      submission = await Submission.create({
        assignment,
        student: req.user._id,
        files,
        status,
        submissionDate: new Date(),
      });
    }

    res.status(201).json({ success: true, submission });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewSubmission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { feedback, marks, status } = req.body;

  if (marks === undefined) {
    res.status(400).json({ success: false, message: 'Please provide marks.' });
    return;
  }

  try {
    const submission = await Submission.findById(id)
      .populate('assignment')
      .populate('student', 'name');

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found.' });
      return;
    }

    const assignment = submission.assignment as any;
    if (req.user?.role === 'faculty' && assignment.faculty.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to grade this assignment.' });
      return;
    }

    if (marks > assignment.maxMarks) {
      res.status(400).json({ success: false, message: `Marks cannot exceed max marks of ${assignment.maxMarks}.` });
      return;
    }

    submission.feedback = feedback || '';
    submission.marks = marks;
    submission.status = status || 'Reviewed';

    await submission.save();

    const studentName = (submission.student as any)?.name || 'Student';
    await logActivity(req, req.user?.name || 'Faculty', 'Submission Reviewed', studentName);

    res.status(200).json({ success: true, submission });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
