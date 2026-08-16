import dotenv from 'dotenv';
dotenv.config();

import { callCentralizedAI, AIError } from './src/services/openrouter.service.js';
import { runHealthCheck } from './src/services/ai.service.js';

// Save original fetch
const originalFetch = globalThis.fetch;

// Helper to restore original fetch
const restoreFetch = () => {
    globalThis.fetch = originalFetch;
};

// Custom assert helper
const assert = (condition: boolean, message: string) => {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`  ✓ PASS: ${message}`);
};

const runTests = async () => {
    console.log('\n====================================================');
    console.log('   STARTING OPENROUTER RESILIENCE INTEGRATION TEST   ');
    console.log('====================================================\n');

    // ─────────────────────────────────────────────────────────────────
    // TEST 1: Normal successful request
    // ─────────────────────────────────────────────────────────────────
    console.log('Test 1: Normal successful request');
    let callCount = 0;
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        callCount++;
        const body = JSON.parse(options.body);
        assert(body.model === 'nvidia/nemotron-3-ultra-550b-a55b:free', `Requested primary model "${body.model}"`);
        return new Response(JSON.stringify({
            choices: [{ message: { content: 'This is a successful mock response.' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const res1 = await callCentralizedAI([{ role: 'user', content: 'test1' }]);
    assert(res1 === 'This is a successful mock response.', 'Returned correct content.');
    assert(callCount === 1, 'Called API exactly once.');

    // ─────────────────────────────────────────────────────────────────
    // TEST 2: 429 retry
    // ─────────────────────────────────────────────────────────────────
    console.log('\nTest 2: 429 retry behavior (returns 429 once, then 200 on retry)');
    callCount = 0;
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        callCount++;
        if (callCount < 2) {
            return new Response('Busy', { status: 429 });
        }
        return new Response(JSON.stringify({
            choices: [{ message: { content: 'Succeeded after retries.' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const start2 = Date.now();
    const res2 = await callCentralizedAI([{ role: 'user', content: 'test2' }]);
    const duration2 = Date.now() - start2;
    assert(res2 === 'Succeeded after retries.', 'Returned correct content.');
    assert(callCount === 2, `Called API exactly 2 times (attempts=${callCount}).`);
    assert(duration2 >= 500, `Delay backoff was verified (~500ms total, got ${duration2}ms)`);

    // ─────────────────────────────────────────────────────────────────
    // TEST 3: 500 retry
    // ─────────────────────────────────────────────────────────────────
    console.log('\nTest 3: 500 retry behavior (returns 500 once, then 200 on retry)');
    callCount = 0;
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        callCount++;
        if (callCount < 2) {
            return new Response('Internal error', { status: 500 });
        }
        return new Response(JSON.stringify({
            choices: [{ message: { content: 'Succeeded after 500 errors.' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const res3 = await callCentralizedAI([{ role: 'user', content: 'test3' }]);
    assert(res3 === 'Succeeded after 500 errors.', 'Returned correct content.');
    assert(callCount === 2, 'Called API exactly 2 times.');

    // ─────────────────────────────────────────────────────────────────
    // TEST 4: Timeout handling
    // ─────────────────────────────────────────────────────────────────
    console.log('\nTest 4: Abort/Timeout handling');
    callCount = 0;
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        callCount++;
        const error = new Error('The operation was aborted.');
        error.name = 'AbortError';
        throw error;
    };

    try {
        await callCentralizedAI([{ role: 'user', content: 'test4' }]);
        assert(false, 'Should have thrown timeout error.');
    } catch (e: any) {
        assert(e.code === 'AI_TIMEOUT', `Successfully threw AI_TIMEOUT: "${e.message}"`);
        assert(callCount === 4, 'Tried request 4 times total across primary and fallback models (2 attempts each).');
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 5: Empty response handling (triggers fallback)
    // ─────────────────────────────────────────────────────────────────
    console.log('\nTest 5: Empty response handling');
    callCount = 0;
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        callCount++;
        const body = JSON.parse(options.body);
        if (body.model === 'nvidia/nemotron-3-ultra-550b-a55b:free') {
            return new Response(JSON.stringify({ choices: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({
            choices: [{ message: { content: 'Fallback content for empty response.' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const res5 = await callCentralizedAI([{ role: 'user', content: 'test5' }]);
    assert(res5 === 'Fallback content for empty response.', 'Fell back to fallback model correctly.');
    assert(callCount === 3, 'Called primary 2 times (retrying empty responses), then fallback once.');

    // ─────────────────────────────────────────────────────────────────
    // TEST 6: Primary model fallback & Maximum attempts per model = 2
    // ─────────────────────────────────────────────────────────────────
    console.log('\nTest 6: Primary model fallback (primary returns 429 repeatedly, fallback returns 200)');
    callCount = 0;
    let primaryCount = 0;
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        callCount++;
        const body = JSON.parse(options.body);
        if (body.model === 'nvidia/nemotron-3-ultra-550b-a55b:free') {
            primaryCount++;
            return new Response('Rate limited', { status: 429 });
        }
        return new Response(JSON.stringify({
            choices: [{ message: { content: 'Succeeded on fallback model.' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const res6 = await callCentralizedAI([{ role: 'user', content: 'test6' }]);
    assert(res6 === 'Succeeded on fallback model.', 'Fell back to fallback model and completed successfully.');
    assert(primaryCount === 2, 'Maximum attempts per model is strictly 2.');
    assert(callCount === 3, `Total calls made: ${callCount} (2 primary + 1 fallback)`);

    // ─────────────────────────────────────────────────────────────────
    // TEST 7: Both-model failure (No infinite retry)
    // ─────────────────────────────────────────────────────────────────
    console.log('\nTest 7: Both-model failure (verifying no infinite retry)');
    callCount = 0;
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        callCount++;
        return new Response('Persistent Error', { status: 500 });
    };

    try {
        await callCentralizedAI([{ role: 'user', content: 'test7' }]);
        assert(false, 'Should have failed since both models are down.');
    } catch (e: any) {
        assert(e.code === 'AI_PROVIDER_ERROR' || e.code === 'AI_UNAVAILABLE', `Threw error: "${e.message}"`);
        assert(callCount === 4, `Total attempts made across both models: ${callCount} (2 primary + 2 fallback). No infinite retry.`);
    }

    // ─────────────────────────────────────────────────────────────────
    // TEST 8: Response Caching & User Isolation
    // ─────────────────────────────────────────────────────────────────
    console.log('\nTest 8: Response Caching (User A cache does not serve User B)');
    callCount = 0;
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        callCount++;
        return new Response(JSON.stringify({
            choices: [{ message: { content: 'Cached result.' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    // First call (bypasses cache, goes to API)
    const keyMessages = [{ role: 'user' as const, content: 'cache-test-prompt' }];
    const cacheRes1 = await callCentralizedAI(keyMessages, 'test-user-id-1');
    assert(cacheRes1 === 'Cached result.', 'First call succeeded.');
    assert(callCount === 1, 'Fetched from API.');

    // Second call (hits cache for User A)
    const cacheRes2 = await callCentralizedAI(keyMessages, 'test-user-id-1');
    assert(cacheRes2 === 'Cached result.', 'Second call succeeded.');
    assert(callCount === 1, 'Hits cache, no second API fetch was made.');

    // Third call for User B (bypasses cache, User A cache does NOT serve User B)
    const cacheRes3 = await callCentralizedAI(keyMessages, 'test-user-id-2');
    assert(cacheRes3 === 'Cached result.', 'Third call succeeded.');
    assert(callCount === 2, 'Fetched from API because user ID differed (User A cache does not serve User B).');

    // ─────────────────────────────────────────────────────────────────
    // TEST 9: Health Check Verification & Rate limit status
    // ─────────────────────────────────────────────────────────────────
    console.log('\nTest 9: AI Health Check endpoint integration');
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        return new Response(JSON.stringify({
            choices: [{ message: { content: 'SUCCESS' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const health = await runHealthCheck();
    assert(health.overall === 'OK', 'Health check reports OK.');
    assert(health.openRouterReachable === true, 'openRouterReachable matches true.');

    // ─────────────────────────────────────────────────────────────────
    // TEST 10: Security & Key Leakage check
    // ─────────────────────────────────────────────────────────────────
    console.log('\nTest 10: Credentials Leakage Audit');
    globalThis.fetch = async (url: any, options: any): Promise<Response> => {
        return new Response('Auth Error', { status: 401 });
    };

    try {
        await callCentralizedAI([{ role: 'user', content: 'test10' }]);
    } catch (e: any) {
        const API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-v1-';
        assert(!e.message.includes(API_KEY), 'Error message does not contain OPENROUTER_API_KEY.');
        assert(e.stack === undefined || !e.stack.includes(API_KEY), 'Error stack does not contain OPENROUTER_API_KEY.');
    }

    restoreFetch();

    console.log('\n====================================================');
    console.log('    ALL RESILIENCE CONSTRAINTS PASSED SUCCESSFULLY   ');
    console.log('====================================================\n');
};

runTests().catch(e => {
    restoreFetch();
    console.error('❌ Test failed with exception:', e);
    process.exit(1);
});
