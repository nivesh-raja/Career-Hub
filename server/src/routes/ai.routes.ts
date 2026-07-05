import express, { Request, Response } from 'express';
import {
    chat, history, deleteHistory, uploadDocument, summarizeDocument,
    renameHistory, healthCheck, listDocuments, deleteDocument
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

// Public
router.get('/health', healthCheck);

// Protected
router.use(protect);
router.post('/chat', chat);
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/history', history);
router.delete('/history/:id', deleteHistory);
router.put('/history/:id', renameHistory);
router.get('/documents', listDocuments);
router.delete('/documents/:id', deleteDocument);

export default router;
