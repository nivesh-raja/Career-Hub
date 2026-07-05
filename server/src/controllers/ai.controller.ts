import { Response, Request } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { callAI, runHealthCheck } from '../services/ai.service.js';
import { processAndEmbedDocument, retrieveRelevantChunks } from '../services/document.service.js';
import AIChat from '../models/aiChat.model.js';
import AIDocument from '../models/aiDocument.model.js';
import DocumentChunk from '../models/documentChunk.model.js';
import { logActivity } from '../utils/activityLogger.js';

// ── Health check (public) ───────────────────────────────────────────
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
    const result = await runHealthCheck();
    const status = result.overall === 'OK' ? 200 : result.overall === 'DEGRADED' ? 207 : 503;
    res.status(status).json({ success: result.overall !== 'DOWN', ...result });
};

// ── Chat with RAG context injection ────────────────────────────────
export const chat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { prompt, subjectId } = req.body;
    if (!prompt || !String(prompt).trim()) {
        res.status(400).json({ success: false, message: 'Prompt is required.' });
        return;
    }

    try {
        const SYSTEM = `You are Career Hub AI, an academic assistant for colleges and universities.
Answer clearly, professionally, and helpfully.
For academic topics provide structured, detailed responses with examples.
Support Markdown formatting including code blocks, bullet lists, and tables.

Strict Domain & RAG Rules:
1. You must only answer academic, professional, courses, or college/university related questions.
2. If the user's query is on general knowledge, sports, pop culture, news, or non-academic topics (e.g., FIFA world cup, capitals of countries, celebrities), you must decline to answer clearly and politely, stating that it is outside your academic focus.
3. If DOCUMENT CONTEXT is provided, you must prioritize and rely on that context. If the query asks about the documents but the context does not contain the answer, state that you cannot answer because the uploaded documents do not contain that information, and do not cite the document.
4. Never mention internal implementation details, mock responses, API keys, or development mode.`;

        // Retrieve relevant document chunks for RAG
        let contextBlock = '';
        let sourceDocuments: string[] = [];
        try {
            const chunks = await retrieveRelevantChunks(prompt, String(req.user?._id), 5);
            if (chunks.length > 0) {
                const byFile: Record<string, string[]> = {};
                chunks.forEach(c => {
                    if (!byFile[c.filename]) byFile[c.filename] = [];
                    byFile[c.filename].push(c.text);
                });
                sourceDocuments = Object.keys(byFile);
                contextBlock = `\n\n---\nDOCUMENT CONTEXT (from your uploaded files):\n` +
                    Object.entries(byFile).map(([f, texts]) =>
                        `📄 Source: "${f}"\n${texts.join('\n')}`
                    ).join('\n\n') + '\n---\n';
            }
        } catch (e) {
            // RAG failure is non-fatal — continue with general response
        }

        const messages: { role: 'system' | 'user'; content: string }[] = [
            { role: 'system', content: SYSTEM + contextBlock },
            { role: 'user', content: prompt },
        ];

        let responseText = '';
        try {
            responseText = await callAI(messages);
            if (sourceDocuments.length > 0) {
                responseText += `\n\n---\n*📎 Sources: ${sourceDocuments.join(', ')}*`;
            }
        } catch (apiError: any) {
            const code = apiError?.message?.match(/HTTP (\d+)/)?.[1] || 'unknown';
            console.error(`[AI Error HTTP ${code}]:`, apiError.message);
            responseText = `AI service is temporarily unavailable. Please try again later. (Error ${code})`;
        }

        const chatDoc = await AIChat.create({
            user: req.user?._id,
            prompt,
            response: responseText,
            role: req.user?.role,
            subject: subjectId || undefined,
            conversationTitle: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
            sourceDocuments,
        });

        await logActivity(req, req.user?.name || 'User', 'AI Chat', String(req.user?.name));
        res.status(200).json({ success: true, response: responseText, chat: chatDoc, sourceDocuments });
    } catch (error: any) {
        console.error('[Chat error]:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── History ─────────────────────────────────────────────────────────
export const history = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const chats = await AIChat.find({ user: req.user?._id }).sort({ createdAt: -1 }).limit(50);
        res.status(200).json({ success: true, chats });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Delete chat ─────────────────────────────────────────────────────
export const deleteHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await AIChat.findOneAndDelete({ _id: id, user: req.user?._id });
        await logActivity(req, req.user?.name || 'User', 'Conversation Deleted', id);
        res.status(200).json({ success: true, message: 'Deleted.' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Rename chat ─────────────────────────────────────────────────────
export const renameHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title } = req.body;
    try {
        const chatDoc = await AIChat.findOneAndUpdate(
            { _id: id, user: req.user?._id },
            { conversationTitle: title },
            { new: true }
        );
        if (!chatDoc) { res.status(404).json({ success: false, message: 'Chat not found.' }); return; }
        await logActivity(req, req.user?.name || 'User', 'Conversation Renamed', title);
        res.status(200).json({ success: true, chat: chatDoc });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Document upload + RAG processing ────────────────────────────────
export const uploadDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const file = (req as any).file;
        if (!file) {
            res.status(400).json({ success: false, message: 'Please upload a document file.' });
            return;
        }

        const ALLOWED_TYPES = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'text/markdown',
        ];
        if (!ALLOWED_TYPES.includes(file.mimetype) && !file.originalname.endsWith('.md')) {
            res.status(400).json({ success: false, message: `Unsupported file type. Supported: PDF, DOCX, DOC, TXT, MD.` });
            return;
        }

        const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
        if (file.size > MAX_SIZE) {
            res.status(400).json({ success: false, message: 'File too large. Maximum size is 10 MB.' });
            return;
        }

        const doc = await processAndEmbedDocument(
            file.buffer,
            file.mimetype,
            file.originalname,
            String(req.user?._id),
            req.user?.role as string,
            'UserUpload'
        );

        await logActivity(req, req.user?.name || 'User', 'Document Uploaded (AI)', file.originalname);
        res.status(201).json({
            success: true,
            document: doc,
            message: `Document "${file.originalname}" uploaded and processing started. Ask questions about it in chat!`,
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ── List user's documents ─────────────────────────────────────────
export const listDocuments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const docs = await AIDocument.find({ uploader: req.user?._id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, documents: docs });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Delete document + chunks ──────────────────────────────────────
export const deleteDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const doc = await AIDocument.findOneAndDelete({ _id: id, uploader: req.user?._id });
        if (!doc) { res.status(404).json({ success: false, message: 'Document not found.' }); return; }
        await DocumentChunk.deleteMany({ documentId: id });
        await logActivity(req, req.user?.name || 'User', 'Document Deleted', doc.filename);
        res.status(200).json({ success: true, message: `Document "${doc.filename}" and all its chunks deleted.` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Summarize stub ────────────────────────────────────────────────
export const summarizeDocument = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json({ success: true, message: 'Use /chat with a summarization prompt.' });
};
