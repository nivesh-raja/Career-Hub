import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { callAI } from './ai.service.js';
import { getRagContext } from './aiRag.helper.js';
import AINotes from '../models/aiNotes.model.js';
import AIFlashcard from '../models/aiFlashcard.model.js';
import AIQuiz from '../models/aiQuiz.model.js';

import AIStudyPlan from '../models/aiStudyPlan.model.js';
import AIAssignment from '../models/aiAssignment.model.js';
import AIQuestionPaper from '../models/aiQuestionPaper.model.js';
import AILessonPlan from '../models/aiLessonPlan.model.js';
import AINotice from '../models/aiNotice.model.js';

dotenv.config();

// Helper to clean JSON string from LLM responses
export const cleanJsonResponse = (rawText: string): any => {
    let clean = rawText.trim();
    // Remove markdown code blocks if present
    if (clean.startsWith('```')) {
        const matches = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
        if (matches && matches[1]) {
            clean = matches[1].trim();
        }
    }
    try {
        return JSON.parse(clean);
    } catch (e: any) {
        console.error('Failed to parse clean JSON. Raw text was:', rawText);
        throw new Error('AI returned invalid format: ' + e.message);
    }
};

// 1. AI Notes Generator
export const generateNotesService = async (params: {
    subject?: string;
    chapter?: string;
    topic: string;
    noteType: 'short' | 'detailed' | 'revision' | 'bullet' | 'examprep';
    userId: string;
}) => {
    const { subject, chapter, topic, noteType, userId } = params;
    const notesHeading = `${noteType.toUpperCase()} Notes: ${topic}`;

    const ragQuery = `${subject || ''} ${chapter || ''} ${topic}`;
    const { contextBlock, sourceDocuments } = await getRagContext(ragQuery, userId);

    const systemPrompt = `You are an expert academic tutor.
Generate detailed structured notes on the topic provided by the student.
Strictly format the response as beautiful structured Markdown.
Include:
- Clear Headings
- Important Points (bullet points)
- Explanatory Examples
- A concise summary at the end.

Ensure to incorporate context from the uploaded documents if provided.
At the very end of your response, you MUST append a source reference line.
If you used information from the uploaded documents, append:
"Source Reference: 📄 Source Documents: ${sourceDocuments.join(', ')}"
Otherwise, append:
"Source Reference: 🌐 General AI Knowledge"`;

    const userPrompt = `Subject: ${subject || 'General'}
Chapter: ${chapter || 'General'}
Topic: ${topic}
Notes Type: ${noteType} notes
${contextBlock ? `\nHere is context from my uploaded documents:\n${contextBlock}` : ''}`;

    const content = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    const sourceCitations = sourceDocuments.length > 0 ? sourceDocuments : ['General AI Knowledge'];

    const notesDoc = await AINotes.create({
        user: userId,
        title: notesHeading,
        subject,
        chapter,
        topic,
        noteType,
        content,
        sourceDocuments: sourceCitations
    });

    return notesDoc;
};

// 2. AI Flashcard Generator
export const generateFlashcardsService = async (params: {
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    userId: string;
}) => {
    const { topic, difficulty, userId } = params;
    const { contextBlock, sourceDocuments } = await getRagContext(topic, userId);

    const systemPrompt = `You are a study card generator.
Generate a list of 10 highly effective study flashcards.
Each flashcard must contain deep definitions, questions, formulas, or conceptual checks.
You must return the response ONLY as a JSON array of objects. Do not wrap in markdown code blocks.
Each object in the array must match this schema:
{
  "question": "string identifying the concept card prompt",
  "answer": "detailed explanation of the answer",
  "topic": "${topic}",
  "difficulty": "${difficulty}"
}

Rely on the provided document context if available.`;

    const userPrompt = `Topic: ${topic}
Difficulty: ${difficulty}
${contextBlock ? `\nHere is context from my uploaded documents:\n${contextBlock}` : ''}`;

    const response = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    const parsedFlashcards = cleanJsonResponse(response);
    const sourceCitations = sourceDocuments.length > 0 ? sourceDocuments : ['General AI Knowledge'];

    const flashcardsDoc = await AIFlashcard.create({
        user: userId,
        title: `Flashcards: ${topic} (${difficulty})`,
        topic,
        cards: parsedFlashcards.map((c: any) => ({
            question: c.question,
            answer: c.answer,
            topic: c.topic || topic,
            difficulty: c.difficulty || difficulty
        })),
        sourceDocuments: sourceCitations
    });

    return flashcardsDoc;
};

