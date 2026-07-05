import { Request, Response } from 'express';
import Classroom from '../models/classroom.model.js';
import User from '../models/user.model.js';
import { logActivity } from '../utils/activityLogger.js';
import mongoose from 'mongoose';

// @desc    Get all classrooms
// @route   GET /api/classrooms
// @access  Private (Authenticated)
export const getClassrooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const classrooms = await Classroom.find({})
      .populate('department', 'name code')
      .populate('faculty', 'name email')
      .populate('students', 'name email status department')
      .populate('subjects', 'name code');
    res.status(200).json({ success: true, classrooms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create classroom
// @route   POST /api/classrooms
// @access  Private (Admin Only)
export const createClassroom = async (req: Request, res: Response): Promise<void> => {
  const { className, department, semester, section, faculty, students, subjects, capacity, academicYear, status } = req.body;

  if (!className || !department || !semester || !section || !academicYear) {
    res.status(400).json({ success: false, message: 'Please provide className, department, semester, section, and academicYear.' });
    return;
  }

  try {
    const classroom = await Classroom.create({
      className,
      department,
      semester,
      section,
      faculty: faculty || undefined,
      students: students || [],
      subjects: subjects || [],
      capacity: capacity || 60,
      academicYear,
      status: status || 'Active',
    });

    // Sync student documents in MongoDB
    if (students && students.length > 0) {
      const studentIds = students.map((id: string) => new mongoose.Types.ObjectId(id));
      await User.updateMany(
        { _id: { $in: studentIds } },
        { 
          $set: { 
            classroom: classroom._id,
            department: new mongoose.Types.ObjectId(department)
          } 
        }
      );
    }

    // Log classroom creation
    await logActivity(req, (req as any).user?.name || 'System Admin', 'Classroom Created', className);

    res.status(201).json({ success: true, classroom });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update classroom and sync student lists
// @route   PUT /api/classrooms/:id
// @access  Private (Admin Only)
export const updateClassroom = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { className, semester, section, faculty, students, subjects, capacity, academicYear, status } = req.body;

  try {
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      res.status(404).json({ success: false, message: 'Classroom not found.' });
      return;
    }

    const previousStudents = classroom.students.map(s => String(s));

    if (className) classroom.className = className;
    if (semester) classroom.semester = semester;
    if (section) classroom.section = section;
    if (capacity) classroom.capacity = capacity;
    if (academicYear) classroom.academicYear = academicYear;
    if (status) classroom.status = status;
    
    classroom.faculty = faculty ? new mongoose.Types.ObjectId(faculty) : undefined;
    
    if (students !== undefined) {
      classroom.students = students.map((s: string) => new mongoose.Types.ObjectId(s));
    }
    
    if (subjects !== undefined) {
      classroom.subjects = subjects.map((sub: string) => new mongoose.Types.ObjectId(sub));
    }

    await classroom.save();

    // Sync Student models
    if (students !== undefined) {
      const currentStudents = students.map((s: string) => String(s));
      
      // Removed students: students in previous but not in current list
      const removedStudents = previousStudents.filter((id: string) => !currentStudents.includes(id));
      if (removedStudents.length > 0) {
        await User.updateMany(
          { _id: { $in: removedStudents.map((id: string) => new mongoose.Types.ObjectId(id)) } },
          { $unset: { classroom: "" } }
        );
      }

      // Added students: students in current but not in previous list
      const addedStudents = currentStudents.filter((id: string) => !previousStudents.includes(id));
      if (addedStudents.length > 0) {
        await User.updateMany(
          { _id: { $in: addedStudents.map((id: string) => new mongoose.Types.ObjectId(id)) } },
          { 
            $set: { 
              classroom: classroom._id,
              department: classroom.department
            } 
          }
        );
      }
    }

    // Log updates
    await logActivity(req, (req as any).user?.name || 'System Admin', 'Classroom Updated', classroom.className);

    res.status(200).json({ success: true, message: 'Classroom updated successfully.', classroom });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete classroom and release students
// @route   DELETE /api/classrooms/:id
// @access  Private (Admin Only)
export const deleteClassroom = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const classroom = await Classroom.findById(id);
    if (!classroom) {
      res.status(404).json({ success: false, message: 'Classroom not found.' });
      return;
    }

    // Release enrolled students
    await User.updateMany(
      { classroom: classroom._id },
      { $unset: { classroom: "" } }
    );

    const name = classroom.className;
    await Classroom.findByIdAndDelete(id);

    // Log deletion
    await logActivity(req, (req as any).user?.name || 'System Admin', 'Classroom Deleted', name);

    res.status(200).json({ success: true, message: 'Classroom deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
