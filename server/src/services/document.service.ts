import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import AIDocument from '../models/aiDocument.model.js';
import DocumentChunk from '../models/documentChunk.model.js';
import dotenv from 'dotenv';
dotenv.config();

const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const EMBED_MODEL = 'text-embedding-ada-002'; // OpenRouter hosts this via Azure OpenAI

// ── Cosine similarity ────────────────────────────────────────────────
const cosineSimilarity = (a: number[], b: number[]): number => {
    if (a.length !== b.length || a.length === 0) return 0;
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return magA && magB ? dot / (magA * magB) : 0;
};

// ── Generate embedding vector via OpenRouter ─────────────────────────
export const generateEmbedding = async (text: string): Promise<number[]> => {
    if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY missing');

    try {
        const response = await fetch(`${OPENROUTER_BASE}/embeddings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model: EMBED_MODEL, input: text.substring(0, 8000) }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Embedding HTTP ${response.status}: ${err}`);
        }

        const data: any = await response.json();
        return data?.data?.[0]?.embedding ?? [];
    } catch {
        // Embedding failed — return empty (fallback to text search)
        return [];
    }
};

// ── Text extraction ──────────────────────────────────────────────────
export const extractText = async (buffer: Buffer, mimetype: string): Promise<string> => {
    if (mimetype === 'application/pdf') {
        let text = '';
        if (typeof pdfParse === 'function') {
            const result = await pdfParse(buffer);
            text = result.text;
        } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
            const parser = new pdfParse.PDFParse({ data: buffer });
            const result = await parser.getText();
            text = result.text;
        } else if (pdfParse && typeof pdfParse.default === 'function') {
            const result = await pdfParse.default(buffer);
            text = result.text;
        } else {
            throw new Error('Unsupported or unresolvable pdf-parse implementation.');
        }
        return text;
    }
    if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword'
    ) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }
    if (mimetype === 'text/plain' || mimetype === 'text/markdown' || mimetype.includes('text')) {
        return buffer.toString('utf-8');
    }
    throw new Error(`Unsupported file type: ${mimetype}. Supported: PDF, DOCX, DOC, TXT, MD.`);
};

// ── Main pipeline: extract → chunk → embed → store ───────────────────
export const processAndEmbedDocument = async (
    fileBuffer: Buffer,
    mimetype: string,
    filename: string,
    uploaderId: string,
    role: string,
    sourceType: string,
    subjectId?: string
) => {
    // 1. Extract text
    const text = await extractText(fileBuffer, mimetype);
    if (!text || text.trim().length < 10) throw new Error('No extractable text found in document.');

    // 2. Chunk text
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 150 });
    const rawChunks = await splitter.splitText(text);

    // 3. Create MongoDB document record
    const docId = new mongoose.Types.ObjectId();
    const aiDoc = await AIDocument.create({
        _id: docId,
        filename,
        originalName: filename,
        mimeType: mimetype,
        fileSize: fileBuffer.length,
        totalChunks: rawChunks.length,
        extractedTextLength: text.length,
        sourceType,
        uploader: uploaderId,
        role,
        subject: subjectId || undefined,
        processingStatus: 'processing',
    });

    // 4. Store chunks + embeddings asynchronously (non-blocking for large files)
    (async () => {
        for (let i = 0; i < rawChunks.length; i++) {
            const chunkText = rawChunks[i];
            const embedding = await generateEmbedding(chunkText);

            // Check if document was deleted during this background processing
            const exists = await AIDocument.findById(docId);
            if (!exists) {
                console.log(`⚠️ Document "${filename}" was deleted during processing. Cleaning up chunks.`);
                await DocumentChunk.deleteMany({ documentId: docId });
                return;
            }

            await DocumentChunk.create({
                documentId: docId,
                filename,
                chunkIndex: i,
                text: chunkText,
                embedding,
                uploader: uploaderId,
                role,
            });
        }
        await AIDocument.findByIdAndUpdate(docId, { processingStatus: 'ready' });
        console.log(`✓ Document "${filename}" processed: ${rawChunks.length} chunks stored.`);
    })().catch((e) => console.error('Chunk storage error:', e));

    return aiDoc;
};

// ── Semantic retrieval ────────────────────────────────────────────────
export const retrieveRelevantChunks = async (
    query: string,
    uploaderId: string,
    topK: number = 5
): Promise<{ text: string; filename: string; chunkIndex: number; score: number }[]> => {
    // Get all user's chunks
    const userChunks = await DocumentChunk.find({ uploader: uploaderId }).select('text filename chunkIndex embedding').lean();
    if (userChunks.length === 0) return [];

    const queryEmbedding = await generateEmbedding(query);

    let results: { text: string; filename: string; chunkIndex: number; score: number }[];

    if (queryEmbedding.length > 0 && userChunks.some(c => c.embedding?.length > 0)) {
        // Use cosine similarity if embeddings available
        results = userChunks
            .filter(c => c.embedding?.length > 0)
            .map(c => ({
                text: c.text,
                filename: c.filename,
                chunkIndex: c.chunkIndex,
                score: cosineSimilarity(queryEmbedding, c.embedding),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    } else {
        // Fallback: keyword-based TF-IDF approximation
        const queryWords = new Set(query.toLowerCase().split(/\W+/).filter(w => w.length > 3));
        results = userChunks
            .map(c => {
                const words = c.text.toLowerCase().split(/\W+/);
                const matches = words.filter(w => queryWords.has(w)).length;
                return { text: c.text, filename: c.filename, chunkIndex: c.chunkIndex, score: matches / Math.max(words.length, 1) };
            })
            .filter(c => c.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    return results;
};