// 3. AI Quiz Generator
export const generateQuizService = async (params: {
    quizType: 'mcq' | 'tf' | 'fitb' | 'short';
    difficulty: 'easy' | 'medium' | 'hard';
    questionsCount: number;
    topic: string;
    userId: string;
}) => {
    const { quizType, difficulty, questionsCount, topic, userId } = params;
    const { contextBlock, sourceDocuments } = await getRagContext(topic, userId);

    const systemPrompt = `You are an expert exam designer.
Generate academic quiz questions on the specified topic.
Quiz Type: ${quizType} (mcq = Multiple Choice, tf = True/False, fitb = Fill in the blanks, short = Short Answer/Theory).
Difficulty: ${difficulty}
Count: ${questionsCount} questions
Include options for mcq and tf types (for tf, options must be ["True", "False"]). For fitb and short types, options must be empty [].

Return ONLY a JSON array of objects. Do not describe the format or wrap in markdown ticks of any kind.
Each object structure:
{
  "question": "question text",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "answer": "the exact string corresponding to the correct answer",
  "explanation": "concise explanation of why this answer is correct"
}

Prioritize information from the uploaded documents context if provided.`;

    const userPrompt = `Topic/Key terms: ${topic}
${contextBlock ? `\nDocument Context:\n${contextBlock}` : ''}`;

    const response = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    const parsedQuestions = cleanJsonResponse(response);
    const sourceCitations = sourceDocuments.length > 0 ? sourceDocuments : ['General AI Knowledge'];

    const quizDoc = await AIQuiz.create({
        user: userId,
        title: `Quiz on ${topic} (${quizType.toUpperCase()})`,
        quizType,
        difficulty,
        questionsCount,
        questions: parsedQuestions.map((q: any) => ({
            question: q.question,
            options: q.options || [],
            answer: q.answer,
            explanation: q.explanation || ''
        })),
        sourceDocuments: sourceCitations
    });

    return quizDoc;
};

// 4. AI Study Planner
export const generateStudyPlanService = async (params: {
    examDate: string;
    subjects: string[];
    dailyStudyHours: number;
    currentProgress?: string;
    userId: string;
}) => {
    const { examDate, subjects, dailyStudyHours, currentProgress, userId } = params;

    const systemPrompt = `You are a strategic study planner. Create an optimized Study Plan for the student.
Return the output ONLY as a JSON object containing keys:
- 'dailyPlan': markdown formatted calendar detailing daily activities.
- 'weeklyPlan': markdown week-by-week goals.
- 'revisionCalendar': markdown listing revision checkpoints.
- 'priorityTopics': array of high-yield subjects/chapters that need maximum time.
- 'remainingDaysAnalysis': markdown analyzing study load based on current constraints.
- 'progressTracker': markdown checklist or trackers to maintain discipline.

Optimize strictly around exam date ${examDate}, study hours available: ${dailyStudyHours} hrs/day, and progress status: ${currentProgress || 'N/A'}`;

    const userPrompt = `Subjects to prepare: ${subjects.join(', ')}
Daily Hours: ${dailyStudyHours}
Exam Date: ${examDate}
Current Progress Details: ${currentProgress || 'Not defined'}`;

    const response = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    const planData = cleanJsonResponse(response);

    const studyDoc = await AIStudyPlan.create({
        user: userId,
        title: `Study Plan: ${subjects.join(', ')} Exam Prep`,
        examDate: new Date(examDate),
        subjects,
        dailyStudyHours,
        currentProgress,
        planData: {
            dailyPlan: planData.dailyPlan || '',
            weeklyPlan: planData.weeklyPlan || '',
            revisionCalendar: planData.revisionCalendar || '',
            priorityTopics: planData.priorityTopics || [],
            remainingDaysAnalysis: planData.remainingDaysAnalysis || '',
            progressTracker: planData.progressTracker || ''
        }
    });

    return studyDoc;
};

// 5. AI Assignment Helper (Student)
export const generateAssignmentHelperService = async (params: {
    assignmentText: string;
    userId: string;
}) => {
    const { assignmentText, userId } = params;
    const { contextBlock, sourceDocuments } = await getRagContext(assignmentText, userId);

    const systemPrompt = `You are an AI Assignment Facilitator.
Your goal is to explain the assignment, guide the student on how to approach it step-by-step, and list helpful suggestions.
CRITICAL MANDATE: Never automatically complete assignments or write out final solutions, answers, or full code unless explicitly requested. Provide learning templates and guidance.

Structuring Guidelines:
Format as beautiful structured Markdown.
Include:
- Assignment Objective Explanation
- Micro subtasks list
- Suggested approach and step-by-step logic
- Suggested algorithms if coding-related
- Core reference materials
- Step-by-step learning roadmap.

At the very end of your response, append:
"Source Reference: 📄 Source Documents: ${sourceDocuments.join(', ')}" if context used.
Otherwise, append "Source Reference: 🌐 General AI Knowledge"`;

    const userPrompt = `Assignment description: ${assignmentText}
${contextBlock ? `\nContext from course documents:\n${contextBlock}` : ''}`;

    const content = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    const sourceCitations = sourceDocuments.length > 0 ? sourceDocuments : ['General AI Knowledge'];

    const assignmentDoc = await AIAssignment.create({
        user: userId,
        title: `Assignment Guide: ${assignmentText.substring(0, 40)}...`,
        type: 'helper',
        content,
        sourceDocuments: sourceCitations
    });

    return assignmentDoc;
};

