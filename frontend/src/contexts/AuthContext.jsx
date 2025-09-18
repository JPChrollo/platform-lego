import React, { createContext, useState, useContext } from 'react';
import { authService } from '../services/api';

  // Create the auth context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [loginError, setLoginError] = useState('');
  const [hasLoginFailed, setHasLoginFailed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('token')));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Function to handle login
  const handleLogin = (userData) => {
    console.log('AuthContext: handleLogin called with user data:', userData);
    // Reset login error state on successful login
    setLoginError('');
    setHasLoginFailed(false);
    // Update logged in state
    setIsLoggedIn(true);
    // Set the user data
    setUser(userData);
  };  // Function to handle login failure
  const handleLoginFailure = (errorMessage) => {
    console.log('AuthContext: handleLoginFailure called with message:', errorMessage);
    setLoginError(errorMessage);
    setHasLoginFailed(true);
  };
  
  // Function to handle new login attempt
  // We no longer reset anything here - error state should persist until successful login
  const handleLoginAttempt = () => {
    console.log('AuthContext: handleLoginAttempt called - errors will be preserved');
    // Don't reset hasLoginFailed or loginError here
    // They should remain until a successful login
  };
  
  // Function to handle logout
  const handleLogout = () => {
    console.log('AuthContext: handleLogout called');
    // Use the auth service to handle token cleanup
    authService.logout();
    // Update our state
    setIsLoggedIn(false);
    setUser(null);
  };
  
  // Create an object with all the values we want to expose
  const authContextValue = {
    loginError,
    hasLoginFailed,
    isLoggedIn,
    user,
    handleLogin,
    handleLoginFailure,
    handleLoginAttempt,
    handleLogout
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};