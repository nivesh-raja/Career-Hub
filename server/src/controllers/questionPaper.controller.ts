import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import QuestionPaper from '../models/questionPaper.model.js';
import { logActivity } from '../utils/activityLogger.js';

export const getQuestionPapers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { departmentId, semester, subjectId, academicYear, category } = req.query;
    const filter: any = {};

    if (departmentId) filter.department = departmentId;
    if (semester) filter.semester = semester;
    if (subjectId) filter.subject = subjectId;
    if (academicYear) filter.academicYear = academicYear;
    if (category) filter.category = category;

    if (req.user?.role === 'student') {
      if (!req.user.department) {
        res.status(200).json({ success: true, questionPapers: [] });
        return;
      }
      filter.department = req.user.department;
    } else if (req.user?.role === 'faculty') {
      filter.faculty = req.user._id;
    }

    const questionPapers = await QuestionPaper.find(filter)
      .populate('department', 'name code')
      .populate('subject', 'name code')
      .populate('faculty', 'name email');

    res.status(200).json({ success: true, questionPapers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuestionPaper = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, fileUrl, department, semester, subject, academicYear, category } = req.body;

  if (!title || !fileUrl || !department || !semester || !subject || !academicYear || !category) {
    res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    return;
  }

  try {
    const questionPaper = await QuestionPaper.create({
      title,
      fileUrl,
      department,
      semester,
      subject,
      academicYear,
      category,
      faculty: req.user?._id,
    });

    await logActivity(req, req.user?.name || 'Faculty', 'Question Paper Uploaded', title);

    res.status(201).json({ success: true, questionPaper });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuestionPaper = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, fileUrl, department, semester, subject, academicYear, category } = req.body;

  try {
    const questionPaper = await QuestionPaper.findById(id);
    if (!questionPaper) {
      res.status(404).json({ success: false, message: 'Question paper not found.' });
      return;
    }

    if (req.user?.role === 'faculty' && questionPaper.faculty.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to edit this question paper.' });
      return;
    }

    if (title) questionPaper.title = title;
    if (fileUrl) questionPaper.fileUrl = fileUrl;
    if (department) questionPaper.department = department;
    if (semester) questionPaper.semester = semester;
    if (subject) questionPaper.subject = subject;
    if (academicYear) questionPaper.academicYear = academicYear;
    if (category) questionPaper.category = category;

    await questionPaper.save();

    await logActivity(req, req.user?.name || 'Faculty', 'Question Paper Updated', questionPaper.title);

    res.status(200).json({ success: true, questionPaper });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteQuestionPaper = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const questionPaper = await QuestionPaper.findById(id);
    if (!questionPaper) {
      res.status(404).json({ success: false, message: 'Question paper not found.' });
      return;
    }

    if (req.user?.role === 'faculty' && questionPaper.faculty.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to delete this question paper.' });
      return;
    }

    await QuestionPaper.findByIdAndDelete(id);

    await logActivity(req, req.user?.name || 'Faculty', 'Question Paper Deleted', questionPaper.title);

    res.status(200).json({ success: true, message: 'Question paper deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
