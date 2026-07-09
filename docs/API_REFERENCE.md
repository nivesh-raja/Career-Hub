# API Reference Manual: AI Academic Services

This documentation provides references for endpoints, schemas, payload models, responses, and authorization schemas configured in the **AI Academic suite**.

---

## 1. Authentication Configuration

Every API call (except token generation) requires authentication via Header context:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 2. Core AI Chat Endpoints

### 2.1 Send Chat Query (Intent Classification & RAG)
Processes user prompts, performs dynamic intent classification, scans context files for similarity matching, and returns generated results.

- **URL**: `/api/ai/chat`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "prompt": "Create study notes detailing Process Synchronization in Operating Systems"
  }
  ```
- **Response Contracts (Intent Matched)**:
  ```json
  {
    "success": true,
    "intent": "study-notes",
    "response": "### Process Synchronization Summary...",
    "data": {
      "_id": "60a4f5f...",
      "title": "Process Synchronization",
      "content": "### Process Synchronization Summary..."
    },
    "sourceDocuments": ["memory_management.txt"]
  }
  ```

---

## 3. Specialized Academic Generators

### 3.1 Generate Smart Notes
Creates detailed study summaries on clean markdown layout.

- **URL**: `/api/ai/generate-notes`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "topic": "Process Synchronization",
    "subject": "Operating Systems",
    "depth": "detailed"
  }
  ```
- **Response**: Returns the saved `AINotes` model database entry.

### 3.2 Generate Flashcard Decks
Generates double-sided question-answer memory cards.

- **URL**: `/api/ai/generate-flashcards`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "topic": "ACID Properties",
    "count": 5
  }
  ```

### 3.3 Generate Interactive Quiz
Creates multiple-choice or short evaluation sheets.

- **URL**: `/api/ai/generate-quiz`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "topic": "Computer Networks Routing Protocols",
    "count": 10
  }
  ```

### 3.4 Generate Study Planner
Creates milestone schedules and review guidelines.

- **URL**: `/api/ai/generate-planner`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "topic": "Data Structures Algorithms",
    "examDate": "2026-08-15"
  }
  ```

---

## 4. Faculty & Admin Exclusive Endpoints

### 4.1 Generate Exam Papers (Faculty or Admin only)
- **URL**: `/api/ai/faculty/generate-paper`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "subject": "CS201",
    "topic": "Sorting Algorithms",
    "difficulty": "medium"
  }
  ```

### 4.2 Generate Lesson Outline (Faculty or Admin only)
- **URL**: `/api/ai/faculty/generate-lesson-plan`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "subject": "CS201",
    "topic": "Dynamic Programming",
    "weeks": 4
  }
  ```

### 4.3 Publish Notices & Circulars (Admin only)
- **URL**: `/api/ai/admin/generate-notice`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "type": "circular",
    "topic": "End Semester Exam Schedule"
  }
  ```

---

## 5. Library & Storage Operations

### 5.1 Fetch All Saved Library Items
- **URL**: `/api/ai/saved-items`
- **Method**: `GET`
- **Parameters**:
  - `type` (optional): Filter by collections (`notes`, `flashcards`, etc.)
  - `isBookmarked` (optional): `true/false` filter
  - `isFavorite` (optional): `true/false` filter
- **Response**: List of matched unified library objects.

### 5.2 Toggle Favorite/Bookmark Status
- **URL**: `/api/ai/saved-items/:collection/:id`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "isBookmarked": true,
    "isFavorite": false
  }
  ```

### 5.3 Delete Library Item
- **URL**: `/api/ai/saved-items/:collection/:id`
- **Method**: `DELETE`
