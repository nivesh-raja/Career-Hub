# System Architecture & Implementation Plan: AI Academic Copilot Suite

This document outlines the technical architecture, design patterns, and engineering workflows utilized to transform the **Career Hub** from a standard educational workspace into an AI-powered **Academic Operating System (AI Copilot)**.

---

## 1. Technical Architecture Overview

The Academic Copilot follows a multi-tier decoupled architecture comprising a Vite/React frontend, an Express/Node.js backend, a MongoDB Atlas persistence layer, and the OpenRouter API for advanced LLM reasoning.

```
       [ Client-Side Layout ]
                 │
                 ▼
       [ React UI Components ] ─────► [ exportHelper ] ──► (PDF / DOCX / MD)
                 │
      (HTTP REST API with JWT)
                 │
                 ▼
      [ Express Routing / Auth ] ──► (protect / authorizeRole Middleware)
                 │
                 ▼
     [ Intent Router & RAG Helper ]
                 │
        ┌────────┴────────┐
        ▼                 ▼
   [ Vector Chunks ]   [ OpenRouter LLM ]
   (Semantic Similarity)     (Gemini Flash/Pro)
        │
        ▼
   [ Database Hub ] (MongoDB Collections)
```

---

## 2. Intent-Based Routing System

To provide a seamless, non-intrusive Academic Copilot experience, the system implements an **Intent Classification Engine** directly inline within the master chat stream. 

### Processing Pipeline
1. **User input ingest**: The user types a natural language query (e.g. *"Create a study planner for dynamic programming"*).
2. **Intent classification**: The prompt undergoes automatic intent classification (`classifyIntent`) to determine the target sub-module.
3. **Specialized prompt matching**: Depending on the classified intent, the prompt is transformed using academic templates.
4. **Target generator invocation**: The system invokes specialized generators for:
   - `study-notes` (Study Notes)
   - `flashcards` (Revision Flashcards)
   - `quiz` (MCQ & Short Evaluations)
   - `study-plan` (Study Planner timelines)
   - `assignment-helper` (Topic concepts guidance)
   - `question-paper` (Faculty exams maker)
   - `lesson-plan` (Syllabus planner)
   - `notice` (Official communications notices)
5. **Auto-Save & UI Routing**: Generated resources are automatically persistent-saved into MongoDB. The client-side UI detects the generator payload type, renders inline shortcut links ("Open in Viewer"), and populates the workspace.

---

## 3. RAG & Gemini Fallback Pipeline

The system integrates a robust **Retrieval-Augmented Generation (RAG)** pipeline to context-enrich AI responses with institutional subject documents (PDF, DOCX, TXT).

```
[User Query] ──► [Retrieve Chunks] ──► (Score >= Threshold?)
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │ Yes                                       │ No
                       ▼                                           ▼
          [Context-Enrich Prompt]                     [Baseline Baseline Call]
        (Cite Chunks & File Sources)                 (Fallback to General Gemini)
```

- **Embedding & Chunk Storage**: Uploaded files are segmented, parsed, and converted into lexical chunks mapped inside MongoDB (`DocumentChunk` model).
- **Hybrid Semantic Retrieval**: When a query is made, `retrieveRelevantChunks` extracts matching segments from active context files.
- **Adaptive Fallback**: If no matching context segments are found (or similarity score falls below threshold), the system automatically drops down to baseline LLM (Gemini Pro/Flash via OpenRouter) to handle the command as general scholastic queries, avoiding out-of-context hallucinations.

---

## 4. Front-End Core Modules

The UI workspace contains a dedicated tabs layout:
1. **AI Chat Copilot**: An interactive terminal for ongoing dialogue, file uploading, and inline template actions.
2. **AI Productivity Console**: A structured management dashboard mapping:
   - **Student AI tools panel**: Notes workshop, interactive quiz answering loops, flashcards studios, schedules designer.
   - **Faculty AI tools panel**: Bloom's Taxonomy test sheets, syllabus mappings.
   - **Admin AI tools panel**: Circular correspondence publisher.
   - **History Viewer**: Logs of prompts, responses, and title renames.
   - **Bookmarks**: Collection of starred resources.
   - **Templates**: Quick mock prompt blueprints.
   - **Recent Activity timeline**: Audit tracking.

---

## 5. Deployment & Build Steps

1. **Backend Configuration**: Set `MONGODB_URI`, `JWT_SECRET`, and `OPENROUTER_API_KEY` in `server/.env`.
2. **Installation**:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. **Run Dev Servers**:
   - Backend: `npm run dev` (starts on port 5000)
   - Frontend: `npm run dev` (starts on port 5173)
4. **Production Build**:
   ```bash
   cd client && npm run build
   ```
