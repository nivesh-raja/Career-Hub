import { Response, Request } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import User from '../models/user.model.js';
import Department from '../models/department.model.js';
import Classroom from '../models/classroom.model.js';
import Subject from '../models/subject.model.js';
import ActivityLog from '../models/activityLog.model.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get dashboard stats for Admin
// @route   GET /api/admin/stats
// @access  Private (Admin Only)
export const getAdminStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let totalUsers = 0;
    let totalStudents = 0;
    let totalFaculty = 0;
    let totalAdmins = 0;
    let totalDepartments = 0;
    let totalClassrooms = 0;
    let activeUsers = 0;
    let inactiveUsers = 0;

    if (isDbConnected) {
      totalUsers = await User.countDocuments();
      totalStudents = await User.countDocuments({ role: 'student' });
      totalFaculty = await User.countDocuments({ role: 'faculty' });
      totalAdmins = await User.countDocuments({ role: 'admin' });
      totalDepartments = await Department.countDocuments();
      totalClassrooms = await Classroom.countDocuments();
      activeUsers = await User.countDocuments({ status: 'Active' });
      inactiveUsers = await User.countDocuments({ status: 'Inactive' });
    }

    // Retrieve active log events from collection
    const dbLogs = await ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    const recentActivity = dbLogs.map(log => ({
      id: log._id.toString(),
      action: log.action,
      details: `${log.action} ${log.targetUser ? `on target ${log.targetUser}` : ''}`,
      timestamp: log.createdAt.toISOString(),
      user: log.adminName,
    }));

    // announcements
    const announcements = [
      {
        id: 'ann-1',
        title: 'Platform Phase 1 Launch',
        content: 'The core foundations, authentication, and layouts of Career Hub are now active.',
        date: new Date().toLocaleDateString(),
        priority: 'high',
      },
      {
        id: 'ann-2',
        title: 'ERP Administration Upgraded',
        content: 'Institutional User and Classroom management modules are now live with Atlas sync.',
        date: new Date().toLocaleDateString(),
        priority: 'medium',
      },
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalAdmins,
        totalDepartments,
        totalClassrooms,
        activeUsers,
        inactiveUsers,
      },
      recentActivity,
      announcements,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// USER DIRECTORY AND ACCOUNT CRUD
// ==========================================

// @desc    Get all users (with filters)
// @route   GET /api/admin/users
// @access  Private (Admin Only)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({})
      .populate('department', 'name code')
      .populate('classroom', 'className semester section');
    res.status(200).json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/admin/users/:id
// @access  Private (Admin Only)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, phone, department, classroom, status, password } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const previousClassroomId = user.classroom;

    // Apply updates
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    
    if (department !== undefined) {
      user.department = department ? new mongoose.Types.ObjectId(department) : undefined;
    }
    
    if (classroom !== undefined) {
      user.classroom = classroom ? new mongoose.Types.ObjectId(classroom) : undefined;
    }
    
    if (status) {
      user.status = status;
      user.isActive = status === 'Active';
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await logActivity(req, (req as any).user?.name || 'System Admin', 'Password Reset', user.name);
    }

    await user.save();

    // Synchronize Classroom collections if student's classroom assignment changed
    if (user.role === 'student' && classroom !== undefined) {
      const newClassroomId = classroom ? new mongoose.Types.ObjectId(classroom) : null;
      
      // If student was removed from a classroom
      if (previousClassroomId && String(previousClassroomId) !== String(newClassroomId)) {
        await Classroom.findByIdAndUpdate(previousClassroomId, {
          $pull: { students: user._id }
        });
      }
      
      // If student was added to a new classroom
      if (newClassroomId) {
        await Classroom.findByIdAndUpdate(newClassroomId, {
          $addToSet: { students: user._id }
        });
      }
    }

    // Log update action
    await logActivity(req, (req as any).user?.name || 'System Admin', 'Profile Updated', user.name);

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully.',
      user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role immediately
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin Only)
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['student', 'faculty', 'admin'].includes(role)) {
    res.status(400).json({ success: false, message: 'Invalid role selection.' });
    return;
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log role modification
    await logActivity(req, (req as any).user?.name || 'System Admin', `Role Changed (${oldRole} -> ${role})`, user.name);

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Patch user active status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin Only)
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Active', 'Inactive'].includes(status)) {
    res.status(400).json({ success: false, message: 'Invalid status value.' });
    return;
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    user.status = status;
    user.isActive = status === 'Active';
    await user.save();

    // Log status toggle
    await logActivity(req, (req as any).user?.name || 'System Admin', `Status Changed to ${status}`, user.name);

    res.status(200).json({
      success: true,
      message: `User status changed to ${status} successfully.`,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin Only)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Pull from classrooms before deletion
    if (user.role === 'student' && user.classroom) {
      await Classroom.findByIdAndUpdate(user.classroom, {
        $pull: { students: user._id }
      });
    } else if (user.role === 'faculty') {
      await Classroom.updateMany({ faculty: user._id }, { $unset: { faculty: "" } });
    }

    await User.findByIdAndDelete(id);

    // Log removal action
    await logActivity(req, (req as any).user?.name || 'System Admin', 'User Deleted', user.name);

    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// SYSTEM LOGS INQUIRIES
// ==========================================

// @desc    Get system logs
// @route   GET /api/admin/activity-logs
// @access  Private (Admin Only)
export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
