import axios from 'axios';

// API base URL
const API_URL = 'http://localhost:5002/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If 401 Unauthorized response, clear token and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  // Register a new user
  register: async (userData) => {
    return api.post('/users/register', userData);
  },
  
  // Login user
  login: async (credentials) => {
    return api.post('/users/login', credentials);
  },
  
  // Get current user profile
  getProfile: async () => {
    return api.get('/users/profile');
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// User services
export const userService = {
  // Get current user profile
  getUserProfile: async () => {
    return api.get('/users/profile');
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    return api.put('/users/profile', userData);
  }
};

export default api;
