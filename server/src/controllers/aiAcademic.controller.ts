import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import AINotes from '../models/aiNotes.model.js';
import AIFlashcard from '../models/aiFlashcard.model.js';
import AIQuiz from '../models/aiQuiz.model.js';
import AIStudyPlan from '../models/aiStudyPlan.model.js';
import AIAssignment from '../models/aiAssignment.model.js';
import AIQuestionPaper from '../models/aiQuestionPaper.model.js';
import AILessonPlan from '../models/aiLessonPlan.model.js';
import AINotice from '../models/aiNotice.model.js';
import { callAI } from '../services/ai.service.js';
import {
    generateNotesService,
    generateFlashcardsService,
    generateQuizService,
    generateStudyPlanService,
    generateAssignmentHelperService,
    generateFacultyAssignmentService,
    generateQuestionPaperService,
    generateLessonPlanService,
    generateNoticeReportService
} from '../services/aiAcademic.service.js';

// Helper to resolve Model by collection name
const getModelByCollection = (collection: string) => {
    switch (collection) {
        case 'notes': return AINotes;
        case 'flashcards': return AIFlashcard;
        case 'quizzes': return AIQuiz;
        case 'study-plans': return AIStudyPlan;
        case 'assignments': return AIAssignment;
        case 'question-papers': return AIQuestionPaper;
        case 'lesson-plans': return AILessonPlan;
        case 'notices': return AINotice;
        default: return null;
    }
};

