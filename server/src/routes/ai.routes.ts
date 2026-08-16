import express, { Request, Response } from 'express';
import {
    chat, history, deleteHistory, uploadDocument, summarizeDocument,
    renameHistory, healthCheck, listDocuments, deleteDocument
} from '../controllers/ai.controller.js';
import {
    generateNotes,
    generateFlashcards,
    generateQuiz,
    generateStudyPlan,
    generateAssignment,
    generateQuestionPaper,
    generateLessonPlan,
    generateNoticeReport,
    listSavedItems,
    getSavedItem,
    updateSavedItem,
    deleteSavedItem,
    globalSearch,
    generateStudyMaterial,
    generateRubric,
    generateClassroomAssistant,
    generatePerformanceSummary,
    generateAnnouncement,
    generateDeptAnalytics,
    generateUserActivitySum,
    generatePolicyGen,
    generateDashboardInsights,
    generateInstitutionStats
} from '../controllers/aiAcademic.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeRole } from '../middleware/role.middleware.js';
import { aiRateLimiter } from '../middleware/aiRateLimit.middleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

// Public
router.get('/health', healthCheck);

// Protected
router.use(protect);
router.post('/chat', aiRateLimiter, chat);
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/history', history);
router.delete('/history/:id', deleteHistory);
router.put('/history/:id', renameHistory);
router.get('/documents', listDocuments);
router.delete('/documents/:id', deleteDocument);

// Academic Tools (Student level)
router.post('/notes', authorizeRole('student', 'faculty', 'admin'), aiRateLimiter, generateNotes);
router.post('/flashcards', authorizeRole('student', 'faculty', 'admin'), aiRateLimiter, generateFlashcards);
router.post('/quiz', authorizeRole('student', 'faculty', 'admin'), aiRateLimiter, generateQuiz);
router.post('/study-plan', authorizeRole('student', 'faculty', 'admin'), aiRateLimiter, generateStudyPlan);
router.post('/assignment', authorizeRole('student', 'faculty', 'admin'), aiRateLimiter, generateAssignment);

// Faculty & Admin Academic tools
router.post('/question-paper', authorizeRole('faculty', 'admin'), aiRateLimiter, generateQuestionPaper);
router.post('/lesson-plan', authorizeRole('faculty', 'admin'), aiRateLimiter, generateLessonPlan);
router.post('/study-material', authorizeRole('faculty', 'admin'), aiRateLimiter, generateStudyMaterial);
router.post('/rubric', authorizeRole('faculty', 'admin'), aiRateLimiter, generateRubric);
router.post('/classroom-assistant', authorizeRole('faculty', 'admin'), aiRateLimiter, generateClassroomAssistant);
router.post('/performance-summary', authorizeRole('faculty', 'admin'), aiRateLimiter, generatePerformanceSummary);
router.post('/announcement', authorizeRole('faculty', 'admin'), aiRateLimiter, generateAnnouncement);

// Admin notices/reports
router.post('/notice-report', authorizeRole('admin'), aiRateLimiter, generateNoticeReport);
router.post('/dept-analytics', authorizeRole('admin'), aiRateLimiter, generateDeptAnalytics);
router.post('/user-activity-sum', authorizeRole('admin'), aiRateLimiter, generateUserActivitySum);
router.post('/policy-gen', authorizeRole('admin'), aiRateLimiter, generatePolicyGen);
router.post('/dashboard-insights', authorizeRole('admin'), aiRateLimiter, generateDashboardInsights);
router.post('/institution-stats', authorizeRole('admin'), aiRateLimiter, generateInstitutionStats);

// Global search and dynamic library CRUD
router.get('/search', globalSearch);
router.get('/saved-items', listSavedItems);
router.get('/saved-items/:collection/:id', getSavedItem);
router.put('/saved-items/:collection/:id', updateSavedItem);
router.delete('/saved-items/:collection/:id', deleteSavedItem);

export default router;

