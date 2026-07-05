import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log("Attempting connecting to:", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("SUCCESSFULLY CONNECTED");
        process.exit(0);
    })
    .catch(err => {
        console.error("CONNECTION ERROR STACK:", err.stack || err);
        process.exit(1);
    });
