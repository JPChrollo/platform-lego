import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [72, 'Password cannot exceed 72 characters'], // bcrypt has a 72 byte limit
    select: false // Don't include password in query results by default
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(value) {
        // Check if email contains @ and ends with .com or .co.uk
        return validator.isEmail(value) && 
               (value.endsWith('.com') || value.endsWith('.co.uk'));
      },
      message: 'Please provide a valid email ending with .com or .co.uk'
    }
  },
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  profile_picture: {
    type: String,
    default: 'default-profile.png' // Default profile picture
  },
  diagrams: [{
    type: String, // IDs or references to diagrams
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing passwords:');
    console.log('- Candidate password:', candidatePassword);
    console.log('- Stored password hash (partial):', this.password.substring(0, 20) + '...');
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('- Password match result:', isMatch);
    
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User;
