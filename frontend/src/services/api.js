import axios from 'axios';

// API base URL - use the environment variable if available, otherwise default to localhost:5002
const API_URL = 'http://localhost:5002/api';

// Log the API URL being used
console.log('API Service initialized with URL:', API_URL);

// Create an axios instance with increased timeout
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
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
    try {
      console.log('Attempting login with credentials:', {
        username: credentials.username,
        passwordLength: credentials.password ? credentials.password.length : 0
      });
      
      // Try direct axios call if the api instance is having issues
      const response = await api.post('/users/login', credentials);
      console.log('Login API response:', response.data);
      return response;
    } catch (error) {
      console.error('Login API error:', error);
      
      // Enhanced error handling
      if (!error.response) {
        console.error('Network error - no response received');
        throw new Error('Network error. Please check if the server is running and accessible.');
      }
      
      throw error;
    }
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

// Diagram services
export const diagramService = {
  // Get all diagrams for current user
  getUserDiagrams: async () => {
    return api.get('/diagrams');
  },
  
  // Get diagram by ID
  getDiagram: async (diagramId) => {
    return api.get(`/diagrams/${diagramId}`);
  },
  
  // Create new diagram
  createDiagram: async (diagramData) => {
    return api.post('/diagrams', diagramData);
  },
  
  // Update diagram
  updateDiagram: async (diagramId, diagramData) => {
    console.log('Updating diagram with ID:', diagramId);
    console.log('Diagram update data:', diagramData);
    return api.put(`/diagrams/${diagramId}`, diagramData);
  },
  
  // Delete diagram
  deleteDiagram: async (diagramId) => {
    return api.delete(`/diagrams/${diagramId}`);
  },
  
  // Add component to diagram
  addComponent: async (diagramId, componentData) => {
    return api.post(`/diagrams/${diagramId}/components`, componentData);
  },
  
  // Remove component from diagram
  removeComponent: async (diagramId, componentId) => {
    return api.delete(`/diagrams/${diagramId}/components/${componentId}`);
  }
};

export default api;
