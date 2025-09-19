// Simple script to test API connectivity
import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

// Test the health endpoint
const testHealth = async () => {
  try {
    console.log('Testing API health endpoint...');
    const response = await axios.get(`${API_URL}/health`);
    console.log('Health check successful:', response.data);
    return true;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
};

// Test the users endpoint
const testUsersEndpoint = async () => {
  try {
    console.log('Testing users endpoint...');
    const response = await axios.post(`${API_URL}/users/login`, {
      username: 'test',
      password: 'test123'
    });
    console.log('Login response:', response.data);
  } catch (error) {
    console.error('Login test failed:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request error:', error.message);
    }
  }
};

// Run tests
const runTests = async () => {
  const healthCheck = await testHealth();
  
  if (healthCheck) {
    await testUsersEndpoint();
  } else {
    console.log('Skipping login test because health check failed');
  }
};

runTests();