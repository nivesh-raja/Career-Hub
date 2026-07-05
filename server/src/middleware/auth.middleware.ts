import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import User, { IUser } from '../models/user.model.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // Extract Bearer token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, access token is missing' });
    return;
  }

  try {
    const decoded = verifyToken(token) as DecodedToken;

    // Load active user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Not authorized, user profile not found' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Your user account is currently deactivated' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, invalid or expired access token' });
  }
};
