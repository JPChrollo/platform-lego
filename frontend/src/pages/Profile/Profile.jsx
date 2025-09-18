import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { userService } from '../../services/api';
import './Profile.css';

function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ text: '', type: '' });
  const [userData, setUserData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const navigate = useNavigate();

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await userService.getUserProfile();
        if (response.data.success) {
          setUserData(response.data.user);
          // Pre-populate the form with user data
          reset(response.data.user);
        } else {
          // If request was successful but didn't return user data
          console.error('Failed to retrieve user data');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // If token is invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      setUpdateMessage({ text: '', type: '' });

      const response = await userService.updateProfile(data);
      if (response.data.success) {
        // Update localStorage with the new user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Show success message
        setUpdateMessage({
          text: 'Profile updated successfully!',
          type: 'success'
        });
        
        // Update the userData state
        setUserData(response.data.user);
      } else {
        setUpdateMessage({
          text: response.data.message || 'Failed to update profile',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateMessage({
        text: error.response?.data?.message || 'An error occurred while updating your profile',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    // Reset the form to the original data
    reset(userData);
    setUpdateMessage({ text: '', type: '' });
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Loading profile data...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>Edit Profile</h2>
      
      {updateMessage.text && (
        <div className={`message ${updateMessage.type}`}>
          {updateMessage.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            {...register("username", { 
              required: "Username is required",
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters"
              }
            })}
            className={errors.username ? "error-input" : ""}
          />
          {errors.username && <span className="error-text">{errors.username.message}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            {...register("email", { 
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })}
            className={errors.email ? "error-input" : ""}
          />
          {errors.email && <span className="error-text">{errors.email.message}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            {...register("firstName")}
            className={errors.firstName ? "error-input" : ""}
          />
          {errors.firstName && <span className="error-text">{errors.firstName.message}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            {...register("lastName")}
            className={errors.lastName ? "error-input" : ""}
          />
          {errors.lastName && <span className="error-text">{errors.lastName.message}</span>}
        </div>
        
        <div className="form-group">
          <label>Change Password</label>
          <p className="password-note">Leave blank if you don't want to change your password</p>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="New password"
              {...register("password", { 
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters"
                }
              })}
              className={errors.password ? "error-input" : ""}
            />
            <button 
              type="button"
              className="password-toggle-button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <span className="error-text">{errors.password.message}</span>}
        </div>
        
        <div className="button-group">
          <button 
            type="button" 
            onClick={handleCancel}
            className="cancel-button"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-button" 
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Profile;