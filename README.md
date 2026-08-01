<img width="1905" height="969" alt="image" src="https://github.com/user-attachments/assets/703e17cb-e19d-4a19-bd83-5123c7c5e481" />
# 🎓 Career Hub

<div align="center">

![Career Hub Banner](https://img.shields.io/badge/AI-Powered%20Academic%20Platform-blue?style=for-the-badge)

### 🚀 AI-Powered Academic Management Platform

*A modern Academic Management System powered by Artificial Intelligence, Retrieval-Augmented Generation (RAG), and Role-Based Access Control.*

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)
![Gemini](https://img.shields.io/badge/Gemini-AI-blueviolet)
![OpenRouter](https://img.shields.io/badge/OpenRouter-LLM-black)

</div>

---

# 📖 Overview

Career Hub is a full-stack AI-powered Academic Management Platform designed to streamline academic administration while enhancing learning through Artificial Intelligence.

The platform enables secure collaboration between **Students**, **Faculty**, and **Administrators** using Role-Based Access Control (RBAC), JWT Authentication, MongoDB Atlas, and an AI Academic Assistant powered by Google Gemini.

Unlike traditional college portals, Career Hub integrates **Retrieval-Augmented Generation (RAG)**, allowing students to ask questions directly from uploaded study materials, notes, and academic documents.

---

# ✨ Features

## 👨‍💼 Administrator

- User Management
- Faculty Management
- Student Management
- Department Management
- Classroom Management
- Role Management
- Subject Management
- Activity Logs
- AI Assistant
- Secure Dashboard

---

## 👨‍🏫 Faculty

- Manage Assigned Classrooms
- Upload Study Materials
- Upload Previous Question Papers
- Create Assignments
- Publish Announcements
- AI Content Generation
- AI Question Paper Generator
- AI Document Assistant

---

## 👨‍🎓 Student

- Secure Login
- Personal Dashboard
- View Study Materials
- Download Previous Question Papers
- Submit Assignments
- AI Academic Assistant
- AI Chat History
- Smart Document Search

---

# 🤖 AI Features

Career Hub includes an enterprise-grade AI layer.

### AI Academic Assistant

- Natural Language Chat
- Context-Aware Conversations
- Chat History
- Markdown Responses
- Code Generation
- Programming Assistance

---

### RAG (Retrieval-Augmented Generation)

- PDF Processing
- DOCX Processing
- TXT Processing
- Markdown Processing
- Text Chunking
- Embedding Generation
- Semantic Search
- Source Attribution

The AI answers questions using uploaded academic documents instead of relying solely on general knowledge.

---

# 🏗️ System Architecture

```text
                    React + TypeScript
                           │
                           ▼
                  Express.js REST API
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
 MongoDB Atlas       JWT Authentication   OpenRouter
        │                                   │
        ▼                                   ▼
 Document Storage                  Google Gemini
        │
        ▼
 Document Processing
        │
        ▼
 Chunking
        │
        ▼
 Embeddings
        │
        ▼
 Semantic Retrieval (RAG)
        │
        ▼
 AI Response
```

---

# 🛠️ Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- ShadCN UI

---

## Backend

- Node.js
- Express.js

---

## Database

- MongoDB Atlas
- Mongoose

---

## Authentication

- JWT
- bcrypt

---

## AI Stack

- OpenRouter
- Google Gemini
- RAG
- Semantic Search
- Document Embeddings

---

# 🔐 Authentication

Career Hub implements enterprise-level authentication.

- JWT Authentication
- Password Hashing
- Role-Based Access Control
- Protected Routes
- Automatic Role Detection
- Session Persistence

---

# 🧠 AI Workflow

```text
Faculty Uploads PDF

        │

        ▼

Text Extraction

        │

        ▼

Chunk Generation

        │

        ▼

Embedding Generation

        │

        ▼

MongoDB Storage

        │

        ▼

Semantic Retrieval

        │

        ▼

Google Gemini

        │

        ▼

Context-Aware AI Response
```

---

# 📂 Project Structure

```
Career-Hub/

├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── services/
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── config/
│   │   └── utils/
│   │
│   └── package.json
│
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/nivesh-raja/Career-Hub.git
```

---

## Install Frontend

```bash
cd client

npm install

npm run dev
```

---

## Install Backend

```bash
cd server

npm install

npm run dev
```

---

# ⚙️ Environment Variables

Create

```
server/.env
```

Example

```env
PORT=5000

MONGODB_URI=YOUR_MONGODB_URI

JWT_SECRET=YOUR_SECRET

OPENROUTER_API_KEY=YOUR_API_KEY
```

---

# 📸 Screenshots

### Login
<img width="1907" height="968" alt="image" src="https://github.com/user-attachments/assets/3988a1f6-c77c-4121-9f0b-8461b286416f" />


---

### Admin Dashboard

<img width="1899" height="978" alt="image" src="https://github.com/user-attachments/assets/0ea977ac-5210-41bb-a837-173848e5e14d" />


---

### Faculty Dashboard

<img width="1903" height="970" alt="image" src="https://github.com/user-attachments/assets/8ad83dfb-e455-4368-9390-4fcf5e149a22" />


---

### Student Dashboard

<img width="1911" height="969" alt="image" src="https://github.com/user-attachments/assets/964ffadc-ce04-4cbd-8397-1a9efcc67975" />

---

### AI Assistant

<img width="1591" height="895" alt="image" src="https://github.com/user-attachments/assets/612b6470-442e-4328-835f-663b9940ed4c" />


---

### Document Library

<img width="408" height="799" alt="image" src="https://github.com/user-attachments/assets/9ecb4bbc-d4ac-4baf-a6da-763866d4947b" />


---

# 🔒 Security Features

- JWT Authentication
- Password Hashing
- Protected APIs
- Environment Variables
- MongoDB Atlas Security
- Role-Based Authorization
- Secure File Validation

---

# 📈 Current Progress

| Module | Status |
|----------|----------|
| Authentication | ✅ |
| Admin Dashboard | ✅ |
| Faculty Module | ✅ |
| Student Module | ✅ |
| User Management | ✅ |
| Role Management | ✅ |
| Classroom Management | ✅ |
| Assignments | ✅ |
| Question Papers | ✅ |
| Study Materials | ✅ |
| AI Chat | ✅ |
| RAG | ✅ |
| Document Upload | ✅ |
| Semantic Search | ✅ |
| MongoDB Integration | ✅ |

---

# 🚀 Future Enhancements

- AI Quiz Generator
- AI Flashcards
- AI Study Planner
- AI Resume Builder
- AI Mock Interviews
- AI Coding Assistant
- Mobile Application
- Real-Time Notifications
- Analytics Dashboard

---

# 👨‍💻 Author

**Nivesh Raja**

AI & Machine Learning Engineering Student

GitHub

https://github.com/nivesh-raja

---

# 📄 License

This project is developed for educational and portfolio purposes.

---

<div align="center">

⭐ If you found this project interesting, consider giving it a star.

Made with ❤️ using React, Node.js, MongoDB and Artificial Intelligence.

</div>
