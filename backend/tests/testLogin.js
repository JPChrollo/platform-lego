import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Test function for user login
const testLogin = async () => {
  try {
    const username = 'admin';
    const password = 'Password123';
    
    console.log(`Testing login for ${username} with password ${password}`);
    
    // Find user
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      console.log(`User not found: ${username}`);
      // Let's create a test user
      console.log('Creating test user...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newUser = await User.create({
        username,
        password: hashedPassword,
        email: 'admin@example.com'
      });
      
      console.log(`Test user created with ID: ${newUser._id}`);
    } else {
      console.log(`User found: ${user.username}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`Password valid: ${isPasswordValid}`);
      
      // If password is not valid, let's update it
      if (!isPasswordValid) {
        console.log('Updating password...');
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        console.log('Password updated successfully');
        
        // Verify the new password
        const updatedUser = await User.findOne({ username }).select('+password');
        const isNewPasswordValid = await bcrypt.compare(password, updatedUser.password);
        console.log(`New password valid: ${isNewPasswordValid}`);
      }
    }
    
    // List all users in the database
    const users = await User.find({});
    console.log(`\nUsers in database (${users.length}):`);
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Email: ${u.email}`);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error testing login:', error);
    mongoose.disconnect();
  }
};

// Run the function
testLogin();
