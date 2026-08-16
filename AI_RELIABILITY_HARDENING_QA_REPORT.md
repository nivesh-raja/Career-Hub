# Career Hub — AI Reliability Hardening QA Report

**Date**: August 16, 2026  
**Status**: APPROVED & VERIFIED  
**Primary Model**: `nvidia/nemotron-3-ultra-550b-a55b:free`  
**Fallback Model**: `google/gemini-2.5-flash`  

---

## 1. Executive Summary

To ensure uninterrupted uptime and prevent HTTP 429 (Rate Limit) and HTTP 5xx errors from disrupting student and faculty academic workflows, the Career Hub AI system underwent comprehensive reliability hardening. 

All OpenRouter interactions are now centralized through a resilient execution framework featuring:
- **Centralized Client Execution**: Single entry point handling timeouts, retries, and fallback model routing.
- **Exponential Backoff Retries**: Automatic 3-stage retries on transient errors (429, 500, 502, 503, 504) with delays of 500ms, 1000ms, and 2000ms.
- **Primary-to-Fallback Model Failover**: Seamless transition from the primary free model to the secondary fallback model if retries are exhausted.
- **User-Scoped AI Rate Limiting**: Dedicated middleware enforcing a maximum of 10 AI generation requests per user per minute.
- **Compound Key AI Caching**: Memory cache (30-second TTL) keyed by `userId + prompt` to eliminate redundant API calls and prevent cross-user data leakage.
- **Graceful Deterministic Academic Fallbacks**: Safe try-catch boundaries on all academic generation services (`generateQuizService`, `generateQuestionPaperService`, etc.) ensuring schema-compliant structured fallbacks during upstream provider outages.
- **Zero Credential & Stack Trace Leakage**: Guaranteed masking of API keys and internal backtraces in user-facing responses and diagnostic logs.

---

## 2. Architectural Hardening & Service Design

### 2.1 Centralized OpenRouter Service (`openrouter.service.ts`)
- **Timeout Management**: Every HTTP fetch call is bound to an `AbortController` with a strict 25-second limit to prevent hanging connections.
- **Retry & Backoff Logic**:
  - Automatically identifies retryable status codes: `429`, `500`, `502`, `503`, `504`, `ECONNRESET`, `ETIMEDOUT`.
  - Executes exponential backoff delay before each retry attempt.
- **Model Fallback Chain**:
  - Primary Model: `OPENROUTER_MODEL` (`nvidia/nemotron-3-ultra-550b-a55b:free`)
  - Fallback Model: `OPENROUTER_FALLBACK_MODEL` (`google/gemini-2.5-flash`)
  - If the primary model exhausts 3 retry attempts, the service automatically fails over to the fallback model for up to 3 additional attempts.

### 2.2 AI Rate Limiter Middleware (`aiRateLimit.middleware.ts`)
- **Policy**: Maximum 10 requests per user per 60-second window.
- **Identification**: Keyed uniquely by authenticated user ID (`req.user._id`).
- **Response Format**: On limit breach, returns `HTTP 429` with normalized JSON payload:
  ```json
  {
    "success": false,
    "error": "AI_RATE_LIMITED",
    "message": "AI generation rate limit exceeded. Please wait a minute before making more requests."
  }
  ```

### 2.3 User-Scoped Caching
- **Implementation**: Short-lived in-memory cache with a 30-second TTL.
- **Security Scope**: Compound key format `user:<userId>:<hash(messages)>` guarantees strict user isolation and prevents cross-tenant data leakage.

### 2.4 Graceful Academic Generator Fallbacks (`aiAcademic.service.ts`)
If both OpenRouter models fail or return rate-limit errors, academic generator functions return structured deterministic fallbacks rather than crashing with HTTP 500:
- **Quiz Generator (`generateQuizService`)**: Returns 5 pre-structured, Bloom-categorized multiple-choice questions.
- **Question Paper Generator (`generateQuestionPaperService`)**: Returns a formatted examination paper with Section A (Short) and Section B (Essay) divisions along with a mark scheme.
- **Study Plan Generator (`generateStudyPlanService`)**: Returns a structured multi-week topic roadmap.
- **Concept Explainer & Code Review Services**: Return formatted markdown summaries with code snippets and breakdown sections.

---

## 3. Verification & Automated Test Results

### 3.1 OpenRouter Resilience Integration Suite (`test-openrouter-resilience.ts`)
Executed mock network scenarios verifying 10 critical operational constraints:

| Test ID | Scenario | Expected Behavior | Result |
| :--- | :--- | :--- | :---: |
| **Test 1** | Normal Request | Successfully returns AI completion from primary model | **PASS** |
| **Test 2** | 429 Retry & Backoff | Retries 2 times with exponential delay, succeeds on 3rd attempt | **PASS** |
| **Test 3** | 500 Server Error Retry | Retries 2 times, succeeds on 3rd attempt | **PASS** |
| **Test 4** | Request Timeout (25s) | Aborts hanging request and throws `AI_TIMEOUT` after full retry sequence | **PASS** |
| **Test 5** | Empty Response Recovery | Identifies empty content payload, retries, and recovers via fallback model | **PASS** |
| **Test 6** | Primary Model Failover | Primary model 429 triggers automatic failover to fallback model | **PASS** |
| **Test 7** | Both-Model Failure | Throws sanitized error after exhausting attempts on both models | **PASS** |
| **Test 8** | Response Caching | Cache hit on identical prompt/user ID; cache miss on different user ID | **PASS** |
| **Test 9** | Health Check Endpoint | `GET /api/ai/health` correctly verifies OpenRouter connectivity | **PASS** |
| **Test 10**| Credential Audit | Error messages and stack traces verified free of `OPENROUTER_API_KEY` | **PASS** |

### 3.2 End-to-End Suite & Compilation Checks

| Verification Suite | Command | Result |
| :--- | :--- | :---: |
| **Server TypeScript Check** | `npx tsc --noEmit` (server) | **0 Errors** |
| **Client TypeScript Check** | `npx tsc --noEmit` (client) | **0 Errors** |
| **RBAC E2E Stress Test** | `npx tsx run-rbac-e2e-tests.ts` | **ALL PASSED** |
| **Backend Analytics Test** | `npx tsx run-analytics-tests.ts` | **5/5 PASSED** |

---

## 4. Conclusion

The Career Hub AI subsystem is fully hardened against upstream rate limits, provider downtime, and connection timeouts. All generation endpoints gracefully maintain service availability and schema integrity under all failure modes.
