# Security Audit Framework & Access Control Summary

This document summarizes the security mechanisms, authorization layers, user controls, data isolation, and API defense parameters implemented within the **Career Hub AI Academic Suite** to protect sensitive institutional records and restrict unauthorized operations.

---

## 1. Authentication Layer (JWT Defenses)

All incoming traffic to the AI service endpoints is protected by a solid JSON Web Token (JWT) verification pipeline.

- **Token Inspection**: The `protect` middleware extracts the secure HTTP authorization headers using the format: `Bearer <token>`.
- **Identity Decryption**: Tokens are validated against the `JWT_SECRET`. Upon decode validation, the requester's MongoDB `User` record is fetched, and the context credentials (`req.user`) are injected directly into the active request flow.
- **Expiry Enforcements**: All tokens are generated with expiration timeouts (e.g. 1 hour) to defend against session hijacking.

---

## 2. Role-Based Access Control (RBAC)

To safeguard sensitive tools (such as exam question paper generators and administrative notices publishing), the suite mandates role verification.

```
                  [ Incoming Request ]
                           │
                           ▼
                 [ protect Middleware ]
              (Checks credentials validity)
                           │
                           ▼
              [ authorizeRole Middleware ]
             (Verifies user.role matches)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      Student Role               Faculty / Admin Role
  (Allowed: Study tools)      (Allowed: Question Papers,
                                Lesson Plans, Notices)
```

### Route-Level Restrictions
- **Student AI Tools**: Access to notes, flashcards, quizes, study plans, and assignment assistance.
- **Faculty AI Tools**: Restricts Question Paper Generator, Assignment Generator, and Lesson Planner to accounts matching `role === 'faculty'` or `role === 'admin'`.
- **Admin AI Tools**: Restricts Notice, Circular, and Institutional Report generation exclusively to `role === 'admin'` accounts.
- **Middleware implementation (`authorizeRole`)**: Throws a HTTP 403 Forbidden client-response code immediately if a logged-in identity tries to trigger an API restricted to higher roles (e.g. student trying to hit `/api/ai/faculty/generate-paper`).

---

## 3. Data Isolation & Ownership Validation

All AI-generated resources are securely linked to their respective user objects via a foreign key relation.

- **Storage Model**:
  ```typescript
  user: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: true
  }
  ```
- **Operational Scoping**: Every CRUD handler (read, update, delete, rename) queries collections using both the entity's ID **AND** the identity of the current user:
  ```typescript
  const item = await Model.findOne({ _id: id, user: req.user._id });
  ```
  This guarantees that a student cannot delete, rename, view, or modify the notes, plans, or study cards created by another user, enforcing strict multitenant isolation at the database layer.

---

## 4. RAG Resource Sanitation & Isolation

To prevent prompt injection via uploaded documents and secure document content:
- **Sandbox Processing**: Uploaded documents are parsed in memory, mapped to secure lexical vectors, and sanitized.
- **Owner Restrictions**: Chunks retrieved during RAG queries are scoped strictly to files matching the active `uploader` attribute of the logged-in request schema.
- **Orphan Cleanup Hook**: When a context document is deleted, database hooks automatically execute a cascade delete of all associated embeddings and segments (`DocumentChunk.deleteMany({ documentId: id })`), preventing stray data remnants from persisting.
