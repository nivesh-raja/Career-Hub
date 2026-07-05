import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import AIDocument from './src/models/aiDocument.model.js';
import DocumentChunk from './src/models/documentChunk.model.js';
import AIChat from './src/models/aiChat.model.js';

const verify = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("=== DB AUDIT FOR stress testing ===");

    const docs = await AIDocument.find().lean();
    console.log(`\nDocuments Count: ${docs.length}`);
    docs.forEach(d => {
        console.log(` - ID: ${d._id}, Filename: ${d.filename}, Status: ${d.processingStatus}, Chunks: ${d.totalChunks}`);
    });

    const chunksCount = await DocumentChunk.countDocuments();
    console.log(`\nTotal Chunks: ${chunksCount}`);

    const orphanedChunks = await DocumentChunk.aggregate([
        {
            $lookup: {
                from: 'aidocuments', // Mongoose model name AIDocument normally maps to collection aidocuments
                localField: 'documentId',
                foreignField: '_id',
                as: 'doc'
            }
        },
        { $match: { doc: { $size: 0 } } }
    ]);
    console.log(`Orphaned Chunks (no matching document): ${orphanedChunks.length}`);

    const chats = await AIChat.find().sort({ createdAt: 1 }).lean();
    console.log(`\nChats Count: ${chats.length}`);
    chats.forEach((c, idx) => {
        console.log(`\n[Chat ${idx + 1}] Prompt: "${c.prompt}"`);
        console.log(`Response Snippet: "${c.response.substring(0, 150)}..."`);
        console.log(`Sources: ${JSON.stringify(c.sourceDocuments)}`);
    });

    await mongoose.disconnect();
};

verify().catch(console.error);
