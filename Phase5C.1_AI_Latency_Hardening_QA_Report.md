# Career Hub — Phase 5C.1 AI Latency Hardening QA Report

**Date**: August 16, 2026  
**Phase**: Phase 5C.1 — Interactive AI Latency Hardening  
**Final Status**: **PASS**  
**Primary Model**: `nvidia/nemotron-3-ultra-550b-a55b:free`  
**Fallback Model**: `google/gemini-2.5-flash`  

---

## 1. Files Changed

1. **`server/src/services/openrouter.service.ts`**:
   - Added environment-configurable timeout (`process.env.AI_TIMEOUT_MS` defaulting to `12000` ms).
   - Added environment-configurable attempt limit (`process.env.AI_MAX_ATTEMPTS` defaulting to `2` attempts per model).
   - Implemented explicit non-retry policy for client error status codes (`400`, `401`, `403`, `404`).
   - Added structured attempt logs without exposing request bodies, API keys, or JWT tokens.
2. **`server/test-openrouter-resilience.ts`**:
   - Updated integration test assertions to validate 2 attempts per model (attempt 1 + 1 retry).
   - Added strict checks for maximum primary attempts (`primaryCount === 2`), no infinite retries (`callCount === 4`), user cache isolation, rate limiting, and security scrubbing.

---

## 2. Exact Configuration Changes

| Setting | Environment Variable | Old Value | New Hardened Value |
| :--- | :--- | :--- | :--- |
| **Interactive Request Timeout** | `AI_TIMEOUT_MS` | `25000` ms (25s) | **`12000` ms (12s)** |
| **Max Attempts Per Model** | `AI_MAX_ATTEMPTS` | `3` attempts | **`2` attempts** |
| **Backoff Strategy** | Internal constant | `[500, 1000, 2000]` ms | **`[500]` ms (1 retry)** |
| **User AI Rate Limit** | `AI_RATE_LIMIT` | `10` req/min/user | **`10` req/min/user** (Preserved) |
| **Response Cache TTL** | `CACHE_TTL_MS` | `30000` ms (30s) | **`30000` ms (30s)** (Preserved) |

---

## 3. Retry Sequence & Model Failover Flow

```
[User Interactive AI Request]
            │
            ▼
┌───────────────────────┐
│ User Cache Lookup     │ ──(Cache Hit)──► Return Cached Completion
└───────────────────────┘
            │ (Cache Miss)
            ▼
┌────────────────────────────────────────────────────────┐
│ PRIMARY MODEL (nvidia/nemotron-3-ultra-550b-a55b:free) │
│ - Attempt 1: Fetch (timeout: 12s)                      │
│   ├─ Status 200 ───────────────────────────────────────┼──► Return Completion & Cache
│   ├─ Status 400/401/403/404 ───────────────────────────┼──► Throw Non-Transient Error
│   └─ Transient Error (429/5xx/timeout)                 │
│      └─ Retry 1: Wait 500ms -> Fetch (timeout: 12s)    │
│         ├─ Status 200 ─────────────────────────────────┼──► Return Completion & Cache
│         └─ Persistent Error ───────────────────────────┘
└────────────────────────────────────────────────────────┘
            │ (Exhausted 2 Primary Attempts)
            ▼
┌────────────────────────────────────────────────────────┐
│ FALLBACK MODEL (google/gemini-2.5-flash)               │
│ - Attempt 1: Fetch (timeout: 12s)                      │
│   ├─ Status 200 ───────────────────────────────────────┼──► Return Completion & Cache
│   └─ Transient Error (429/5xx/timeout)                 │
│      └─ Retry 1: Wait 500ms -> Fetch (timeout: 12s)    │
│         ├─ Status 200 ─────────────────────────────────┼──► Return Completion & Cache
│         └─ Persistent Error ───────────────────────────┘
└────────────────────────────────────────────────────────┘
            │ (Exhausted 2 Fallback Attempts)
            ▼
┌────────────────────────────────────────────────────────┐
│ Throw Sanitized AI_UNAVAILABLE / Deterministic Fallback │
└────────────────────────────────────────────────────────┘
```

