import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
console.log('========== CHECKING DATABASE USERS ==========');
console.log('Connecting to MongoDB...');
await connectDB();
console.log('Connected to MongoDB');

const displayUsers = async () => {
  try {
    // Get all users using the User model
    const users = await User.find({}).select('+password');
    
    console.log(`\nFound ${users.length} users in database:\n`);
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        console.log(`========== USER ${i + 1} ==========`);
        console.log('ID:', user._id);
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('Created:', user.created_at);
        console.log('Diagrams:', user.diagrams?.length || 0);
        
        if (user.password) {
          console.log('Password hash:', user.password);
          console.log('Password hash length:', user.password.length);
          
          // For admin user, test the password
          if (user.username === 'admin') {
            console.log('\nAdmin user found - Testing password:');
            
            try {
              // Direct bcrypt comparison
              const directCompare = await bcrypt.compare('Password123', user.password);
              console.log('- Testing with bcrypt.compare directly:', directCompare ? '✅ MATCH' : '❌ NO MATCH');
              
              // Using the User model's method
              const modelCompare = await user.comparePassword('Password123');
              console.log('- Testing with user.comparePassword():', modelCompare ? '✅ MATCH' : '❌ NO MATCH');
            } catch (error) {
              console.error('Error testing admin password:', error);
            }
          }
        } else {
          console.log('Password: Not stored or not accessible');
        }
        
        console.log('\n');
      }
    }
    
  } catch (error) {
    console.error('Error displaying users:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

await displayUsers();