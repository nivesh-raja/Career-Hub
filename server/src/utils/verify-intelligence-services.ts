import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Force register all mongoose schemas
import User from '../models/user.model.js';
import Classroom from '../models/classroom.model.js';
import Department from '../models/department.model.js';
import Subject from '../models/subject.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import AIChat from '../models/aiChat.model.js';
import AINotes from '../models/aiNotes.model.js';
import AIFlashcard from '../models/aiFlashcard.model.js';
import AIQuiz from '../models/aiQuiz.model.js';
import AIStudyPlan from '../models/aiStudyPlan.model.js';
import AILessonPlan from '../models/aiLessonPlan.model.js';
import AIQuestionPaper from '../models/aiQuestionPaper.model.js';
import Recommendation from '../models/recommendation.model.js';
import ActivityTimeline from '../models/activityTimeline.model.js';

import { getRecommendations, getPredictions, getAcademicRisk } from '../services/intelligence.service.js';

async function run() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in env');
        process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected successfully!');
    // Force evaluation by referencing imports
    const _models = [User, Classroom, Department, Subject, Assignment, Submission, AIChat, AINotes, AIFlashcard, AIQuiz, AIStudyPlan, AILessonPlan, AIQuestionPaper, Recommendation, ActivityTimeline];
    console.log('📦 Registered mongoose models:', mongoose.modelNames().join(', '));

    const roles = ['student', 'faculty', 'admin'];

    for (const role of roles) {
        console.log(`\n=========================================`);
        console.log(`🔍 VERIFYING ROLE: ${role.toUpperCase()}`);
        console.log(`=========================================`);

        const user = await User.findOne({ role });
        if (!user) {
            console.warn(`⚠️ No user found with role: ${role}`);
            continue;
        }

        const userId = user._id.toString();
        console.log(`👤 Found user: ${user.email} (${userId})`);

        // 1. Recommendations
        console.log('\n🧠 Calculating recommendations...');
        const recs = await getRecommendations(userId, role);
        console.log(`✓ Generated ${recs.length} recommendations:`);
        recs.forEach((r: any, i: number) => {
            console.log(`  [Rec ${i + 1}] Title: "${r.title}"`);
            console.log(`        Category: ${r.category} | Priority: ${r.priority} | Confidence: ${r.confidence}%`);
            console.log(`        Explanation: "${r.reason}"`);
        });

        // 2. Predictions (Phase 5B.3B)
        console.log('\n📊 Calculating trend predictions (7_DAYS horizon)...');
        const preds = await getPredictions(userId, role, '7_DAYS');
        console.log(`✓ Generated ${preds.length} prediction variables:`);
        preds.forEach((p: any, i: number) => {
            console.log(`  [Pred ${i + 1}] Metric: "${p.metric}" (${p.category})`);
            console.log(`         Current: ${p.currentValue} | Predicted: ${p.predictedValue} | Status: ${p.predictionStatus} | Trend: ${p.trend} | Method: ${p.method} | Horizon: ${p.predictionHorizon}`);
            console.log(`         Historical points: ${JSON.stringify(p.historicalPoints)}`);
        });

        console.log('\n📊 Calculating trend predictions (30_DAYS horizon)...');
        const preds30 = await getPredictions(userId, role, '30_DAYS');
        console.log(`✓ Generated ${preds30.length} prediction variables for 30_DAYS:`);
        preds30.slice(0, 2).forEach((p: any, i: number) => {
            console.log(`  [Pred 30D ${i + 1}] Metric: "${p.metric}" | Current: ${p.currentValue} | Predicted: ${p.predictedValue} | Horizon: ${p.predictionHorizon}`);
        });

        // 3. Academic Risk
        console.log('\n🛡️ Calculating academic risk assessment...');
        const risk = await getAcademicRisk(userId, role);
        console.log(`✓ Risk Level: ${risk.riskLevel} (${risk.riskColor}) | Score: ${risk.score}`);
        console.log(`✓ Risk Analysis Reasons:`);
        risk.reasons.forEach((reason: string, i: number) => {
            console.log(`  - ${reason}`);
        });
        console.log(`✓ Breakdown:`, JSON.stringify(risk.breakdown, null, 2));
    }

    console.log('\n🔌 Closing MongoDB connection...');
    await mongoose.disconnect();
    console.log('✓ Finished verification.');
}

run().catch(err => {
    console.error('❌ Service validation error:', err);
    mongoose.disconnect();
});
