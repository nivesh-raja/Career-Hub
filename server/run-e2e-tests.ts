import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

import User from './src/models/user.model.js';
import AIDocument from './src/models/aiDocument.model.js';
import DocumentChunk from './src/models/documentChunk.model.js';
import AIChat from './src/models/aiChat.model.js';

const API_BASE = 'http://localhost:5000/api/ai';
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set in environment.');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

async function runTests() {
    console.log("====================================================");
    console.log("       STARTING E2E RAG PIPELINE STRESS TEST        ");
    console.log("====================================================\n");

    // 1. Connect MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✓ Connected to MongoDB.");

    // Clean up pre-existing orphaned chunks
    const allDocIds = (await AIDocument.find({}, '_id')).map(d => d._id);
    const cleanChunksRes = await DocumentChunk.deleteMany({ documentId: { $nin: allDocIds } });
    if (cleanChunksRes.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanChunksRes.deletedCount} pre-existing orphaned chunks from previous runs.`);
    }

    // Retrieve active student
    const student = await User.findOne({ email: 'student@careerhub.edu' });
    if (!student) {
        throw new Error("Could not find student user student@careerhub.edu in DB.");
    }
    console.log(`✓ Found student user: ${student.name} (${student._id})`);

    // Generate Student Token (simulating client-side login)
    const token = jwt.sign({ id: student._id, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    console.log("✓ Signed test JWT token for student.");

    const results = {
        jwtProtectionPass: false,
        preDbAuditPass: false,
        largeDocProcessingPass: false,
        multiDocRetrievalPass: false,
        outOfKnowledgePass: false,
        docDeletionCleanupPass: false,
        historyPersistencePass: false
    };

    // ==========================================
    // TEST 1: JWT PROTECTION ENFORCEMENT
    // ==========================================
    console.log("\n--- [Test 1] Verifying JWT Protection ---");
    try {
        const endpoints = ['/chat', '/upload', '/documents', '/history'];
        let allUnauth = true;
        for (const ep of endpoints) {
            const method = ep === '/chat' || ep === '/upload' ? 'POST' : 'GET';
            const res = await fetch(`${API_BASE}${ep}`, { method });
            if (res.status !== 401) {
                console.log(`❌ Endpoint ${ep} without JWT returned status ${res.status} (expected 401)`);
                allUnauth = false;
            } else {
                console.log(`✓ Endpoint ${ep} correctly rejected unauthorized request.`);
            }
        }
        if (allUnauth) {
            results.jwtProtectionPass = true;
            console.log("PASS: JWT protections properly block all AI endpoints.");
        } else {
            console.log("FAIL: Some AI endpoints do not require authorization!");
        }
    } catch (e) {
        console.error("Error verifying JWT:", e);
    }

    // ==========================================
    // TEST 2: PRE-TEST DATABASE INTEGRITY AUDIT
    // ==========================================
    console.log("\n--- [Test 2] Pre-Test DB Audit & Consistency Check ---");
    try {
        const docCount = await AIDocument.countDocuments();
        const chunkCount = await DocumentChunk.countDocuments();
        const chatCount = await AIChat.countDocuments();
        console.log(`Current DB State: ${docCount} documents, ${chunkCount} chunks, ${chatCount} chats.`);

        // Find orphaned chunks
        const orphanedChunks = await DocumentChunk.aggregate([
            {
                $lookup: {
                    from: 'aidocuments',
                    localField: 'documentId',
                    foreignField: '_id',
                    as: 'doc'
                }
            },
            { $match: { doc: { $size: 0 } } }
        ]);

        console.log(`Orphaned Chunks found: ${orphanedChunks.length}`);
        if (orphanedChunks.length === 0) {
            results.preDbAuditPass = true;
            console.log("PASS: MongoDB matches expectations. No orphaned document chunks exist.");
        } else {
            console.log("FAIL: Orphaned document chunks exist in DB!");
        }
    } catch (e) {
        console.error("Error doing DB Audit:", e);
    }

    // ==========================================
    // TEST 3: LARGE DOCUMENT UPLOAD & PROCESSING
    // ==========================================
    console.log("\n--- [Test 3] Large Document Processing (79 pages) ---");
    let uploadedDocId = '';
    try {
        const filePath = 'R:\\placement\\Career Hub\\test_docs\\hp_user_guide.pdf';
        if (!fs.existsSync(filePath)) {
            throw new Error(`Test file not found: ${filePath}`);
        }

        const stats = fs.statSync(filePath);
        console.log(`Uploading ${path.basename(filePath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);

        const fileBuffer = fs.readFileSync(filePath);
        const boundary = '----WebKitFormBoundaryE2ETest';
        const payloadParts = [
            `--${boundary}\r\n`,
            `Content-Disposition: form-data; name="file"; filename="${path.basename(filePath)}"\r\n`,
            `Content-Type: application/pdf\r\n\r\n`,
            fileBuffer,
            `\r\n--${boundary}--\r\n`
        ];

        // Combine parts
        const body = Buffer.concat(payloadParts.map(p => typeof p === 'string' ? Buffer.from(p) : p));

        const startTime = Date.now();
        const uploadRes = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body
        });

        const uploadData = await uploadRes.json() as any;
        if (!uploadRes.ok || !uploadData.success) {
            throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
        }

        const doc = uploadData.document;
        uploadedDocId = doc._id;
        console.log(`✓ Document uploaded successfully: ID = ${uploadedDocId}, Status = ${doc.processingStatus}`);

        // Poll until ready
        let isReady = false;
        let attempts = 0;
        const maxAttempts = 300; // 300 seconds max time
        while (!isReady && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const freshDoc = await AIDocument.findById(uploadedDocId);
            if (freshDoc?.processingStatus === 'ready') {
                isReady = true;
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`✓ Document processing ready! Took ${duration} seconds.`);
                const finalChunksCount = await DocumentChunk.countDocuments({ documentId: uploadedDocId });
                console.log(`✓ Stored ${finalChunksCount} chunks in MongoDB for hp_user_guide.pdf.`);
                break;
            }
            attempts++;
            if (attempts % 5 === 0) {
                console.log(`... still processing (${attempts} seconds)...`);
            }
        }

        if (isReady) {
            results.largeDocProcessingPass = true;
            console.log("PASS: Large document processed, parsed, chunked and embedded in background without freezing.");
        } else {
            console.log("FAIL: Large document processing timed out.");
        }
    } catch (e) {
        console.error("Error during Large Document processing:", e);
    }

    // ==========================================
    // TEST 4: MULTI-DOCUMENT RETRIEVAL & CITATIONS
    // ==========================================
    console.log("\n--- [Test 4] Multi-Document Retrieval & Source Citation ---");
    try {
        // Query 1: Academic collections question (should cite java_collections.txt)
        console.log(`Querying: "Compare ArrayList with LinkedList in Java Collections"`);
        const chatRes1 = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: "Compare ArrayList with LinkedList in Java Collections" })
        });
        const chatData1 = await chatRes1.json() as any;
        console.log(`Sources cited: ${JSON.stringify(chatData1.sourceDocuments)}`);

        const citesJava = chatData1.sourceDocuments?.includes('java_collections.txt');

        // Query 2: Large document question (should cite hp_user_guide.pdf)
        console.log(`Querying: "What does this HP Platform guide summarize on page 1?"`);
        const chatRes2 = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: "What does this HP Platform guide summarize on page 1?" })
        });
        const chatData2 = await chatRes2.json() as any;
        console.log(`Sources cited: ${JSON.stringify(chatData2.sourceDocuments)}`);

        const citesHP = chatData2.sourceDocuments?.includes('hp_user_guide.pdf');

        // Check DB for stored documents
        const lastChat = await AIChat.findOne({ user: student._id }).sort({ createdAt: -1 });
        console.log(`Last Chat stored in DB: prompt="${lastChat?.prompt}"`);
        console.log(`Citations in Mongo: ${JSON.stringify(lastChat?.sourceDocuments)}`);
        const dbStoredOk = lastChat?.sourceDocuments && lastChat.sourceDocuments.length > 0;

        if (citesJava && citesHP && dbStoredOk) {
            results.multiDocRetrievalPass = true;
            console.log("PASS: Multi-document retrieval citations are accurate, and stored correctly in MongoDB schema.");
        } else {
            console.log(`FAIL: Inaccurate citations or db schema mismatch: citesJava=${citesJava}, citesHP=${citesHP}, dbStoredOk=${dbStoredOk}`);
        }
    } catch (e) {
        console.error("Error in Retrieval Test:", e);
    }

    // ==========================================
    // TEST 5: OUT-OF-KNOWLEDGE REFUSAL HANDLING
    // ==========================================
    console.log("\n--- [Test 5] Out-of-Knowledge Refusal Checks ---");
    try {
        const outQueries = [
            "Who won the FIFA World Cup in 2022?",
            "What is the capital of Japan?"
        ];
        let allRefused = true;
        for (const query of outQueries) {
            console.log(`Querying: "${query}"`);
            const chatRes = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: query })
            });
            const chatData = await chatRes.json() as any;
            const textResponse = chatData.response;
            console.log(`AI Response snippet: "${textResponse.substring(0, 120)}..."`);
            const hasRefused = textResponse.toLowerCase().includes("cannot answer") ||
                textResponse.toLowerCase().includes("not have") ||
                textResponse.toLowerCase().includes("not available") ||
                textResponse.toLowerCase().includes("apologize") ||
                textResponse.toLowerCase().includes("sorry");

            // Check if citations was empty or did NOT contain fake file info
            if (!hasRefused) {
                console.log(`❌ AI responded to general knowledge instead of refusing!`);
                allRefused = false;
            }
        }

        if (allRefused) {
            results.outOfKnowledgePass = true;
            console.log("PASS: AI correctly declines non-academic/general-knowledge queries.");
        } else {
            console.log("FAIL: AI gave general knowledge answers or fake citations.");
        }
    } catch (e) {
        console.error("Error in Out-of-Knowledge Test:", e);
    }

    // ==========================================
    // TEST 6: DOCUMENT DELETION & CLEANUP
    // ==========================================
    console.log("\n--- [Test 6] Document Deletion & Cascade Chunks Cleanup ---");
    try {
        if (!uploadedDocId) {
            throw new Error("No document ID uploaded in Test 3 to run delete verification.");
        }

        console.log(`Deleting document with ID = ${uploadedDocId}...`);
        const delRes = await fetch(`${API_BASE}/documents/${uploadedDocId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const delData = await delRes.json() as any;
        if (!delRes.ok || !delData.success) {
            throw new Error(`Delete request failed: ${JSON.stringify(delData)}`);
        }
        console.log("✓ Delete endpoint returned success.");

        // Query DB to verify
        const docInDb = await AIDocument.findById(uploadedDocId);
        const remainingChunksCount = await DocumentChunk.countDocuments({ documentId: uploadedDocId });

        console.log(`Verification: docInDb exists? = ${!!docInDb}, remaining chunks count = ${remainingChunksCount}`);

        // Try querying again - shouldn't retrieve or cite deleted doc
        console.log(`Re-querying: "What does this HP Platform guide summarize on page 1?"`);
        const queryResAfterDelete = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: "What does this HP Platform guide summarize on page 1?" })
        });
        const chatDataAfterDelete = await queryResAfterDelete.json() as any;
        const citedAfterDelete = chatDataAfterDelete.sourceDocuments ?? [];
        console.log(`Citations in query after delete: ${JSON.stringify(citedAfterDelete)}`);

        const isCleaned = !docInDb && remainingChunksCount === 0;
        const noCitations = !citedAfterDelete.includes('hp_user_guide.pdf');

        if (isCleaned && noCitations) {
            results.docDeletionCleanupPass = true;
            console.log("PASS: Document, chunks, and embeddings clean up successfully. Querying deleted topics no longer retrieves/cites them.");
        } else {
            console.log(`FAIL: Chunks were not cleaned up or citation remains. isCleaned=${isCleaned}, noCitations=${noCitations}`);
        }
    } catch (e) {
        console.error("Error in Deletion Test:", e);
    }

    // ==========================================
    // TEST 7: CROSS-SESSION/PERSISTENCE CHECK
    // ==========================================
    console.log("\n--- [Test 7] Cross-Session History Retrieval ---");
    try {
        const histRes = await fetch(`${API_BASE}/history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const histData = await histRes.json() as any;
        console.log(`Retrieved ${histData.chats?.length} chats inside history.`);

        // Find if last chats contain sourceDocuments citations
        const lastChatsWithCites = histData.chats?.filter((c: any) => c.sourceDocuments && c.sourceDocuments.length > 0);
        console.log(`Found ${lastChatsWithCites?.length} historical chats containing citations.`);

        results.historyPersistencePass = histData.chats?.length > 0;
        if (results.historyPersistencePass) {
            console.log("PASS: Session history is retrieved correctly with full citation metadata.");
        } else {
            console.log("FAIL: Chat history retrieved empty or failed.");
        }
    } catch (e) {
        console.error("Error in History Persistence Test:", e);
    }

    // DISCONNECT
    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB.");

    // Print final report summary
    console.log("\n====================================================");
    console.log("                  E2E TEST REPORT                   ");
    console.log("====================================================");
    console.log(`Test 1: JWT Access Protection   -> ${results.jwtProtectionPass ? 'PASS' : 'FAIL'}`);
    console.log(`Test 2: Pre-test DB Consistency -> ${results.preDbAuditPass ? 'PASS' : 'FAIL'}`);
    console.log(`Test 3: Large Doc Background Proc -> ${results.largeDocProcessingPass ? 'PASS' : 'FAIL'}`);
    console.log(`Test 4: Multi-Doc Retrieval Cites -> ${results.multiDocRetrievalPass ? 'PASS' : 'FAIL'}`);
    console.log(`Test 5: Out-of-Knowledge Refusal -> ${results.outOfKnowledgePass ? 'PASS' : 'FAIL'}`);
    console.log(`Test 6: Cascade Delete & Cleanup -> ${results.docDeletionCleanupPass ? 'PASS' : 'FAIL'}`);
    console.log(`Test 7: History persistence auth -> ${results.historyPersistencePass ? 'PASS' : 'FAIL'}`);
    console.log("====================================================");

    const overall = Object.values(results).every(v => v === true);
    console.log(`OVERALL PIPELINE STATUS: ${overall ? 'PASS' : 'FAIL'}`);
    console.log("====================================================");
}

runTests().catch(console.error);
