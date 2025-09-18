import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Sample users data
const users = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'Password123',
    profile_picture: 'admin.png',
    diagrams: ['diagram1', 'diagram2']
  },
  {
    username: 'johndoe',
    email: 'john.doe@example.com',
    password: 'Password123',
    profile_picture: 'john.png',
    diagrams: ['diagram3']
  },
  {
    username: 'janedoe',
    email: 'jane.doe@example.com',
    password: 'Password123',
    profile_picture: 'jane.png',
    diagrams: []
  }
];

// Seed function
const seedData = async () => {
  try {
    console.log('Connected to MongoDB database');
    
    // Clear existing data
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create new users
    console.log('Creating users:');
    for (const userData of users) {
      console.log(`- Creating user: ${userData.username} (${userData.email})`);
      
      // Create a new user model instance and let the pre-save hook handle password hashing
      const newUser = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password, // Plain password - will be hashed by pre-save hook
        profile_picture: userData.profile_picture,
        diagrams: userData.diagrams
      });
      
      // Save the user - this will trigger the pre-save hook to hash the password
      await newUser.save();
      console.log(`  User created with ID: ${newUser._id}`);
    }
    
    // Verify users were created
    const createdUsers = await User.find({});
    console.log(`\nVerifying created users (${createdUsers.length} found):`);
    
    // Test verification for each user
    for (const userData of users) {
      const user = await User.findOne({ username: userData.username }).select('+password');
      console.log(`- Username: ${user.username}, Email: ${user.email}, ID: ${user._id}`);
      
      // Test password verification
      const isPasswordValid = await user.comparePassword(userData.password);
      console.log(`  Password verification: ${isPasswordValid ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
    console.log('\nData seeded successfully');
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedData();
