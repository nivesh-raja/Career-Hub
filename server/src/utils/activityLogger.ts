import { Request } from 'express';
import ActivityLog from '../models/activityLog.model.js';

export const logActivity = async (req: Request, adminName: string, action: string, targetUser?: string): Promise<void> => {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || 
                      req.ip || 
                      req.socket.remoteAddress || 
                      '127.0.0.1';

    await ActivityLog.create({
      adminName,
      action,
      targetUser: targetUser || undefined,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to log system activity:', error);
  }
};
