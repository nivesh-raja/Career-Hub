import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';

export const authorizeRole = (...roles: Array<'student' | 'faculty' | 'admin'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated, user context missing' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Role '${req.user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
};

export const adminOnly = authorizeRole('admin');
export const facultyOnly = authorizeRole('faculty');
export const studentOnly = authorizeRole('student');
