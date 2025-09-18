import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/platform-lego';

const connectDB = async () => {
  try {
    // Set up Mongoose connection options
    const options = {
      // These options help with connection stability
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, options);
    
    console.log('MongoDB connected successfully');
    console.log(`Connection string: ${MONGODB_URI}`);
    
    // Log when database connection is lost
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Exit with failure
  }
};

export default connectDB;
