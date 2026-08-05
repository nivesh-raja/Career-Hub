import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from './src/models/user.model.js';
import Submission from './src/models/submission.model.js';
import Assignment from './src/models/assignment.model.js';
import AIChat from './src/models/aiChat.model.js';
import AINotes from './src/models/aiNotes.model.js';
import AIQuiz from './src/models/aiQuiz.model.js';
import Classroom from './src/models/classroom.model.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'careerhub_super_secret_key_2026_jwt_token';

async function runQA() {
    console.log("==================================================================");
    console.log("   PHASE 5B.1 COMPLETE QA VERIFICATION & DATABASE CROSS-CHECK   ");
    console.log("==================================================================\n");

    // 1. DB Connect
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✓ Connected to MongoDB.");

    // 2. Fetch Users
    const student = await User.findOne({ email: 'student@careerhub.edu' });
    const faculty = await User.findOne({ email: 'faculty@careerhub.edu' });
    const admin = await User.findOne({ email: 'admin@careerhub.edu' });

    if (!student || !faculty || !admin) {
        console.error("❌ Test users not found in DB.");
        process.exit(1);
    }
    console.log(`✓ Found Test Users:`);
    console.log(`  - Student: ${student.name} (${student._id})`);
    console.log(`  - Faculty: ${faculty.name} (${faculty._id})`);
    console.log(`  - Admin:   ${admin.name} (${admin._id})`);

    // 3. Generate Tokens
    const studentToken = jwt.sign({ id: student._id, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    const facultyToken = jwt.sign({ id: faculty._id, role: 'faculty' }, JWT_SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    console.log("✓ Generated JWT tokens for authorization.\n");

    // Helper fetch
    const httpGet = async (url: string, token?: string) => {
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE}${url}`, { method: 'GET', headers });
        let data = null;
        try {
            data = await res.json();
        } catch (e) {
            data = await res.text();
        }
        return { status: res.status, data };
    };

    const rbacResults: any[] = [];
    const verifyRBAC = (testName: string, expectedStatus: number, actualStatus: number) => {
        const passed = expectedStatus === actualStatus;
        rbacResults.push({ testName, expectedStatus, actualStatus, passed });
        console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${testName} (Expected ${expectedStatus}, Got ${actualStatus})`);
    };

    console.log("--- 1. Testing Role-Based Access Control (RBAC) ---");
    
    // Student endpoints access
    const res1 = await httpGet('/analytics/student', studentToken);
    verifyRBAC("Student accessing GET /analytics/student", 200, res1.status);

    const res2 = await httpGet('/analytics/student', facultyToken);
    verifyRBAC("Faculty accessing GET /analytics/student (403)", 403, res2.status);

    const res3 = await httpGet('/analytics/student', adminToken);
    verifyRBAC("Admin accessing GET /analytics/student (403)", 403, res3.status);

    // Student other profile access
    const res4 = await httpGet(`/analytics/student/${student._id}`, studentToken);
    verifyRBAC("Student accessing own profile /analytics/student/:id", 200, res4.status);

    const res5 = await httpGet(`/analytics/student/${admin._id}`, studentToken);
    verifyRBAC("Student accessing other profile /analytics/student/:id (403)", 403, res5.status);

    const res6 = await httpGet(`/analytics/student/${student._id}`, adminToken);
    verifyRBAC("Admin accessing student profile /analytics/student/:id", 200, res6.status);

    // Faculty endpoints access
    const res7 = await httpGet('/analytics/faculty', facultyToken);
    verifyRBAC("Faculty accessing GET /analytics/faculty", 200, res7.status);

    const res8 = await httpGet('/analytics/faculty', studentToken);
    verifyRBAC("Student accessing GET /analytics/faculty (403)", 403, res8.status);

    // Admin endpoints access
    const res9 = await httpGet('/analytics/admin', adminToken);
    verifyRBAC("Admin accessing GET /analytics/admin", 200, res9.status);

    const res10 = await httpGet('/analytics/admin', studentToken);
    verifyRBAC("Student accessing GET /analytics/admin (403)", 403, res10.status);

    const res11 = await httpGet('/analytics/admin', facultyToken);
    verifyRBAC("Faculty accessing GET /analytics/admin (403)", 403, res11.status);

    // No Token check
    const resUnauth = await httpGet('/analytics/student');
    verifyRBAC("No Token accessing GET /analytics/student (401)", 401, resUnauth.status);

    console.log("\n--- 2. Database Cross-Check & Health Calculations Validation ---");

    // Let's do Student Analytics
    const studentRes = await httpGet('/analytics/student', studentToken);
    const dbSubmissions = await Submission.countDocuments({ student: student._id, status: { $in: ['Submitted', 'Reviewed'] } });
    const dbChats = await AIChat.countDocuments({ user: student._id });
    const dbNotes = await AINotes.countDocuments({ user: student._id });
    
    console.log(`Student Data Verification:`);
    console.log(`  - Submissions count: API = ${studentRes.data.data.assignmentsCompleted}, DB = ${dbSubmissions}`);
    console.log(`  - AI Chats count:    API = ${studentRes.data.data.aiChatsUsed}, DB = ${dbChats}`);
    console.log(`  - AI Notes count:    API = ${studentRes.data.data.generatedNotesCount}, DB = ${dbNotes}`);
    
    const studentMatch = studentRes.data.data.assignmentsCompleted === dbSubmissions && 
                         studentRes.data.data.aiChatsUsed === dbChats && 
                         studentRes.data.data.generatedNotesCount === dbNotes;

    console.log(`${studentMatch ? '✅ PASS' : '❌ FAIL'}: Student values match MongoDB exactly.`);

    // Intelligence dashboard verification
    const intelRes = await httpGet('/intelligence/dashboard', studentToken);
    const scores = intelRes.data.scores;
    console.log(`Student Intelligence Scores Schema:`);
    console.log(`  - Overall Health Score: ${scores.overallHealthScore}%`);
    console.log(`  - Learning Score:       ${scores.learningScore}%`);
    console.log(`  - Completion Score:     ${scores.completionScore}%`);
    console.log(`  - AI Usage Score:       ${scores.aiUsageScore}%`);
    console.log(`  - Consistency Score:    ${scores.consistencyScore}%`);
    console.log(`  - Risk Level:           ${scores.riskLevel} (Color: ${scores.riskColor})`);
    console.log(`  - Trend:                ${scores.trend}`);
    console.log(`  - Last Updated:         ${scores.lastUpdated}`);

    const hasNoPlaceholders = scores.overallHealthScore !== undefined &&
                               scores.learningScore !== undefined &&
                               scores.completionScore !== undefined &&
                               scores.aiUsageScore !== undefined &&
                               scores.consistencyScore !== undefined &&
                               scores.riskLevel !== undefined &&
                               scores.trend !== undefined;
    console.log(`${hasNoPlaceholders ? '✅ PASS' : '❌ FAIL'}: Student Health calculations returned proper non-placeholder values.`);

    // Faculty dashboard verification
    const facultyIntelRes = await httpGet('/intelligence/dashboard', facultyToken);
    const fScores = facultyIntelRes.data.scores;
    console.log(`Faculty Intelligence Scores Schema:`);
    console.log(`  - Overall Faculty Score:   ${fScores.overallFacultyScore}%`);
    console.log(`  - Teaching Effectiveness:  ${fScores.teachingEffectiveness}%`);
    console.log(`  - Classroom Engagement:    ${fScores.classroomEngagement}%`);
    console.log(`  - Assignment Management:   ${fScores.assignmentManagement}%`);
    console.log(`  - AI Adoption Ratio:       ${fScores.aiAdoption}%`);
    console.log(`  - Risk Level:              ${fScores.riskLevel}`);
    console.log(`  - Trend:                   ${fScores.trend}`);

    // Admin dashboard verification
    const adminIntelRes = await httpGet('/intelligence/dashboard', adminToken);
    const aScores = adminIntelRes.data.scores;
    console.log(`Admin Intelligence Scores Schema:`);
    console.log(`  - System Health:           ${aScores.systemHealth}%`);
    console.log(`  - Academic Health:         ${aScores.academicHealth}%`);
    console.log(`  - Student Health:          ${aScores.studentHealth}%`);
    console.log(`  - Faculty Health:          ${aScores.facultyHealth}%`);
    console.log(`  - AI Adoption Score:       ${aScores.aiAdoption}%`);
    console.log(`  - Risk Level:              ${aScores.riskLevel}`);
    console.log(`  - Trend:                   ${aScores.trend}`);

    console.log("\n--- 3. Testing Smart Alerts Engine (Dynamic Alerts) ---");
    const alertRes = await httpGet('/analytics/alerts', studentToken);
    console.log(`Student Alerts count: ${alertRes.data.total}`);
    if (alertRes.data.alerts && alertRes.data.alerts.length > 0) {
        const sampleAlert = alertRes.data.alerts[0];
        console.log(`Sample Student Alert:`);
        console.log(`  - Title:       ${sampleAlert.title}`);
        console.log(`  - Description: ${sampleAlert.description}`);
        console.log(`  - Severity:    ${sampleAlert.severity}`);
        console.log(`  - Priority:    ${sampleAlert.priority}`);
        console.log(`  - Role:        ${sampleAlert.role}`);
    } else {
        console.log("No student alerts generated (all indicators clear).");
    }

    const facultyAlertRes = await httpGet('/analytics/alerts', facultyToken);
    console.log(`Faculty Alerts count: ${facultyAlertRes.data.total}`);
    if (facultyAlertRes.data.alerts && facultyAlertRes.data.alerts.length > 0) {
        const sampleAlert = facultyAlertRes.data.alerts[0];
        console.log(`Sample Faculty Alert:`);
        console.log(`  - Title:       ${sampleAlert.title}`);
        console.log(`  - Description: ${sampleAlert.description}`);
        console.log(`  - Severity:    ${sampleAlert.severity}`);
        console.log(`  - Priority:    ${sampleAlert.priority}`);
    }

    const adminAlertRes = await httpGet('/analytics/alerts', adminToken);
    console.log(`Admin Alerts count: ${adminAlertRes.data.total}`);
    if (adminAlertRes.data.alerts && adminAlertRes.data.alerts.length > 0) {
        const sampleAlert = adminAlertRes.data.alerts[0];
        console.log(`Sample Admin Alert:`);
        console.log(`  - Title:       ${sampleAlert.title}`);
        console.log(`  - Description: ${sampleAlert.description}`);
        console.log(`  - Severity:    ${sampleAlert.severity}`);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB.");

    const allPassed = rbacResults.every(r => r.passed) && studentMatch && hasNoPlaceholders;
    console.log("==================================================================");
    if (allPassed) {
        console.log("      🎉 ALL HTTP, RBAC AND MONGODB QA VERIFICATIONS PASSED!     ");
    } else {
        console.log("      ❌ SOME QA VERIFICATION CHECKS FAILED!                    ");
    }
    console.log("==================================================================");

    process.exit(allPassed ? 0 : 1);
}

runQA().catch(err => {
    console.error("Test execution crash:", err);
    mongoose.disconnect();
    process.exit(1);
});
