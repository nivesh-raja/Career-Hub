import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment. Please check your .env file.');
    process.exit(1);
}

mongoose.connect(uri).then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}).catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
});
