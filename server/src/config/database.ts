import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Department from '../models/department.model.js';
import Classroom from '../models/classroom.model.js';
import Subject from '../models/subject.model.js';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Database connection failed: MONGODB_URI is not defined in environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✓ MongoDB Connected Successfully');

    // Seed database if empty, else sync student classroom refs
    await seedDatabase();
  } catch (error: any) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('MongoDB Atlas already has data. Skipping seed.');
      // Sync student classroom field from classroom.students arrays
      await syncStudentClassrooms();
      return;
    }

    console.log('Seeding initial MongoDB Atlas collections...');

    // 1. Create Departments
    const cseDept = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Department of Computer Science & Engineering',
    });

    const eeDept = await Department.create({
      name: 'Electrical Engineering',
      code: 'EE',
      description: 'Department of Electrical Engineering',
    });

    console.log('Departments seeded successfully.');

    // 2. Create Users (passwords are auto-hashed by pre-save hook)
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@careerhub.edu',
      password: 'Admin@123',
      role: 'admin',
      phone: '1234567890',
      isActive: true,
    });

    const faculty = await User.create({
      name: 'Prof. Alan Turing',
      email: 'faculty@careerhub.edu',
      password: 'Faculty@123',
      role: 'faculty',
      department: cseDept._id,
      phone: '1234567891',
      isActive: true,
    });

    const student = await User.create({
      name: 'John Doe',
      email: 'student@careerhub.edu',
      password: 'Student@123',
      role: 'student',
      department: cseDept._id,
      phone: '1234567892',
      isActive: true,
    });

    console.log('Users seeded successfully.');

    // Set department head
    cseDept.head = faculty._id as mongoose.Types.ObjectId;
    await cseDept.save();

    // 3. Create Subjects
    const dsa = await Subject.create({
      name: 'Data Structures and Algorithms',
      code: 'CS201',
      department: cseDept._id,
      credits: 4,
      description: 'Fundamental study of algorithms and data structures',
    });

    const oop = await Subject.create({
      name: 'Object Oriented Programming',
      code: 'CS202',
      department: cseDept._id,
      credits: 3,
      description: 'Introduction to OOP principles with Java/C++',
    });

    console.log('Subjects seeded successfully.');

    // 4. Create Classroom with correct schema fields
    const classroom = await Classroom.create({
      className: 'CS-Section A',
      department: cseDept._id,
      semester: '3',
      section: 'A',
      faculty: faculty._id,
      students: [student._id],
      subjects: [dsa._id, oop._id],
      capacity: 60,
      academicYear: '2025-2026',
      status: 'Active',
    });

    // 5. Update student with classroom reference
    await User.findByIdAndUpdate(student._id, {
      classroom: classroom._id,
    });

    console.log('Classroom seeded successfully.');
    console.log('Database Seeding Complete.');
  } catch (error: any) {
    console.error(`Error seeding database: ${error.message}`);
  }
};

// Syncs user.classroom field for all students based on classroom.students arrays
const syncStudentClassrooms = async () => {
  try {
    const classrooms = await Classroom.find({});
    for (const classroom of classrooms) {
      if (classroom.students && classroom.students.length > 0) {
        // Only update students who don't already have a classroom field set
        await User.updateMany(
          { _id: { $in: classroom.students }, role: 'student', classroom: { $exists: false } },
          { $set: { classroom: classroom._id } }
        );
      }
    }
    console.log('✓ Student classroom references synced.');
  } catch (error: any) {
    console.error(`Error syncing student classrooms: ${error.message}`);
  }
};
