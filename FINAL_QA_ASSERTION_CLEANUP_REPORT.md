# Career Hub — Final QA Assertion Cleanup Report

This report outlines the resolution of the pre-existing E2E test assertion mismatch in `server/run-rbac-e2e-tests.ts`.

---

## 🔍 Root Cause

The E2E RBAC verification script expected a standalone `subject` field to be returned directly inside the `AIQuestionPaper` document returned from `/api/ai/question-paper`. However, the Mongoose schema for `AIQuestionPaper` has no `subject` field, as it stores the subject name inside the `title` field (e.g. `Science: SEMESTER Exam (medium)`).

Because the API response did not include a `subject` property on the generated document, the test suite threw an assertion mismatch (`FAIL: QPaper Gen returns correct object`), even though the API successfully created and returned the generated paper with a `201` status code.

---

## 📜 Existing API Contract

- **Endpoint**: `POST /api/ai/question-paper`
- **Response Shape**:
  ```json
  {
    "success": true,
    "questionPaper": {
      "_id": "6a813f692b1249c4d1feb9eb",
      "user": "6a493a3300a31466d1761945",
      "title": "Science: SEMESTER Exam (medium)",
      "examType": "semester",
      "difficulty": "medium",
      "bloomTaxonomy": "Apply",
      "questionTypes": ["2 Marks", "5 Marks", "10 Marks"],
      "content": "... [Markdown Content] ...",
      "sourceDocuments": ["java_collections.txt"],
      "isBookmarked": false,
      "isFavorite": false,
      "createdAt": "2026-08-16T04:41:13.283Z"
    }
  }
  ```

---

## 🛠️ Test Correction

We corrected the assertion inside [run-rbac-e2e-tests.ts](file:///c:/Nivesh/placement/Career%20Hub/server/run-rbac-e2e-tests.ts) to match the actual, intended schema structure by checking that the generated `title` includes the correct subject name (`Science`), rather than querying a non-existent `subject` property.

### Before Assertion
```typescript
if (adminQPaperRes.data?.success) {
    assertTest('QPaper Gen returns correct object', adminQPaperRes.data.questionPaper?.subject === 'Science');
}
```

### After Assertion
```typescript
assertTest('QPaper Gen returns correct object', adminQPaperRes.data.questionPaper?.title?.includes('Science'));
```

---

## 🔬 Test & Validation Results

### 1. RBAC E2E Test Suite Results
- Running `npx tsx run-rbac-e2e-tests.ts` -> **PASS** ✅
- **Output**:
  ```text
  ====================================================
       ✅ ALL  RBAC SUITE TESTS PASSED SUCCESSFULLY!    
  ====================================================
  ```

### 2. TypeScript Results
- **Server type check** (`npx tsc --noEmit`): **PASS** ✅ (0 errors)
- **Client type check** (`npx tsc --noEmit`): **PASS** ✅ (0 errors)

### 3. Regression Results
- Verified that Student/Faculty/Admin access controls are strictly isolated:
  - Students are blocked from `/question-paper` (403) and `/notice-report` (403).
  - Faculty are blocked from `/notice-report` (403).
  - Admins can successfully generate question papers (201).
- Generative queries route correctly through the migrated `nvidia/nemotron-3-ultra-550b-a55b:free` model.

---

## 🏆 Final Verdict

**VERDICT**: **PASS** 🟢
The test suite compiles and runs with 100% success.
