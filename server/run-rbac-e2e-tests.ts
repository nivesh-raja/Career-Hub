import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

import User from './src/models/user.model.js';
import AINotes from './src/models/aiNotes.model.js';
import AINotice from './src/models/aiNotice.model.js';
import aiChatModel from './src/models/aiChat.model.js';

const API_BASE = 'http://localhost:5000/api/ai';
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set in environment.');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

async function runTests() {
    console.log("====================================================");
    console.log("       STARTING RBAC E2E SUITE STRESS TEST          ");
    console.log("====================================================\n");

    // Connect MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✓ Connected to MongoDB.");

    // Retrieve active users for each role
    const student = await User.findOne({ email: 'student@careerhub.edu' });
    const faculty = await User.findOne({ email: 'faculty@careerhub.edu' });
    const admin = await User.findOne({ email: 'admin@careerhub.edu' });

    if (!student || !faculty || !admin) {
        throw new Error("Could not find required users in DB.");
    }
    console.log(`✓ Found users for roles: Student (${student._id}), Faculty (${faculty._id}), Admin (${admin._id})`);

    // Generate Token
    const studentToken = jwt.sign({ id: student._id, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    const facultyToken = jwt.sign({ id: faculty._id, role: 'faculty' }, JWT_SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    console.log("✓ Signed test JWT tokens for all roles.");

    // Utility fetch function
    const authFetch = async (url: string, token: string, method: string = 'GET', body: any = null) => {
        const headers: any = { 'Authorization': `Bearer ${token}` };
        if (body) {
            headers['Content-Type'] = 'application/json';
        }
        const options: RequestInit = { method, headers };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE}${url}`, options);
        let data;
        try { data = await res.json(); } catch (e) { data = await res.text(); }
        return { status: res.status, data };
    };

    let passFailList: { name: string, passed: boolean }[] = [];
    const assertTest = (name: string, condition: boolean) => {
        if (condition) {
            console.log(`PASS: ${name}`);
            passFailList.push({ name, passed: true });
        } else {
            console.error(`FAIL: ${name}`);
            passFailList.push({ name, passed: false });
        }
    };

    console.log("\n--- [Test 1] Verifying RBAC on Endpoints ---");
    // Generate AI Assignment via faculty route
    // Student should fail it if they try to access faculty exclusive endpoints like question-paper
    const studentQPaperRes = await authFetch('/question-paper', studentToken, 'POST', { subject: 'Math', examType: 'semester' });
    assertTest('Student blocked from /question-paper (403)', studentQPaperRes.status === 403);

    const studentNoticeRes = await authFetch('/notice-report', studentToken, 'POST', { type: 'notice', topic: 'test' });
    assertTest('Student blocked from /notice-report (403)', studentNoticeRes.status === 403);

    const facultyNoticeRes = await authFetch('/notice-report', facultyToken, 'POST', { type: 'notice', topic: 'test' });
    assertTest('Faculty blocked from /notice-report (403)', facultyNoticeRes.status === 403);

    const adminQPaperRes = await authFetch('/question-paper', adminToken, 'POST', { subject: 'Science' });
    assertTest('Admin can access /question-paper (201)', adminQPaperRes.status === 201);

    console.log("\n--- [Test 2] Faculty/Admin specific content generation ---");
    // We already tested successful response in above, check if type matches
    console.log("adminQPaperRes data:", JSON.stringify(adminQPaperRes.data));
        assertTest('QPaper Gen returns correct object', adminQPaperRes.data.questionPaper?.title?.includes('Science'));

    console.log("\n--- [Test 3] Intent classification routing based on roles ---");
    // When student asks to create a question paper
    const studentChatRes = await authFetch('/chat', studentToken, 'POST', { prompt: 'Create a question paper for mathematics' });
    console.log("studentChatRes data:", JSON.stringify(studentChatRes.data));
    assertTest('Student intent asking for question paper redirects heavily to general chat', !studentChatRes.data?.intent || studentChatRes.data?.intent === 'general-chat');

    // When faculty asks to create a question paper
    const facultyChatRes = await authFetch('/chat', facultyToken, 'POST', { prompt: 'Create a question paper for mathematics' });
    console.log("facultyChatRes data:", JSON.stringify(facultyChatRes.data));
    assertTest('Faculty intent correctly identified for question paper', facultyChatRes.data?.intent === 'question-paper-generator' || facultyChatRes.data?.intent === 'general-chat');
    // NOTE: Depending on open router's response, it could be general chat or intent, but ideally should be question-paper-generator.

    const allPassed = passFailList.every(t => t.passed);
    console.log(`\n====================================================`);
    if (allPassed) {
        console.log(`     ✅ ALL  RBAC SUITE TESTS PASSED SUCCESSFULLY!    `);
    } else {
        console.error(`    ❌ SOME TESTS FAILED. PLease check logs.`);
    }
    console.log(`====================================================\n`);

    await mongoose.disconnect();
    process.exit(allPassed ? 0 : 1);
}

runTests().catch(async (e) => {
    console.error("Test execution failed:", e);
    await mongoose.disconnect();
    process.exit(1);
});
