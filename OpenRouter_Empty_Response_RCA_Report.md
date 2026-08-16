# OpenRouter Empty Response Root Cause Analysis (RCA) Report

This report outlines the technical investigation and resolution of the empty response issue in the AI assistant modules of **Career Hub**.

---

## 🔍 Root Cause Analysis

We identified **two distinct root causes** contributing to runtime failures:

### 1. Singular/Plural Key Mismatch in `generateQuizService`
- **Mechanism**: The intent classifier `classifyIntent` is designed to output key/value metadata inside the `params` object. It outputs the singular `"questionCount": number`.
- **Mismatch**: `generateQuizService` destructured `questionsCount` (plural with an 's'):
  ```typescript
  const { quizType, difficulty, questionsCount, topic, userId } = params;
  ```
- **Result**: `questionsCount` resolved to `undefined`. Because the Mongoose schema for `AIQuiz` specifies `questionsCount` is `required: true`, the document creation failed with a Mongoose validation error:
  `AIQuiz validation failed: questionsCount: Path questionsCount is required.`
- **Propagation**: Since there was no local error boundary wrapping the execution of academic generators inside `ai.controller.ts`, this database validation exception propagated directly to the outer catch block and threw an HTTP 500 error to the client.

### 2. Missing Local Error Boundary for Academic Generators
- **Mechanism**: While general chat (`/chat`) caught OpenRouter failures locally and returned a friendly fallback message, the academic generator invocations (quizzes, flashcards, notes, schedules) did not have local try-catch blocks.
- **Result**: Any downstream failure (such as rate limits on the free OpenRouter tier, transient empty responses, or validation errors) resulted in a raw `HTTP 500` error, displaying "Error: Empty response from OpenRouter" or similar exceptions in the UI.

---

## 🔬 Raw Response Metadata & Request Configuration

During diagnostic testing against the free OpenRouter tier (`nvidia/nemotron-3-ultra-550b-a55b:free`), we logged the following metadata:
- **HTTP status**: `200`
- **Content-Type**: `application/json`
- **Response Keys**: `['id', 'object', 'created', 'model', 'provider', 'system_fingerprint', 'service_tier', 'choices', 'usage']`
- **Choices Length**: `1`
- **Message Content type**: `string`
- **Finish Reason**: `stop`
- **Provider**: `Nvidia`
- **Diagnostic Outcome**: Under standard API load, OpenRouter does return valid completions. However, any transient empty string response or schema validation error resulted in a raw 500 failure.

---

## ❓ Why the Previous QA Missed This Case

1. **Role Redirection**: For Faculty users, requests to generate quizzes are intercepted and redirected to the `question-paper-generator`:
   ```typescript
   if (role === 'faculty' && intent === 'generate-quiz') {
       intent = 'question-paper-generator';
   }
   ```
   Because of this, Faculty quiz requests route to `generateQuestionPaperService` (which has fallback logic for question types and parameters), while Student quiz requests route to `generateQuizService`. The previous automated E2E E2E tests simulated Faculty and Admin creation flows but did not trigger the Student quiz generation pathway.

---

## 🛠️ Code Changes Implemented

### 1. Param Fallback and Mapping in `generateQuizService`
Updated [aiAcademic.service.ts](file:///c:/Nivesh/placement/Career%20Hub/server/src/services/aiAcademic.service.ts) to safely resolve fallback keys and default parameters:
```typescript
const quizType = params.quizType || 'mcq';
const difficulty = params.difficulty || 'medium';
const questionsCount = params.questionsCount || (params as any).questionCount || 10;
const { topic, userId } = params;
```

### 2. Topic Display Fix
Updated the chat controller response builder in [ai.controller.ts](file:///c:/Nivesh/placement/Career%20Hub/server/src/controllers/ai.controller.ts) to read the topic string from the request parameters (`params.topic`) instead of the database model (which filters out fields not defined in the schema):
```typescript
responseText = `I've generated a quiz with ${doc.questions.length} questions on **${params.topic || prompt}**! Try answering them in the interactive study suite.`;
```

### 3. Local Error Boundaries for Academic Generators
Wrapped the entire intent execution block in [ai.controller.ts](file:///c:/Nivesh/placement/Career%20Hub/server/src/controllers/ai.controller.ts) in a try-catch block to return graceful fallback messages on failures:
```typescript
try {
    // academic generator services...
} catch (generatorError: any) {
    console.error(`[AI Generator Error - ${intent}]:`, generatorError.message);
    const fallbackResponse = `AI service is temporarily unavailable. Please try again later. (Error: ${generatorError.message})`;
    // save error message to conversation and return status 200...
}
```

---

## 📊 Before & After Verification

| Test Target | Before Behavior | After Behavior | Result |
| :--- | :--- | :--- | :--- |
| **Student Quiz Generation** | HTTP 500 validation error | HTTP 200 with generated quiz | **PASS** ✅ |
| **General Chat** | Succeeded | Succeeded | **PASS** ✅ |
| **RAG Chat** | Succeeded | Succeeded | **PASS** ✅ |
| **AI Explanation (5B.3C)** | Succeeded | Succeeded | **PASS** ✅ |
| **Fallback under Error** | HTTP 500 error display | Graceful text fallback message | **PASS** ✅ |
| **Server build** (`npx tsc`) | Compiled successfully | Compiled successfully | **PASS** ✅ |
| **Client build** (`npx tsc`) | Compiled successfully | Compiled successfully | **PASS** ✅ |
