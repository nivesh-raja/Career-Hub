import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sanitizeMiddleware } from './middleware/sanitize.middleware.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import departmentRoutes from './routes/department.routes.js';
import classroomRoutes from './routes/classroom.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import materialRoutes from './routes/material.routes.js';
import questionPaperRoutes from './routes/questionPaper.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import timetableRoutes from './routes/timetable.routes.js';
import aiRoutes from './routes/ai.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

// Security Middlewares
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production', // Disable in development
});
app.use('/api', limiter);

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://your-vercel-domain.vercel.app'
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(sanitizeMiddleware);
app.use(cookieParser());

// Route Definitions
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/question-papers', questionPaperRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Base route check
app.get('/', (req, res) => {
  res.json({ message: 'Career Hub API is running.' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
