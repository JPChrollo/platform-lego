// checkUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
console.log('Connecting to MongoDB...');
await connectDB();

// Check users directly with a raw MongoDB query
const checkUsers = async () => {
  try {
    // Get a reference to the raw MongoDB collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find all documents in the users collection
    const users = await usersCollection.find({}).toArray();

    console.log(`\nFound ${users.length} users:`);

    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      for (const [index, user] of users.entries()) {
        console.log(`\n========== USER ${index + 1} ==========`);
        console.log(`- _id: ${user._id}`);
        console.log(`- username: ${user.username}`);
        console.log(`- email: ${user.email}`);
        console.log(`- created_at: ${user.created_at}`);
        console.log(`- diagrams: ${user.diagrams ? user.diagrams.length : 0} items`);
        
        // Password information
        if (user.password) {
          console.log(`- password hash: ${user.password}`);
          console.log(`- password hash length: ${user.password.length} chars`);
          
          // If this is the admin user, do additional verification
          if (user.username === 'admin') {
            console.log('\n🔍 ADMIN USER VERIFICATION:');
            
            // Test direct password verification with bcrypt
            try {
              const testPassword = 'Password123';
              const isValid = await bcrypt.compare(testPassword, user.password);
              console.log(`- Testing 'Password123' with bcrypt.compare: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
              
              // Using the User model
              const adminModel = await User.findOne({ username: 'admin' }).select('+password');
              if (adminModel) {
                const modelTest = await adminModel.comparePassword(testPassword);
                console.log(`- Testing 'Password123' with User.comparePassword: ${modelTest ? '✅ VALID' : '❌ INVALID'}`);
              } else {
                console.log('- Could not load admin user with model');
              }
            } catch (err) {
              console.error('- Error testing admin password:', err.message);
            }
          }
        } else {
          console.log('- No password hash stored');
        }
      }
    }

    console.log('\nCheck complete.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error checking users:', error);
    mongoose.connection.close();
  }
};

// Run the function
checkUsers();
