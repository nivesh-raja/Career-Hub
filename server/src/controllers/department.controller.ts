import { Request, Response } from 'express';
import Department from '../models/department.model.js';

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const depts = await Department.find({}).populate('head', 'name email');
    res.status(200).json({ success: true, departments: depts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  const { name, code, description, head } = req.body;

  if (!name || !code) {
    res.status(400).json({ success: false, message: 'Please provide department name and code.' });
    return;
  }

  try {
    const deptExists = await Department.findOne({ code: code.toUpperCase() });
    if (deptExists) {
      res.status(400).json({ success: false, message: 'A department with this code already exists.' });
      return;
    }

    const dept = await Department.create({
      name,
      code,
      description,
      head: head || undefined,
    });

    res.status(201).json({ success: true, department: dept });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
