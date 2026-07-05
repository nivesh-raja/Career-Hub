import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const fixAdmin = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas.');

    const user = await User.findOne({ email: 'admin@careerhub.edu' });
    if (user) {
      console.log('Current user data:', {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });

      if (user.role !== 'admin' || user.name !== 'System Administrator') {
        user.role = 'admin';
        user.name = 'System Administrator';
        user.status = 'Active';
        user.isActive = true;
        await user.save();
        console.log('✓ Successfully updated user role to "admin" and name to "System Administrator"');
      } else {
        console.log('User role is already "admin" and name is correct.');
      }
    } else {
      console.log('admin@careerhub.edu user not found in database. Seeding new admin.');
      await User.create({
        name: 'System Administrator',
        email: 'admin@careerhub.edu',
        password: 'Admin@123',
        role: 'admin',
        phone: '1234567890',
        isActive: true,
        status: 'Active'
      });
      console.log('✓ Onboarded new admin user successfully.');
    }
  } catch (error) {
    console.error('Error fixing admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

fixAdmin();