// 6. AI Assignment Generator (Faculty)
export const generateFacultyAssignmentService = async (params: {
    assignmentType: 'programming' | 'theory' | 'miniproject' | 'lab' | 'homework';
    difficulty: 'easy' | 'medium' | 'hard';
    subject: string;
    topic: string;
    userId: string;
}) => {
    const { assignmentType, difficulty, subject, topic, userId } = params;
    const { contextBlock, sourceDocuments } = await getRagContext(`${subject} ${topic}`, userId);

    const systemPrompt = `You are an academic curriculum developer.
Generate an assignment sheet for university students.
Format the output as clean structured Markdown.
Include:
- Assignment Title
- Problem statement or questions
- Specific requirements/deliverables
- Detailed grading rubric (criteria and marks)
- Recommended materials (books, document contexts, libraries).

At the end of response, list source reference.`;

    const userPrompt = `Subject: ${subject}
Topic: ${topic}
Assignment Type: ${assignmentType}
Difficulty: ${difficulty}
${contextBlock ? `\nRelevant class research:\n${contextBlock}` : ''}`;

    const content = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    const sourceCitations = sourceDocuments.length > 0 ? sourceDocuments : ['General AI Knowledge'];

    const assignmentDoc = await AIAssignment.create({
        user: userId,
        title: `${subject}: ${topic} Assignment (${difficulty})`,
        type: assignmentType,
        difficulty,
        subject,
        content,
        sourceDocuments: sourceCitations
    });

    return assignmentDoc;
};

// 7. AI Question Paper Generator (Faculty)
export const generateQuestionPaperService = async (params: {
    examType: 'internal' | 'semester' | 'lab';
    difficulty: 'easy' | 'medium' | 'hard';
    bloomTaxonomy: string;
    questionTypes: string[];
    subject: string;
    userId: string;
}) => {
    const { examType, difficulty, bloomTaxonomy, questionTypes, subject, userId } = params;
    const { contextBlock, sourceDocuments } = await getRagContext(subject, userId);

    const qTypes = questionTypes || ['Short Answer', 'Long Answer'];
    const systemPrompt = `You are a university examination board planner.
Generate a structured examination Question Paper matching appropriate standards.
Structure your response in Markdown with two clear divisions:
# DIVISION I: QUESTION PAPER
- Standard details (Subject, Marks, Time)
- Questions split by types: ${qTypes.join(', ')}
- Tag questions with Bloom's Taxonomy levels (e.g. [Analyze], [Remember]).

# DIVISION II: ANSWER KEY & SCHEME
- Outline step-by-step marking metrics, formulas, or short points for each question.
- Distribution overview indicating Bloom level percentages and difficulty mappings.`;

    const userPrompt = `Subject: ${subject}
Exam Type: ${examType} Exam
Difficulty: ${difficulty}
Bloom Focus: ${bloomTaxonomy}
Question Marks Required: ${qTypes.join(', ')}
${contextBlock ? `\nIncorporate syllabus chunks:\n${contextBlock}` : ''}`;

    const content = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    const sourceCitations = sourceDocuments.length > 0 ? sourceDocuments : ['General AI Knowledge'];

    const paperDoc = await AIQuestionPaper.create({
        user: userId,
        title: `${subject}: ${examType.toUpperCase()} Exam (${difficulty})`,
        examType,
        difficulty,
        bloomTaxonomy,
        questionTypes,
        content,
        sourceDocuments: sourceCitations
    });

    return paperDoc;
};

