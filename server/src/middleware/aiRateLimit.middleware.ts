import rateLimit from 'express-rate-limit';
import { Response, Request } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';

export const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 10, // Limit each user to 10 AI requests per windowMs
    keyGenerator: (req: Request): string => {
        const authReq = req as AuthenticatedRequest;
        return String(authReq.user?._id || authReq.user?.id || req.ip);
    },
    handler: (req: Request, res: Response): void => {
        res.status(429).json({
            success: false,
            code: 'AI_RATE_LIMITED',
            message: 'Too many AI requests. Please try again shortly.'
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Enable rate limiting in development as well, since it is a specific AI limit
    skip: () => false, 
});
