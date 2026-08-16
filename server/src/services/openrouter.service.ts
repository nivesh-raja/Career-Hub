import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const PRIMARY_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || 'google/gemini-2.5-flash';

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 12000; // Default: 12 seconds timeout per request
const MAX_ATTEMPTS = Number(process.env.AI_MAX_ATTEMPTS) || 2; // Default: 2 attempts per model
const CACHE_TTL_MS = 30000; // 30 seconds cache TTL

export interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export type AIErrorCode =
    | 'AI_RATE_LIMITED'
    | 'AI_AUTH_ERROR'
    | 'AI_CLIENT_ERROR'
    | 'AI_PROVIDER_ERROR'
    | 'AI_TIMEOUT'
    | 'AI_EMPTY_RESPONSE'
    | 'AI_UNAVAILABLE';

export class AIError extends Error {
    constructor(public code: AIErrorCode, message: string) {
        super(message);
        this.name = 'AIError';
    }
}

export const mapAIErrorToMessage = (error: any): string => {
    const code = error.code || (error.message?.includes('429') ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_ERROR');
    switch (code) {
        case 'AI_RATE_LIMITED':
            return 'AI service is temporarily busy. Please try again shortly.';
        case 'AI_AUTH_ERROR':
        case 'AI_CLIENT_ERROR':
        case 'AI_UNAVAILABLE':
            return 'AI service is temporarily unavailable. Please try again later.';
        case 'AI_TIMEOUT':
            return 'AI service took too long to respond. Please try again.';
        case 'AI_EMPTY_RESPONSE':
        case 'AI_PROVIDER_ERROR':
        default:
            return 'AI service is temporarily unavailable.';
    }
};

// In-memory user-scoped response cache
interface CacheEntry {
    response: string;
    expiry: number;
}
const responseCache = new Map<string, CacheEntry>();

const getCacheKey = (messages: OpenRouterMessage[], userId?: string): string => {
    const scope = userId ? `user:${userId}` : 'global';
    // Stringify only the contents to generate a robust deterministic key
    const payload = messages.map(m => `${m.role}:${m.content}`).join('\n');
    return `${scope}:${payload}`;
};

const getCachedResponse = (key: string): string | null => {
    const entry = responseCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        responseCache.delete(key);
        return null;
    }
    return entry.response;
};

const setCachedResponse = (key: string, response: string) => {
    responseCache.set(key, {
        response,
        expiry: Date.now() + CACHE_TTL_MS
    });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const executeRequest = async (
    model: string,
    messages: OpenRouterMessage[]
): Promise<string> => {
    if (!OPENROUTER_API_KEY) {
        throw new AIError('AI_AUTH_ERROR', 'OPENROUTER_API_KEY missing from environment.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Career Hub AI',
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: 4096,
                temperature: 0.7,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const status = response.status;
            let errText = '';
            try {
                errText = await response.text();
            } catch {}

            if (status === 429) {
                throw new AIError('AI_RATE_LIMITED', `HTTP 429: ${errText}`);
            }
            if (status === 401 || status === 403) {
                throw new AIError('AI_AUTH_ERROR', `HTTP ${status}: Authentication failed.`);
            }
            if (status === 400 || status === 404) {
                throw new AIError('AI_CLIENT_ERROR', `HTTP ${status}: Client error.`);
            }
            if (status === 402) {
                throw new AIError('AI_UNAVAILABLE', `HTTP 402: Payment required.`);
            }
            throw new AIError('AI_PROVIDER_ERROR', `HTTP ${status}: ${errText}`);
        }

        const data: any = await response.json();

        if (data?.error) {
            const errCode = data.error.code;
            const errMsg = data.error.message || 'Unknown OpenRouter internal error';
            if (errCode === 429) {
                throw new AIError('AI_RATE_LIMITED', errMsg);
            }
            if (errCode === 401 || errCode === 403) {
                throw new AIError('AI_AUTH_ERROR', errMsg);
            }
            if (errCode === 400 || errCode === 404) {
                throw new AIError('AI_CLIENT_ERROR', errMsg);
            }
            throw new AIError('AI_PROVIDER_ERROR', errMsg);
        }

        const text = data?.choices?.[0]?.message?.content;
        if (text === undefined || text === null || String(text).trim() === '') {
            throw new AIError('AI_EMPTY_RESPONSE', 'Returned response content was empty.');
        }

        return text;
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err instanceof AIError) {
            throw err;
        }
        if (err.name === 'AbortError') {
            throw new AIError('AI_TIMEOUT', 'OpenRouter request timed out.');
        }
        throw new AIError('AI_PROVIDER_ERROR', err.message || 'Network error.');
    }
};

export const callCentralizedAI = async (
    messages: OpenRouterMessage[],
    userId?: string
): Promise<string> => {
    const cacheKey = getCacheKey(messages, userId);
    const cached = getCachedResponse(cacheKey);
    if (cached !== null) {
        return cached;
    }

    let currentModel = PRIMARY_MODEL;
    let attempt = 0;
    const retryDelays = [500, 1000, 2000];

    while (attempt < MAX_ATTEMPTS) {
        attempt++;
        try {
            console.log(`[OpenRouter] model=${currentModel} attempt=${attempt}/${MAX_ATTEMPTS}`);
            const result = await executeRequest(currentModel, messages);
            console.log(`[OpenRouter] result=success model=${currentModel}`);
            setCachedResponse(cacheKey, result);
            return result;
        } catch (err: any) {
            const isTransient =
                err.code === 'AI_RATE_LIMITED' ||
                err.code === 'AI_PROVIDER_ERROR' ||
                err.code === 'AI_TIMEOUT' ||
                err.code === 'AI_EMPTY_RESPONSE';

            console.error(`[OpenRouter] status=${err.code === 'AI_RATE_LIMITED' ? '429' : err.code} attempt=${attempt}/${MAX_ATTEMPTS}`);

            // Do not retry non-transient error types or if max attempts for current model are reached
            if (!isTransient || attempt >= MAX_ATTEMPTS) {
                // If transient error and currently on primary model, switch to fallback model
                if (isTransient && currentModel === PRIMARY_MODEL && PRIMARY_MODEL !== FALLBACK_MODEL) {
                    console.log(`[OpenRouter] fallback=${FALLBACK_MODEL}`);
                    currentModel = FALLBACK_MODEL;
                    attempt = 0; // Reset attempts for fallback model
                    continue;
                }
                throw err;
            }

            // Sleep with exponential backoff delay
            const delay = retryDelays[attempt - 1] || 1000;
            console.log(`[OpenRouter] retry=${attempt} delay=${delay}ms`);
            await sleep(delay);
        }
    }

    throw new AIError('AI_UNAVAILABLE', 'AI service is temporarily unavailable.');
};