// 8. AI Lesson Planner (Faculty)
export const generateLessonPlanService = async (params: {
    subject: string;
    semester: string;
    topics: string[];
    duration: string;
    userId: string;
}) => {
    const { subject, semester, topics, duration, userId } = params;
    const { contextBlock, sourceDocuments } = await getRagContext(`${subject} ${topics.join(' ')}`, userId);

    const systemPrompt = `You are a senior instructional designer.
Create a structured syllabus Lesson Plan.
Format as Markdown with headings:
- Weekly Lesson Plan (Grid/List with weeks, topics, duration)
- Specific Learning Objectives
- Interactive Teaching Activities
- Assessment Plan (how to test milestones).`;

    const userPrompt = `Subject: ${subject}
Semester: ${semester}
Topics: ${topics.join(', ')}
Course Duration: ${duration}
${contextBlock ? `\nContext notes:\n${contextBlock}` : ''}`;

    const content = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    const planDoc = await AILessonPlan.create({
        user: userId,
        title: `Lesson Plan: ${subject} (${semester})`,
        subject,
        semester,
        topics,
        duration,
        weeklyPlan: content,
        learningObjectives: [`Objectives for ${subject}`],
        teachingActivities: [`Activities covering ${topics.join(', ')}`],
        assessmentPlan: 'Assessments based on weekly teaching schedule.'
    });

    return planDoc;
};

// 9. AI Admin Notice Generator (Admin)
export const generateNoticeReportService = async (params: {
    type: 'circular' | 'notice' | 'email' | 'report_academic' | 'report_dept' | 'report_sem';
    topic: string;
    userId: string;
}) => {
    const { type, topic, userId } = params;
    const { contextBlock } = await getRagContext(topic, userId);

    const systemPrompt = `You are a professional university administrative system.
Generate an official academic correspondence or report of type: ${type.toUpperCase()}.
Structure using clear professional header tags, metadata, greeting, details, and official footer.
Format as Markdown.`;

    const userPrompt = `Notice Brief/Information: ${topic}
${contextBlock ? `\nContext documentation:\n${contextBlock}` : ''}`;

    const content = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]);

    const noticeDoc = await AINotice.create({
        user: userId,
        title: `Admin ${type.toUpperCase()}: ${topic.substring(0, 30)}...`,
        type,
        content
    });

    return noticeDoc;
};

// 10. Intent detection classifier
export const classifyIntent = async (prompt: string, role: string): Promise<{ intent: string; params: any }> => {
    const classificationPrompt = `You are an intent detection classifier for an academic AI platform.
Analyze the user's prompt and determine if they want to generate an academic item.
Note that the user has the role: '${role}'.

Available categories matching user roles:
- student, faculty, admin can perform:
  1. 'generate-notes' (generating short, detailed, exam revision notes)
  2. 'generate-flashcards' (creating study flashcards, Q&As)
  3. 'generate-quiz' (creating a quiz, questions, MCQs, True/False, fill in blanks)
  4. 'generate-study-plan' (creating study schedules, timetables, revision plans)
  5. 'assignment-helper' (explaining or helping with student assignments, roadmaps, coding tasks)

- ONLY faculty and admin can perform:
  6. 'faculty-assignment-generator' (faculty wanting to generate assignments, theory assignments, mini projects)
  7. 'question-paper-generator' (faculty wanting to generate internal or semester question papers)
  8. 'lesson-planner' (faculty wanting to create lesson plans, learning objectives, teaching schedules)

- ONLY admin can perform:
  9. 'notice-report-generator' (admin wanting to generate circulars, notices, emails, academic reports)

If their query is conversation, standard QA, or does not clearly fit any of the academic generators, return:
'general-chat'

Format the response strictly as a JSON object, with no markdown styling (i.e. do not use \`\`\`json):
{
  "intent": "category-name",
  "params": {
    "subject": "subject name if detected (else null)",
    "chapter": "chapter name/number if detected (else null)",
    "topic": "topic name/detail",
    "difficulty": "easy/medium/hard (default medium)",
    "questionCount": number of questions (default 10),
    "quizType": "mcq/tf/fitb/short (default mcq)",
    "examType": "internal/semester/lab (default semester)",
    "noteType": "short/detailed/revision/bullet/examprep (default detailed)",
    "bloomTaxonomy": "Apply/Analyze/Remember/etc. (default Apply)",
    "examDate": "YYYY-MM-DD string if exam date mentioned",
    "subjects": ["array of subjects if study plan"],
    "dailyStudyHours": number (default 4),
    "currentProgress": "progress description if study plan",
    "assignmentText": "assignment details if assignment helper",
    "assignmentType": "programming/theory/miniproject/lab/homework (default homework)",
    "duration": "duration of course e.g. 10 weeks",
    "type": "circular/notice/email/report_academic/report_dept/report_sem (default notice)",
    "semester": "semester number (default 1)"
  }
}`;

    try {
        const response = await callAI([
            { role: 'system', content: classificationPrompt },
            { role: 'user', content: prompt }
        ]);
        const cleaned = cleanJsonResponse(response);
        return {
            intent: cleaned.intent || 'general-chat',
            params: cleaned.params || {}
        };
    } catch (e) {
        console.error('Classification error:', e);
        return { intent: 'general-chat', params: {} };
    }
};