---

## 4. Latency Calculation

### 4.1 Previous Worst-Case Latency (Phase 5B)
- Primary model: `(25s × 3 attempts) + 1.5s backoff = 76.5s`
- Fallback model: `(25s × 3 attempts) + 1.5s backoff = 76.5s`
- Total theoretical maximum: **153.0 seconds (~2.55 minutes)**

### 4.2 Hardened Worst-Case Latency (Phase 5C.1)
- Primary model: `(12s × 2 attempts) + 0.5s backoff = 24.5s`
- Fallback model: `(12s × 2 attempts) + 0.5s backoff = 24.5s`
- Total theoretical maximum: **49.0 seconds**

**Total Latency Reduction**: **104.0 seconds (68% improvement)**. Worst-case latency under total dual-provider blackout is now strictly bounded under 50 seconds.

---

## 5. Automated Resilience Test Results (`test-openrouter-resilience.ts`)

All 10 required test assertions executed cleanly:

| Test ID | Scenario | Empirical Result | Status |
| :--- | :--- | :--- | :---: |
| **TEST 1** | Normal Primary Request | Single fetch request to primary model succeeds | **PASS** |
| **TEST 2** | Primary 429 Retry | Retries once after 500ms delay, returns 200 status | **PASS** |
| **TEST 3** | Primary 500 Retry | Retries once after 500ms delay, returns 200 status | **PASS** |
| **TEST 4** | Primary Timeout Handling | Aborts hanging request, retries, throws `AI_TIMEOUT` after 4 total attempts | **PASS** |
| **TEST 5** | Empty Response Recovery | Identifies empty payload, retries primary twice, recovers via fallback model | **PASS** |
| **TEST 6** | Max Attempts Capped at 2 | Confirms primary model attempts strictly equals 2 (`primaryCount === 2`) | **PASS** |
| **TEST 7** | No Infinite Retry | Confirms total execution across both models strictly equals 4 attempts (`callCount === 4`) | **PASS** |
| **TEST 8** | User Cache Isolation | User A prompt completion does NOT serve User B (`user:UserA` vs `user:UserB`) | **PASS** |
| **TEST 9** | Rate Limiting Policy | AI rate limiter maintains 10 req/min/user policy | **PASS** |
| **TEST 10**| Credential Sanitization | Confirms error messages and stacks scrub `OPENROUTER_API_KEY` | **PASS** |

---

## 6. Regression Verification

| Test Suite | Command | Result |
| :--- | :--- | :---: |
| **Server TypeScript Check** | `npx tsc --noEmit` (server) | **0 Errors** |
| **Client TypeScript Check** | `npx tsc --noEmit` (client) | **0 Errors** |
| **OpenRouter Resilience Integration** | `npx tsx test-openrouter-resilience.ts` | **10/10 PASSED** |
| **RBAC E2E Suite** | `npx tsx run-rbac-e2e-tests.ts` | **ALL PASSED** |
| **Backend Analytics Suite** | `npx tsx run-analytics-tests.ts` | **5/5 PASSED** |

---

## 7. Security Verification

- **API Key Containment**: `OPENROUTER_API_KEY` is referenced solely in server-side authorization headers.
- **Log Scrubbing**: Operational loggers output model names and attempt counters (`[OpenRouter] model=nvidia/nemotron-3-ultra-550b-a55b:free attempt=1/2`) without exposing user payloads, JWT tokens, or API credentials.
- **Client Error Shielding**: Deterministic client errors (`400`, `401`, `403`, `404`) and rate limits map to friendly, sanitized user messages.

---

## 8. Final Verdict

**FINAL VERDICT**: **`PASS`**

Phase 5C.1 Interactive AI Latency Hardening is fully verified, operational, and non-regressive across all Career Hub test suites.
