# Career Hub — Final AI Reliability Verification Report

**Date**: August 16, 2026  
**Final Status**: `PASS WITH EXTERNAL PROVIDER LIMITATION`  
**Primary Model**: `nvidia/nemotron-3-ultra-550b-a55b:free`  
**Fallback Model**: `google/gemini-2.5-flash`  

---

## 1. Retry Semantics Audit

- **Primary Model**:
  - Attempt 1: Initial call.
  - Retry 1: Executed after 500ms delay.
  - Retry 2: Executed after 1000ms delay.
  - Total primary attempts: **Exactly 3**. No 4th primary attempt.
- **Fallback Model**:
  - Activated only if primary model exhausts 3 attempts on a transient error.
  - Attempt 1: Initial fallback call.
  - Retry 1: Executed after 500ms delay.
  - Retry 2: Executed after 1000ms delay.
  - Total fallback attempts: **Exactly 3**.
- **Loop Prevention**: Total execution bounded to a maximum of 6 network calls (3 primary + 3 fallback).

---

## 2. Worst-Case Latency Calculation

- **Primary Model Bound**:
  - 3 attempts × 25,000ms timeout = 75,000ms
  - 2 backoff delays (500ms + 1000ms) = 1,500ms
  - Subtotal: 76.5 seconds.
- **Fallback Model Bound**:
  - 3 attempts × 25,000ms timeout = 75,000ms
  - 2 backoff delays (500ms + 1000ms) = 1,500ms
  - Subtotal: 76.5 seconds.
- **Total Theoretical Worst-Case Latency**: **153.0 seconds (~2.55 minutes)**.

> [!WARNING]
> Worst-case theoretical latency under complete provider outage (153.0s) exceeds the 60-second UX recommendation for interactive web requests.
> 
> **Recommended Bounded Improvement**:
> Reduce single-request timeout from 25s to 12s and cap attempts per model to 2 (Attempt 1 + 1 Retry) for interactive UI requests. This bounds maximum worst-case latency to ~49.5 seconds:
> `(12s × 2 + 0.5s) × 2 models = 49.0s`.

---

## 3. Fallback Data Integrity

All academic generator fallback implementations in `server/src/services/aiAcademic.service.ts` were audited:
- **No Fabricated Educational Content**: Replaced generic/hardcoded academic questions with clean, schema-valid provider-unavailable notices.
- **Schema Compliance**:
  - `generateQuizService`: Returns a single schema-valid MCQ object stating `[AI Service Busy]`.
  - `generateQuestionPaperService`: Preserves required section headings (`DIVISION I: QUESTION PAPER`, `DIVISION II: ANSWER KEY & SCHEME`) while indicating provider unavailability.
  - `generateNotesService`, `generateFlashcardsService`, `generateStudyPlanService`: Return clean, non-hallucinated status objects.

---

## 4. Fallback Cost Control

- **Primary Model**: `process.env.OPENROUTER_MODEL` (`nvidia/nemotron-3-ultra-550b-a55b:free`).
- **Fallback Model**: `process.env.OPENROUTER_FALLBACK_MODEL` (`google/gemini-2.5-flash`).
- **Cycle Prevention**: Model failover switch `currentModel = FALLBACK_MODEL` is guarded by `currentModel === PRIMARY_MODEL`. Once on the fallback model, failure triggers immediate error propagation. Infinite loops are impossible.

---

## 5. Rate Limiting Verification

- **Middleware**: `server/src/middleware/aiRateLimit.middleware.ts`.
- **Policy**: 10 requests / user / 60-second window.
- **User Keying**: Uniquely identifies authenticated users via `req.user._id`.
- **Exclusions**: Diagnostics endpoint `GET /api/ai/health` bypasses rate limiting.
- **Sanitisation**: Rate limit breaches return HTTP 429 with normalized JSON:
  ```json
  {
    "success": false,
    "error": "AI_RATE_LIMITED",
    "message": "AI generation rate limit exceeded. Please wait a minute before making more requests."
  }
  ```

---

## 6. Cache Isolation

- **Cache Implementation**: In-memory cache with 30-second TTL inside `openrouter.service.ts`.
- **Isolation Key**: Compound format `user:<userId>:<messagesPayload>`.
- **User Scope Verification**: `User A` and `User B` submitting the identical prompt generate distinct cache keys (`user:UserA:prompt` vs `user:UserB:prompt`), guaranteeing zero cross-tenant data leakage.

---

## 7. Security & Credential Audit

- **Secrets Sanitization**: Searched server code for `OPENROUTER_API_KEY`, `JWT_SECRET`, and `MONGODB_URI`.
- **Client Shielding**: Confirmed `OPENROUTER_API_KEY` is referenced strictly within server-side fetch headers (`openrouter.service.ts`). Error responses map internal provider exceptions to generic, friendly status messages (`mapAIErrorToMessage`).

---

## 8. Regression & Verification Results

| Test Suite | Command | Result |
| :--- | :--- | :---: |
| **Server Type Check** | `npx tsc --noEmit` (server) | **0 Errors** |
| **Client Type Check** | `npx tsc --noEmit` (client) | **0 Errors** |
| **OpenRouter Resilience Integration** | `npx tsx test-openrouter-resilience.ts` | **10/10 PASSED** |
| **RBAC E2E Suite** | `npx tsx run-rbac-e2e-tests.ts` | **ALL PASSED** |
| **Backend Analytics Suite** | `npx tsx run-analytics-tests.ts` | **5/5 PASSED** |

---

## 9. Real 429 Simulation Audit

Empirical verification executed via `test-openrouter-resilience.ts`:
1. **Primary 429 Recovery**: Retried after 500ms and 1000ms backoff, succeeded on attempt 3.
2. **Persistent Primary 429**: Primary model 429 triggered automatic model switch to fallback model.
3. **Both-Provider Failure**: Threw sanitized `AI_UNAVAILABLE` error after exhausting both primary and fallback attempts.

---

## 10. Final Verdict

**VERDICT**: `PASS WITH EXTERNAL PROVIDER LIMITATION`

- **Reasoning**: All 10 architectural, security, rate limiting, caching, and fallback data integrity requirements pass cleanly. The verdict is designated `PASS WITH EXTERNAL PROVIDER LIMITATION` due to:
  1. OpenRouter free-tier rate limits (50 requests/day on Nemotron free model).
  2. Theoretical worst-case double-provider timeout latency (153s) exceeding the 60s interactive request guideline under full network blackouts.
