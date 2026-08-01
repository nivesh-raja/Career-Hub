import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

dotenv.config();

import {
    getStudentAnalytics,
    getFacultyAnalytics,
    getAdminAnalytics,
    getAIAnalytics,
    getSystemOverviewAndInsights
} from './src/controllers/analytics.controller.js';
import User from './src/models/user.model.js';

async function runAnalyticsTests() {
    console.log("====================================================");
    console.log("       STARTING BACKEND ANALYTICS CONTROLLER TEST    ");
    console.log("====================================================\n");

    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI is not set in environment.");
        process.exit(1);
    }

    // Connect MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB.");

    // Fetch test users
    const student = await User.findOne({ role: 'student' });
    const faculty = await User.findOne({ role: 'faculty' });
    const admin = await User.findOne({ role: 'admin' });

    if (!student || !faculty || !admin) {
        console.warn("⚠️ Warning: Could not find student, faculty, or admin in database. Mock stats might run on empty collections.");
    } else {
        console.log(`✓ Test Users present: Student ID (${student._id}), Faculty ID (${faculty._id}), Admin ID (${admin._id})`);
    }

    // Mock response builder
    const createMockResponse = () => {
        const res: Partial<Response> = {};
        let statusVal = 200;
        let jsonVal: any = null;

        res.status = (code: number) => {
            statusVal = code;
            return res as Response;
        };

        res.json = (data: any) => {
            jsonVal = data;
            return res as Response;
        };

        return {
            res: res as Response,
            getResult: () => ({ status: statusVal, json: jsonVal })
        };
    };

    let totalTests = 0;
    let passedTests = 0;

    const assertSuccess = (testName: string, result: { status: number, json: any }) => {
        totalTests++;
        if (result.status === 200 && result.json?.success === true) {
            console.log(`PASS: ${testName} (Status 200, success: true)`);
            passedTests++;
        } else {
            console.error(`FAIL: ${testName} (Status ${result.status}, response: ${JSON.stringify(result.json)})`);
        }
    };

    // Test 1: Student Analytics
    console.log("\n--- Executing Student Analytics ---");
    if (student) {
        const { res, getResult } = createMockResponse();
        const req = {
            user: { _id: student._id, id: student._id.toString(), role: 'student' },
            query: { timeframe: '30days' }
        } as unknown as Request;

        await getStudentAnalytics(req, res);
        const result = getResult();
        assertSuccess('getStudentAnalytics normal execution', result);
    } else {
        console.log("Skipped: no test student in DB");
    }

    // Test 2: Faculty Analytics
    console.log("\n--- Executing Faculty Analytics ---");
    if (faculty) {
        const { res, getResult } = createMockResponse();
        const req = {
            user: { _id: faculty._id, id: faculty._id.toString(), role: 'faculty' },
            query: { timeframe: '30days' }
        } as unknown as Request;

        await getFacultyAnalytics(req, res);
        const result = getResult();
        assertSuccess('getFacultyAnalytics normal execution', result);
    } else {
        console.log("Skipped: no test faculty in DB");
    }

    // Test 3: Admin Analytics
    console.log("\n--- Executing Admin Analytics ---");
    if (admin) {
        const { res, getResult } = createMockResponse();
        const req = {
            user: { _id: admin._id, id: admin._id.toString(), role: 'admin' },
            query: { timeframe: '30days' }
        } as unknown as Request;

        await getAdminAnalytics(req, res);
        const result = getResult();
        assertSuccess('getAdminAnalytics normal execution', result);
    } else {
        console.log("Skipped: no test admin in DB");
    }

    // Test 4: AI Usage Analytics
    console.log("\n--- Executing AI Analytics ---");
    {
        const { res, getResult } = createMockResponse();
        const req = {
            query: { timeframe: '30days' }
        } as unknown as Request;

        await getAIAnalytics(req, res);
        const result = getResult();
        assertSuccess('getAIAnalytics normal execution', result);
    }

    // Test 5: Analytics Overview Insights
    console.log("\n--- Executing System Overview Analytics ---");
    {
        const { res, getResult } = createMockResponse();
        const req = {
            query: { timeframe: '30days' }
        } as unknown as Request;

        await getSystemOverviewAndInsights(req, res);
        const result = getResult();
        assertSuccess('getSystemOverviewAndInsights normal execution', result);
    }

    console.log(`\n====================================================`);
    console.log(`     ANALYTICS TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
    console.log(`====================================================\n`);

    await mongoose.disconnect();
    process.exit(passedTests === totalTests ? 0 : 1);
}

runAnalyticsTests().catch(async (e) => {
    console.error("Test framework failed:", e);
    await mongoose.disconnect();
    process.exit(1);
});
