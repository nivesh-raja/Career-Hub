import dotenv from 'dotenv';
import { callCentralizedAI, OpenRouterMessage } from './openrouter.service.js';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

// ── Startup diagnostics ──────────────────────────────────────────────
if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables.');
} else {
    console.log('✓ OpenRouter API Key Loaded');
    console.log('✓ AI SDK Initialized via OpenRouter');
}

export const callAI = async (messages: OpenRouterMessage[], userId?: string): Promise<string> => {
    return callCentralizedAI(messages, userId);
};

// ── Health check ─────────────────────────────────────────────────────
export const runHealthCheck = async (): Promise<{
    envLoaded: boolean;
    apiKeyPresent: boolean;
    openRouterReachable: boolean;
    modelAvailable: boolean;
    overall: 'OK' | 'DEGRADED' | 'DOWN';
    testResponse?: string;
    error?: string;
}> => {
    const envLoaded = true;
    const apiKeyPresent = !!OPENROUTER_API_KEY;

    if (!apiKeyPresent) {
        return { envLoaded, apiKeyPresent, openRouterReachable: false, modelAvailable: false, overall: 'DOWN', error: 'API key missing.' };
    }

    try {
        const text = await callAI([{ role: 'user', content: 'Reply with only the word: SUCCESS' }]);
        console.log('✓ Model Connected via OpenRouter — test response:', text);
        const modelAvailable = text.toLowerCase().includes('success');
        return { envLoaded, apiKeyPresent, openRouterReachable: true, modelAvailable, overall: modelAvailable ? 'OK' : 'DEGRADED', testResponse: text };
    } catch (err: any) {
        console.error('❌ Health check failed:', err.message);
        return { envLoaded, apiKeyPresent, openRouterReachable: false, modelAvailable: false, overall: 'DOWN', error: err.message };
    }
};

// ── Legacy exports used by controller ────────────────────────────────
// getGeminiModel is no longer needed — controller uses callAI directly
export const getGeminiModel = () => { throw new Error('Deprecated. Use callAI() instead.'); };
export const getEmbeddings = () => { throw new Error('Embeddings not available without local model.'); };
export const getVectorStore = async () => { throw new Error('ChromaDB not running.'); };

// Re-export processAndEmbedDocument for controller
export { processAndEmbedDocument } from './document.service.js';
