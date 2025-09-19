import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import './Login.css';

function Login() {
  // Local state for authentication - initialize from localStorage if available
  const [loginError, setLoginError] = useState(() => localStorage.getItem('loginError') || '');
  const [hasLoginFailed, setHasLoginFailed] = useState(() => localStorage.getItem('hasLoginFailed') === 'true');
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  
  // Persist error states to localStorage when they change
  useEffect(() => {
    if (loginError) {
      localStorage.setItem('loginError', loginError);
    } else {
      localStorage.removeItem('loginError');
    }
    
    localStorage.setItem('hasLoginFailed', hasLoginFailed.toString());
  }, [loginError, hasLoginFailed]);
  
  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    try {
      // We're starting a new login attempt
      console.log('Starting new login attempt');
      // Don't clear error states immediately, only on successful login
      // setHasLoginFailed(false);
      // setLoginError('');
      setIsLoading(true);
      
      // Call the login service
      const response = await authService.login({
        username: data.username,
        password: data.password
      });
      
      if (response.data.success) {
        // Login successful
        console.log('Login successful, saving token and redirecting...');
        
        // Explicitly clear error messages on success
        setLoginError('');
        setHasLoginFailed(false);
        
        // Store auth data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        // Login failed - update local state
        console.log('Login failed with response:', response.data);
        const errorMessage = response.data.message || 'Login failed. Please check your credentials.';
        console.log('Setting error message:', errorMessage);
        
        // Set both error states with a slight delay to ensure they're processed correctly
        setTimeout(() => {
          setLoginError(errorMessage);
          setHasLoginFailed(true);
        }, 10);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Determine the error message
      let errorMessage;
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      // Update local state with error, using setTimeout to ensure they're processed correctly
      setTimeout(() => {
        setLoginError(errorMessage);
        setHasLoginFailed(true);
        console.log('Error state set in catch block:', { errorMessage });
      }, 10);
    } finally {
      setIsLoading(false);
    }
  };

  // Log current state for debugging
  console.log('Rendering Login component, current state:', {
    loginError,
    hasLoginFailed,
    isLoading
  });
  
  // Add effect to track state changes
  useEffect(() => {
    console.log('Login error state changed:', { loginError, hasLoginFailed });
  }, [loginError, hasLoginFailed]);

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>Login</h2>

        
        {/* Show error message - simplifying condition */}
        {loginError ? (
          <div className="error-message">{loginError}</div>
        ) : null}
        
        <form onSubmit={handleSubmit((data) => {
          // Keep error message visible until explicitly cleared on success
          console.log('Form submitted with current error state:', { loginError, hasLoginFailed });
          onSubmit(data);
        })} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              {...register("username", { 
                required: "Username is required"
                // No onChange handler - error persists until new login attempt
              })}
              className={errors.username ? "error-input" : ""}
            />
            {errors.username && <span className="error-text">{errors.username.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              {...register("password", { 
                required: "Password is required"
                // No onChange handler - error persists until new login attempt
              })}
              className={errors.password ? "error-input" : ""}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <a href="/create-account">Create Account</a></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
