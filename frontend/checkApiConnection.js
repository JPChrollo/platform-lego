import axios from 'axios';

// Function to test API health endpoint
async function testApiConnection() {
  console.log('Testing API connection to http://localhost:5002/api/health');
  
  try {
    const response = await axios.get('http://localhost:5002/api/health');
    console.log('✅ API Connection Successful!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ API Connection Failed!');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Make sure the server is running on port 5002.');
    } else if (error.response) {
      console.error('Server responded with error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    return false;
  }
}

// Function to test login endpoint
async function testLoginEndpoint() {
  console.log('\nTesting login endpoint with test credentials');
  
  try {
    const response = await axios.post('http://localhost:5002/api/users/login', {
      username: 'testuser',
      password: 'testpassword'
    });
    
    console.log('✅ Login API Call Successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Login API Call Failed!');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Make sure the server is running on port 5002.');
    } else if (error.response) {
      console.log('Server responded with status:', error.response.status);
      console.log('Error message:', error.response.data.message || 'No error message provided');
      
      // This is expected if the test user doesn't exist
      if (error.response.status === 401) {
        console.log('👍 This is normal if the test user does not exist.');
        console.log('The login endpoint is working as expected!');
      }
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Main function
async function main() {
  console.log('=== API Connection Test ===');
  const healthCheckPassed = await testApiConnection();
  
  if (healthCheckPassed) {
    await testLoginEndpoint();
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the tests
main();