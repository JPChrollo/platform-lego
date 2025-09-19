import axios from 'axios';

// Test function to create a diagram
const testDiagramCreation = async () => {
  const token = localStorage.getItem('token') || 'YOUR_TEST_TOKEN_HERE';
  
  try {
    console.log('Testing diagram creation API...');
    
    // Make the API call to create a diagram
    const response = await axios.post(
      'http://localhost:5002/api/diagrams',
      {
        name: 'Test Diagram',
        cloudProvider: 'AWS'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Diagram creation successful!');
    console.log('Response:', response.data);
    
    // Return the created diagram
    return response.data;
  } catch (error) {
    console.error('Diagram creation failed:');
    
    if (error.response) {
      console.error('Server responded with error status:', error.response.status);
      console.error('Error data:', error.response.data);
      
      // Log the full request for debugging
      console.log('Request that caused the error:', {
        url: error.config.url,
        method: error.config.method,
        data: error.config.data,
        headers: error.config.headers
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    return null;
  }
};

// Run the test
testDiagramCreation();