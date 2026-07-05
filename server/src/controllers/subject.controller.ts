import { Request, Response } from 'express';
import Subject from '../models/subject.model.js';

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find({}).populate('department', 'name code');
    res.status(200).json({ success: true, subjects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  const { name, code, department, credits, description } = req.body;

  if (!name || !code || !department) {
    res.status(400).json({ success: false, message: 'Please provide subject name, code, and department.' });
    return;
  }

  try {
    const subjectExists = await Subject.findOne({ code: code.toUpperCase() });
    if (subjectExists) {
      res.status(400).json({ success: false, message: 'A subject with this code already exists.' });
      return;
    }

    const subject = await Subject.create({
      name,
      code,
      department,
      credits: credits || 3,
      description,
    });

    res.status(201).json({ success: true, subject });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, code, department, credits, description } = req.body;

  try {
    const subject = await Subject.findById(id);
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found.' });
      return;
    }

    if (name) subject.name = name;
    if (code) subject.code = code.toUpperCase();
    if (department) subject.department = department;
    if (credits !== undefined) subject.credits = credits;
    if (description !== undefined) subject.description = description;

    await subject.save();
    res.status(200).json({ success: true, subject });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const subject = await Subject.findById(id);
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found.' });
      return;
    }

    await Subject.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

