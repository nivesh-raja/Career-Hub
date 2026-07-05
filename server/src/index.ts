import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/database.js';

// Load Environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect database (includes data seeding if empty)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
