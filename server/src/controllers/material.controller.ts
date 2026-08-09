import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import Material from '../models/material.model.js';
import Classroom from '../models/classroom.model.js';
import { logActivity } from '../utils/activityLogger.js';
import { logTimelineEvent } from '../utils/timelineLogger.js';

export const getMaterials = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { classroomId, subjectId, category } = req.query;
    const filter: any = {};

    if (classroomId) filter.classroom = classroomId;
    if (subjectId) filter.subject = subjectId;
    if (category) filter.category = category;

    if (req.user?.role === 'student') {
      let classroomId = req.user.classroom;
      if (!classroomId) {
        const studentClassroom = await Classroom.findOne({ students: req.user._id });
        classroomId = studentClassroom?._id;
      }
      if (!classroomId) {
        res.status(200).json({ success: true, materials: [] });
        return;
      }
      filter.classroom = classroomId;
    } else if (req.user?.role === 'faculty') {
      filter.faculty = req.user._id;
    }

    const materials = await Material.find(filter)
      .populate('classroom', 'className semester section')
      .populate('subject', 'name code')
      .populate('faculty', 'name email');

    res.status(200).json({ success: true, materials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMaterial = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, subject, classroom, category, fileUrl } = req.body;

  if (!title || !subject || !classroom || !category || !fileUrl) {
    res.status(400).json({ success: false, message: 'Please provide title, subject, classroom, category, and file URL.' });
    return;
  }

  try {
    const material = await Material.create({
      title,
      description,
      subject,
      classroom,
      category,
      fileUrl,
      faculty: req.user?._id,
    });

    await logActivity(req, req.user?.name || 'Faculty', 'Material Uploaded', title);
    logTimelineEvent({ userId: req.user!._id.toString(), role: 'faculty', activityType: 'material_upload', module: 'documents', title: `Uploaded Material: ${title}`, description: `Study material published under category "${category}".`, icon: 'book-open', color: 'indigo' });

    res.status(201).json({ success: true, material });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMaterial = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, subject, classroom, category, fileUrl } = req.body;

  try {
    const material = await Material.findById(id);
    if (!material) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    if (req.user?.role === 'faculty' && material.faculty.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to edit this material.' });
      return;
    }

    if (title) material.title = title;
    if (description) material.description = description;
    if (subject) material.subject = subject;
    if (classroom) material.classroom = classroom;
    if (category) material.category = category;
    if (fileUrl) material.fileUrl = fileUrl;

    await material.save();

    await logActivity(req, req.user?.name || 'Faculty', 'Material Updated', material.title);

    res.status(200).json({ success: true, material });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMaterial = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const material = await Material.findById(id);
    if (!material) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    if (req.user?.role === 'faculty' && material.faculty.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'You are not authorized to delete this material.' });
      return;
    }

    await Material.findByIdAndDelete(id);

    await logActivity(req, req.user?.name || 'Faculty', 'Material Deleted', material.title);

    res.status(200).json({ success: true, message: 'Material deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const incrementDownloads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const material = await Material.findById(id);
    if (!material) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    material.downloads = (material.downloads || 0) + 1;
    await material.save();
    if (req.user) {
      logTimelineEvent({ userId: req.user._id.toString(), role: req.user.role as any, activityType: 'material_viewed', module: 'documents', title: `Downloaded: ${material.title}`, description: `Study material accessed for review.`, icon: 'download', color: 'cyan' });
    }

    res.status(200).json({ success: true, downloads: material.downloads });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