// ── Notes Generator ──────────────────────────────────────────────────
export const generateNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { subject, chapter, topic, noteType } = req.body;
    if (!topic) {
        res.status(400).json({ success: false, message: 'Topic is required.' });
        return;
    }
    try {
        const doc = await generateNotesService({
            subject,
            chapter,
            topic,
            noteType: noteType || 'detailed',
            userId: String(req.user?._id)
        });
        res.status(201).json({ success: true, notes: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Flashcard Generator ──────────────────────────────────────────────
export const generateFlashcards = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { topic, difficulty } = req.body;
    if (!topic) {
        res.status(400).json({ success: false, message: 'Topic is required.' });
        return;
    }
    try {
        const doc = await generateFlashcardsService({
            topic,
            difficulty: difficulty || 'medium',
            userId: String(req.user?._id)
        });
        res.status(201).json({ success: true, flashcard: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Quiz Generator ───────────────────────────────────────────────────
export const generateQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { quizType, difficulty, questionsCount, topic } = req.body;
    if (!topic) {
        res.status(400).json({ success: false, message: 'Topic is required.' });
        return;
    }
    try {
        const doc = await generateQuizService({
            quizType: quizType || 'mcq',
            difficulty: difficulty || 'medium',
            questionsCount: Number(questionsCount) || 10,
            topic,
            userId: String(req.user?._id)
        });
        res.status(201).json({ success: true, quiz: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Study Planner ────────────────────────────────────────────────────
export const generateStudyPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examDate, subjects, dailyStudyHours, currentProgress } = req.body;
    if (!examDate || !subjects || !dailyStudyHours) {
        res.status(400).json({ success: false, message: 'Exam date, subjects, and daily hours are required.' });
        return;
    }
    try {
        const doc = await generateStudyPlanService({
            examDate,
            subjects,
            dailyStudyHours: Number(dailyStudyHours),
            currentProgress,
            userId: String(req.user?._id)
        });
        res.status(201).json({ success: true, studyPlan: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Assignment Helper/Generator ─────────────────────────────────────
export const generateAssignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { mode, assignmentText, assignmentType, difficulty, subject, topic } = req.body;

    try {
        if (mode === 'helper' || req.user?.role === 'student') {
            if (!assignmentText) {
                res.status(400).json({ success: false, message: 'Assignment description is required' });
                return;
            }
            const doc = await generateAssignmentHelperService({
                assignmentText,
                userId: String(req.user?._id)
            });
            res.status(201).json({ success: true, assignment: doc });
        } else {
            // Faculty generating assignments
            if (!subject || !topic) {
                res.status(400).json({ success: false, message: 'Subject and Topic are required for generation.' });
                return;
            }
            const doc = await generateFacultyAssignmentService({
                assignmentType: assignmentType || 'homework',
                difficulty: difficulty || 'medium',
                subject,
                topic,
                userId: String(req.user?._id)
            });
            res.status(201).json({ success: true, assignment: doc });
        }
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Question Paper Generator ──────────────────────────────────────────
export const generateQuestionPaper = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { examType, difficulty, bloomTaxonomy, questionTypes, subject } = req.body;
    if (!subject) {
        res.status(400).json({ success: false, message: 'Subject is required.' });
        return;
    }
    try {
        const doc = await generateQuestionPaperService({
            examType: examType || 'semester',
            difficulty: difficulty || 'medium',
            bloomTaxonomy: bloomTaxonomy || 'Apply',
            questionTypes: questionTypes || ['2 Marks', '5 Marks', '10 Marks'],
            subject,
            userId: String(req.user?._id)
        });
        res.status(201).json({ success: true, questionPaper: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Lesson Planner ───────────────────────────────────────────────────
export const generateLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { subject, semester, topics, duration } = req.body;
    if (!subject || !topics || topics.length === 0 || !duration) {
        res.status(400).json({ success: false, message: 'Subject, topics list, and duration are required.' });
        return;
    }
    try {
        const doc = await generateLessonPlanService({
            subject,
            semester: semester || '1',
            topics,
            duration,
            userId: String(req.user?._id)
        });
        res.status(201).json({ success: true, lessonPlan: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Notice Generator ─────────────────────────────────────────────────
export const generateNoticeReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { type, topic } = req.body;
    if (!type || !topic) {
        res.status(400).json({ success: false, message: 'Notice type and topic parameters are required.' });
        return;
    }
    try {
        const doc = await generateNoticeReportService({
            type,
            topic,
            userId: String(req.user?._id)
        });
        res.status(201).json({ success: true, notice: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Saved items CRUD ─────────────────────────────────────────────────
export const listSavedItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { type, isBookmarked, isFavorite, limit = 50, page = 1 } = req.query;
    const collectionsToSearch = type ? [String(type)] : ['notes', 'flashcards', 'quizzes', 'study-plans', 'assignments', 'question-papers', 'lesson-plans', 'notices'];

    try {
        const list: any[] = [];
        const skip = (Number(page) - 1) * Number(limit);

        for (const col of collectionsToSearch) {
            const Model = getModelByCollection(col) as any;
            if (!Model) continue;

            const queryObj: any = { user: req.user?._id };
            if (isBookmarked) queryObj.isBookmarked = isBookmarked === 'true';
            if (isFavorite) queryObj.isFavorite = isFavorite === 'true';

            const items = await Model.find(queryObj)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean();

            list.push(...items.map((i: any) => ({ ...i, collectionType: col })));
        }

        // Sort combined list by date descending
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.status(200).json({ success: true, items: list.slice(0, Number(limit)) });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const getSavedItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { collection, id } = req.params;
    const Model = getModelByCollection(collection) as any;
    if (!Model) {
        res.status(400).json({ success: false, message: 'Invalid collection type.' });
        return;
    }
    try {
        const item = await Model.findOne({ _id: id, user: req.user?._id });
        if (!item) {
            res.status(404).json({ success: false, message: 'Item not found.' });
            return;
        }
        res.status(200).json({ success: true, item });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const updateSavedItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { collection, id } = req.params;
    const { title, isBookmarked, isFavorite, cards } = req.body;
    const Model = getModelByCollection(collection) as any;
    if (!Model) {
        res.status(400).json({ success: false, message: 'Invalid collection type.' });
        return;
    }
    try {
        const updateFields: any = {};
        if (title !== undefined) updateFields.title = title;
        if (isBookmarked !== undefined) updateFields.isBookmarked = isBookmarked;
        if (isFavorite !== undefined) updateFields.isFavorite = isFavorite;
        if (cards !== undefined) updateFields.cards = cards;

        const item = await Model.findOneAndUpdate(
            { _id: id, user: req.user?._id },
            { $set: updateFields },
            { new: true }
        );

        if (!item) {
            res.status(404).json({ success: false, message: 'Item not found.' });
            return;
        }
        res.status(200).json({ success: true, item });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteSavedItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { collection, id } = req.params;
    const Model = getModelByCollection(collection) as any;
    if (!Model) {
        res.status(400).json({ success: false, message: 'Invalid collection type.' });
        return;
    }
    try {
        const item = await Model.findOneAndDelete({ _id: id, user: req.user?._id });
        if (!item) {
            res.status(404).json({ success: false, message: 'Item not found or unauthorized.' });
            return;
        }
        res.status(200).json({ success: true, message: 'Deleted successfully.' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Global Search ────────────────────────────────────────────────────
export const globalSearch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { query } = req.query;
    if (!query || !String(query).trim()) {
        res.status(400).json({ success: false, message: 'Search term is required.' });
        return;
    }

    const keyword = String(query).trim();
    const regex = new RegExp(keyword, 'i');
    const cols = ['notes', 'flashcards', 'quizzes', 'study-plans', 'assignments', 'question-papers', 'lesson-plans', 'notices'];

    try {
        const results: any[] = [];

        for (const col of cols) {
            const Model = getModelByCollection(col) as any;
            if (!Model) continue;

            const filter: any = {
                user: req.user?._id,
                $or: [
                    { title: regex },
                    { topic: regex },
                    { content: regex },
                    { subject: regex }
                ]
            };

            const items = await Model.find(filter).limit(10).lean();
            results.push(...items.map((i: any) => ({
                id: i._id,
                title: i.title,
                createdAt: i.createdAt,
                isBookmarked: i.isBookmarked,
                isFavorite: i.isFavorite,
                collectionType: col
            })));
        }

        res.status(200).json({ success: true, results });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Faculty: Study Material Generator
export const generateStudyMaterial = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { subject, topic, difficulty } = req.body;
    if (!topic || !subject) {
        res.status(400).json({ success: false, message: 'Subject and Topic are required.' });
        return;
    }
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are an elite academic textbook writer. Generate comprehensive Study Material (including explanations, cheat sheets, and practice guidelines) on the provided subject and topic. Format details as beautiful Markdown.' },
            { role: 'user', content: `Subject: ${subject}\nTopic: ${topic}\nDifficulty: ${difficulty || 'medium'}` }
        ]);

        const doc = await AINotes.create({
            user: req.user?._id,
            title: `Study Material: ${topic} (${subject})`,
            subject,
            topic,
            noteType: 'detailed',
            content: responseText,
            sourceDocuments: ['General AI Knowledge']
        });
        res.status(201).json({ success: true, notes: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Faculty: Rubric Builder
export const generateRubric = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { subject, topic, assignmentTitle } = req.body;
    if (!topic || !subject) {
        res.status(400).json({ success: false, message: 'Subject and Topic/Assignment details are required.' });
        return;
    }
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are an educational evaluator. Build a grading rubric (containing criteria table, points mapping, and performance levels from excellent to poor) for the assignment details. Format details as beautiful Markdown.' },
            { role: 'user', content: `Subject: ${subject}\nAssignment/Topic: ${topic} ${assignmentTitle || ''}` }
        ]);

        const doc = await AINotes.create({
            user: req.user?._id,
            title: `Rubric: ${topic.substring(0, 30)}`,
            subject,
            topic,
            noteType: 'detailed',
            content: responseText,
            sourceDocuments: ['General AI Knowledge']
        });
        res.status(201).json({ success: true, notes: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Faculty: Classroom AI Assistant
export const generateClassroomAssistant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { topic } = req.body;
    if (!topic) {
        res.status(400).json({ success: false, message: 'Topic/Prompt is required.' });
        return;
    }
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are an AI teaching assistant. Provide classroom strategies, icebreakers, group activities, or explanations to assist the teacher. Format details as beautiful Markdown.' },
            { role: 'user', content: `Classroom Assistant request on: ${topic}` }
        ]);

        const doc = await AINotes.create({
            user: req.user?._id,
            title: `Classroom AI: ${topic.substring(0, 30)}`,
            subject: 'Classroom Management',
            topic,
            noteType: 'bullet',
            content: responseText,
            sourceDocuments: ['General AI Knowledge']
        });
        res.status(201).json({ success: true, notes: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Faculty: Student Performance Summary
export const generatePerformanceSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { classroomId } = req.body;
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are an academic advisor. Generate a mock analytical summary report of a student classroom performance, including GPA trends, attendance analysis, warning lists, and remediation suggestions. Format details as beautiful Markdown.' },
            { role: 'user', content: `Summarize performance metrics for classroom: ${classroomId || 'All Active Sections'}` }
        ]);

        const doc = await AINotes.create({
            user: req.user?._id,
            title: `Student Performance Summary`,
            subject: 'Academic Analytics',
            topic: classroomId || 'Unified Classroom',
            noteType: 'detailed',
            content: responseText,
            sourceDocuments: ['General AI Knowledge']
        });
        res.status(201).json({ success: true, notes: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Faculty: AI Announcement Generator
export const generateAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { topic } = req.body;
    if (!topic) {
        res.status(400).json({ success: false, message: 'Topic is required.' });
        return;
    }
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are a department head. Generate a warm, official campus announcement/notice for students. Format details as professional Markdown.' },
            { role: 'user', content: `Announcement topic: ${topic}` }
        ]);

        const doc = await AINotice.create({
            user: req.user?._id,
            title: `Announcement: ${topic.substring(0, 30)}`,
            type: 'notice',
            content: responseText
        });
        res.status(201).json({ success: true, notice: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Admin: Department Analytics
export const generateDeptAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { topic } = req.body;
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are a Dean of Admissions / HOD. Write a Departmental Performance & Resource Analytics Report. Format details as beautiful Markdown.' },
            { role: 'user', content: `Details: ${topic || 'Overall departmental resource allocation and performance evaluation'}` }
        ]);

        const doc = await AINotice.create({
            user: req.user?._id,
            title: `Dept Analytics: ${topic ? topic.substring(0, 20) : 'General'}`,
            type: 'report_dept',
            content: responseText
        });
        res.status(201).json({ success: true, notice: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Admin: User Activity Summary
export const generateUserActivitySum = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { topic } = req.body;
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are an institutional administrator. Provide an audit summary of user access patterns, logins, classroom edits, and overall portal activity stats. Format details as beautiful Markdown.' },
            { role: 'user', content: `Details: ${topic || 'Portal system statistics'}` }
        ]);

        const doc = await AINotice.create({
            user: req.user?._id,
            title: `User Activity Audit Summary`,
            type: 'report_academic',
            content: responseText
        });
        res.status(201).json({ success: true, notice: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Admin: AI Policy Generator
export const generatePolicyGen = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { topic } = req.body;
    if (!topic) {
        res.status(400).json({ success: false, message: 'Policy Topic is required.' });
        return;
    }
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are a university senate policies officer. Generate a Campus AI Usage / Academic Integrity Policy document. Format details as beautiful Markdown.' },
            { role: 'user', content: `Policy Topic: ${topic}` }
        ]);

        const doc = await AINotice.create({
            user: req.user?._id,
            title: `AI Policy: ${topic.substring(0, 30)}`,
            type: 'notice',
            content: responseText
        });
        res.status(201).json({ success: true, notice: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Admin: AI Dashboard Insights
export const generateDashboardInsights = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { topic } = req.body;
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are a dashboard analytics assistant. Construct high-level executive insights, system load indicators, database health reports and forecast charts projections. Format details as beautiful Markdown.' },
            { role: 'user', content: `Details: ${topic || 'System state summary'}` }
        ]);

        const doc = await AINotice.create({
            user: req.user?._id,
            title: `Executive Dashboard Insights`,
            type: 'report_sem',
            content: responseText
        });
        res.status(201).json({ success: true, notice: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── Admin: Institution Statistics
export const generateInstitutionStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { topic } = req.body;
    try {
        const responseText = await callAI([
            { role: 'system', content: 'You are an accreditation analyst. Compile a comprehensive statistics overview of academic pass rates, placement indicators, department feedback scores, and research publications. Format details as beautiful Markdown.' },
            { role: 'user', content: `Details: ${topic || 'General Accreditation'}` }
        ]);

        const doc = await AINotice.create({
            user: req.user?._id,
            title: `Institution Stats Overview`,
            type: 'report_academic',
            content: responseText
        });
        res.status(201).json({ success: true, notice: doc });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

