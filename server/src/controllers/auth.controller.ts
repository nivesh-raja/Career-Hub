import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import User from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { logActivity } from '../utils/activityLogger.js';
import { logTimelineEvent } from '../utils/timelineLogger.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, department, phone, profileImage } = req.body;

  // Basic validation
  if (!name || !email || !password || !role) {
    res.status(400).json({ success: false, message: 'Please provide name, email, password, and role.' });
    return;
  }

  // Validate password length
  if (password.length < 6) {
    res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    return;
  }

  // Validate role
  if (!['student', 'faculty', 'admin'].includes(role)) {
    res.status(400).json({ success: false, message: 'Invalid user role specified.' });
    return;
  }

  try {
    // Check if user already exists in Atlas
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    // Create user (password is automatically hashed by model pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role,
      department: department || undefined,
      phone: phone || '',
      profileImage: profileImage || '',
      isActive: true,
    });

    const token = generateToken((user._id as any).toString(), user.role);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      profileImage: user.profileImage,
      isActive: user.isActive,
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
    });

    await logActivity(req, user.name || 'Unknown', 'User Created', user.name);
    logTimelineEvent({ userId: (user._id as any).toString(), role: user.role as any, activityType: 'register', module: 'authentication', title: 'Account Created', description: `New ${user.role} account registered with email ${user.email}.`, icon: 'user-plus', color: 'emerald' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Please provide email and password.' });
    return;
  }

  try {
    // Check for user in Atlas
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    // Check account status
    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account disabled.' });
      return;
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Incorrect password.' });
      return;
    }

    // Generate JWT token
    const token = generateToken((user._id as any).toString(), user.role);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      profileImage: user.profileImage,
      isActive: user.isActive,
    };

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });

    await logActivity(req, user.name || 'Unknown', 'User Login', user.name);
    logTimelineEvent({ userId: (user._id as any).toString(), role: user.role as any, activityType: 'login', module: 'authentication', title: 'Signed In', description: `User logged in successfully.`, icon: 'log-in', color: 'blue' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile details
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated. Session context missing.' });
      return;
    }

    const user = await User.findById(req.user._id).populate('department', 'name code');
    if (!user) {
      res.status(404).json({ success: false, message: 'User profile not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout active session
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response): Promise<void> => {
  if ((req as any).user) {
    await logActivity(req, (req as any).user.name || 'Unknown', 'User Logout', (req as any).user.name);
    logTimelineEvent({ userId: (req as any).user._id.toString(), role: (req as any).user.role, activityType: 'logout', module: 'authentication', title: 'Signed Out', description: 'User session ended.', icon: 'log-out', color: 'slate' });
  }
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
