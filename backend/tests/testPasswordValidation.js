import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Connect to MongoDB
console.log('Connecting to MongoDB...');
await connectDB();

const testPasswordValidation = async () => {
  try {
    console.log('========== PASSWORD VALIDATION TEST ==========');
    
    // Test case 1: Valid password (within constraints)
    console.log('\n1. TESTING VALID PASSWORD');
    try {
      // Delete any existing test users
      await User.deleteOne({ username: 'testuser1' });
      
      const validUser = new User({
        username: 'testuser1',
        email: 'testuser1@example.com',
        password: 'ValidPassword123'
      });
      
      await validUser.save();
      console.log('✅ Successfully created user with valid password');
    } catch (error) {
      console.error('❌ Error creating user with valid password:', error.message);
    }
    
    // Test case 2: Password too short
    console.log('\n2. TESTING PASSWORD TOO SHORT');
    try {
      const shortPasswordUser = new User({
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: 'short'  // Less than 8 characters
      });
      
      await shortPasswordUser.save();
      console.error('❌ Created user with too short password - THIS SHOULD NOT HAPPEN');
    } catch (error) {
      console.log('✅ Correctly rejected too short password:', error.message);
    }
    
    // Test case 3: Password too long
    console.log('\n3. TESTING PASSWORD TOO LONG');
    const tooLongPassword = 'A'.repeat(100);  // 100 characters, exceeds 72 limit
    
    try {
      const longPasswordUser = new User({
        username: 'testuser3',
        email: 'testuser3@example.com',
        password: tooLongPassword
      });
      
      await longPasswordUser.save();
      console.error('❌ Created user with too long password - THIS SHOULD NOT HAPPEN');
    } catch (error) {
      console.log('✅ Correctly rejected too long password:', error.message);
    }
    
    // Test case 4: Password comparison
    console.log('\n4. TESTING PASSWORD COMPARISON');
    try {
      // Retrieve the valid user we created
      const testUser = await User.findOne({ username: 'testuser1' }).select('+password');
      
      if (!testUser) {
        throw new Error('Test user not found');
      }
      
      // Test correct password
      const correctResult = await testUser.comparePassword('ValidPassword123');
      console.log(`Password 'ValidPassword123' comparison result: ${correctResult ? '✅ Match' : '❌ No Match'}`);
      
      // Test incorrect password
      const incorrectResult = await testUser.comparePassword('WrongPassword123');
      console.log(`Password 'WrongPassword123' comparison result: ${incorrectResult ? '❌ Incorrectly Matched' : '✅ Correctly Rejected'}`);
      
    } catch (error) {
      console.error('❌ Error during password comparison test:', error.message);
    }
    
    // Test case 5: Password at exactly 72 characters
    console.log('\n5. TESTING PASSWORD AT MAXIMUM LENGTH (72)');
    try {
      // Delete any existing test users
      await User.deleteOne({ username: 'testuser4' });
      
      const exactLengthPassword = 'A'.repeat(72);
      const maxLengthUser = new User({
        username: 'testuser4',
        email: 'testuser4@example.com',
        password: exactLengthPassword
      });
      
      await maxLengthUser.save();
      console.log('✅ Successfully created user with max length password (72 chars)');
    } catch (error) {
      console.error('❌ Error creating user with max length password:', error.message);
    }

    // Test case 6: Test existing admin user password
    console.log('\n6. TESTING ADMIN USER PASSWORD');
    try {
      // Find the admin user (don't recreate it)
      const adminUser = await User.findOne({ username: 'admin' }).select('+password');
      
      if (adminUser) {
        console.log('Admin user found:');
        console.log('- Username:', adminUser.username);
        console.log('- Email:', adminUser.email);
        console.log('- ID:', adminUser._id);
        console.log('- Password hash (partial):', adminUser.password.substring(0, 20) + '...');
        console.log('- Password hash length:', adminUser.password.length);
        
        // Test direct password comparison with bcrypt
        console.log('\nTesting password with direct bcrypt.compare:');
        const directCompare = await bcrypt.compare('Password123', adminUser.password);
        console.log('- Direct bcrypt.compare result:', directCompare ? '✅ Match' : '❌ No Match');
        
        // Test using the model's comparePassword method
        console.log('\nTesting password with User.comparePassword method:');
        const methodCompare = await adminUser.comparePassword('Password123');
        console.log('- User.comparePassword result:', methodCompare ? '✅ Match' : '❌ No Match');
        
        // Test wrong password
        const wrongPasswordCompare = await bcrypt.compare('WrongPassword123', adminUser.password);
        console.log('- Wrong password test:', wrongPasswordCompare ? '❌ Incorrectly Matched' : '✅ Correctly Rejected');
      } else {
        console.log('❌ Admin user not found in database!');
      }
    } catch (error) {
      console.error('❌ Error testing admin user:', error.message);
    }
    
  } catch (error) {
    console.error('Error in password validation test:', error);
  } finally {
    // Cleanup - remove all test users
    try {
      await User.deleteMany({ 
        username: { $in: ['testuser1', 'testuser2', 'testuser3', 'testuser4'] } 
      });
      console.log('\nCleaned up test users');
    } catch (error) {
      console.error('Error cleaning up test users:', error);
    }
    
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

testPasswordValidation();