import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODEL = 'google/gemini-2.5-flash';

// ── Startup diagnostics ──────────────────────────────────────────────
if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables.');
} else {
    console.log('✓ OpenRouter API Key Loaded');
    console.log('✓ AI SDK Initialized (OpenRouter → google/gemini-flash-1.5)');
}

// ── Core chat function ───────────────────────────────────────────────
interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export const callAI = async (messages: OpenRouterMessage[]): Promise<string> => {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY missing from environment.');
    }

    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'Career Hub AI',
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            max_tokens: 2048,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errBody}`);
    }

    const data: any = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenRouter.');
    return text;
};

// ── Health check ─────────────────────────────────────────────────────
export const runHealthCheck = async (): Promise<{
    envLoaded: boolean;
    apiKeyPresent: boolean;
    geminiReachable: boolean;
    modelAvailable: boolean;
    overall: 'OK' | 'DEGRADED' | 'DOWN';
    testResponse?: string;
    error?: string;
}> => {
    const envLoaded = true;
    const apiKeyPresent = !!OPENROUTER_API_KEY;

    if (!apiKeyPresent) {
        return { envLoaded, apiKeyPresent, geminiReachable: false, modelAvailable: false, overall: 'DOWN', error: 'API key missing.' };
    }

    try {
        const text = await callAI([{ role: 'user', content: 'Reply with only the word: SUCCESS' }]);
        console.log('✓ Gemini Model Connected via OpenRouter — test response:', text);
        const modelAvailable = text.toLowerCase().includes('success');
        return { envLoaded, apiKeyPresent, geminiReachable: true, modelAvailable, overall: modelAvailable ? 'OK' : 'DEGRADED', testResponse: text };
    } catch (err: any) {
        console.error('❌ Health check failed:', err.message);
        return { envLoaded, apiKeyPresent, geminiReachable: false, modelAvailable: false, overall: 'DOWN', error: err.message };
    }
};

// ── Legacy exports used by controller ────────────────────────────────
// getGeminiModel is no longer needed — controller uses callAI directly
export const getGeminiModel = () => { throw new Error('Deprecated. Use callAI() instead.'); };
export const getEmbeddings = () => { throw new Error('Embeddings not available without local model.'); };
export const getVectorStore = async () => { throw new Error('ChromaDB not running.'); };

// Re-export processAndEmbedDocument for controller
export { processAndEmbedDocument } from './document.service.js';
