import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  
  console.log('Auth middleware running...');
  
  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in Authorization header');
      
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-default-secret-key'
      );
      console.log('Token verified successfully for user ID:', decoded.id);
      
      // Get user from token and ensure we have the diagrams field
      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('diagrams');
      
      if (!req.user) {
        console.error(`User with ID ${decoded.id} not found in database`);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      console.log(`User ${req.user._id} (${req.user.email}) authenticated successfully`);
      
      // Initialize diagrams array if it doesn't exist
      if (!req.user.diagrams) {
        console.log('User found but diagrams array is undefined - initializing empty array');
        req.user.diagrams = [];
        await req.user.save();
        console.log('User saved with initialized diagrams array');
      } else {
        console.log(`User has ${req.user.diagrams.length} diagrams`);
      }
      
      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      
      // Provide more specific error messages
      let errorMessage = 'Not authorized, token failed';
      
      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired, please login again';
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token, please login again';
      }
      
      res.status(401).json({
        success: false,
        message: errorMessage
      });
    }
  } else {
    console.error('No authorization token found in request headers');
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};
