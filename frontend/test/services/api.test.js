import axios from 'axios';
import api from '../../src/services/api';

// Mock axios
jest.mock('axios');

describe('API Service', () => {
  const mockToken = 'fake-jwt-token';
  const mockUser = { _id: 'user123', name: 'Test User', email: 'test@example.com' };
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(key => {
          if (key === 'token') return mockToken;
          if (key === 'user') return JSON.stringify(mockUser);
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
    
    // Mock successful responses by default
    axios.mockResolvedValue({ data: {} });
  });
  
  describe('Authentication', () => {
    test('login sends correct request and stores token', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const responseData = { token: 'new-token', user: mockUser };
      
      axios.mockResolvedValueOnce({ data: responseData });
      
      await api.login(credentials);
      
      // Check if axios was called with correct params
      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: `${baseURL}/auth/login`,
        data: credentials
      });
      
      // Check if token and user were stored
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', responseData.token);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(responseData.user));
    });
    
    test('register sends correct request', async () => {
      const userData = { name: 'New User', email: 'new@example.com', password: 'password123' };
      
      await api.register(userData);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: `${baseURL}/auth/register`,
        data: userData
      });
    });
    
    test('logout removes token and user from localStorage', () => {
      api.logout();
      
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
    });
    
    test('isAuthenticated returns true when token exists', () => {
      expect(api.isAuthenticated()).toBe(true);
    });
    
    test('isAuthenticated returns false when token does not exist', () => {
      window.localStorage.getItem.mockImplementation(() => null);
      
      expect(api.isAuthenticated()).toBe(false);
    });
  });
  
  describe('Diagrams', () => {
    test('getDiagrams sends authenticated request', async () => {
      await api.getDiagrams();
      
      expect(axios).toHaveBeenCalledWith({
        method: 'get',
        url: `${baseURL}/diagrams`,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
    
    test('getDiagram sends authenticated request with correct ID', async () => {
      const diagramId = 'diagram123';
      
      await api.getDiagram(diagramId);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'get',
        url: `${baseURL}/diagrams/${diagramId}`,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
    
    test('createDiagram sends authenticated request with diagram data', async () => {
      const diagramData = { name: 'New Diagram', base: 'AWS' };
      
      await api.createDiagram(diagramData);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: `${baseURL}/diagrams`,
        data: diagramData,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
    
    test('updateDiagram sends authenticated request with diagram data', async () => {
      const diagramId = 'diagram123';
      const diagramData = { 
        name: 'Updated Diagram',
        cloud_components: [
          { component_type: 'ec2', position_x: 100, position_y: 100 }
        ]
      };
      
      await api.updateDiagram(diagramId, diagramData);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'put',
        url: `${baseURL}/diagrams/${diagramId}`,
        data: diagramData,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
    
    test('deleteDiagram sends authenticated request with correct ID', async () => {
      const diagramId = 'diagram123';
      
      await api.deleteDiagram(diagramId);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'delete',
        url: `${baseURL}/diagrams/${diagramId}`,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
    
    test('autosaveDiagram sends authenticated request with diagram data', async () => {
      const diagramId = 'diagram123';
      const diagramData = { 
        name: 'Autosaved Diagram',
        cloud_components: [
          { component_type: 's3', position_x: 200, position_y: 200 }
        ]
      };
      
      await api.autosaveDiagram(diagramId, diagramData);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'put',
        url: `${baseURL}/diagrams/${diagramId}/autosave`,
        data: diagramData,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
  });
  
  describe('Component Templates', () => {
    test('getComponentTemplates sends authenticated request', async () => {
      const cloudProvider = 'AWS';
      
      await api.getComponentTemplates(cloudProvider);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'get',
        url: `${baseURL}/component-templates?provider=${cloudProvider}`,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
  });
  
  describe('Terraform Code Generation', () => {
    test('generateTerraformCode sends authenticated request with correct ID', async () => {
      const diagramId = 'diagram123';
      
      await api.generateTerraformCode(diagramId);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'get',
        url: `${baseURL}/diagrams/${diagramId}/terraform`,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
  });
  
  describe('Versions', () => {
    test('createVersion sends authenticated request with version data', async () => {
      const diagramId = 'diagram123';
      const versionData = { description: 'Initial version' };
      
      await api.createVersion(diagramId, versionData);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: `${baseURL}/diagrams/${diagramId}/versions`,
        data: versionData,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
    
    test('getVersions sends authenticated request with correct ID', async () => {
      const diagramId = 'diagram123';
      
      await api.getVersions(diagramId);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'get',
        url: `${baseURL}/diagrams/${diagramId}/versions`,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
    
    test('getVersion sends authenticated request with correct IDs', async () => {
      const diagramId = 'diagram123';
      const versionId = 'version456';
      
      await api.getVersion(diagramId, versionId);
      
      expect(axios).toHaveBeenCalledWith({
        method: 'get',
        url: `${baseURL}/diagrams/${diagramId}/versions/${versionId}`,
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
    });
  });
  
  describe('Error Handling', () => {
    test('handles login error correctly', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong-password' };
      const errorResponse = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401
        }
      };
      
      axios.mockRejectedValueOnce(errorResponse);
      
      await expect(api.login(credentials)).rejects.toEqual(errorResponse);
    });
    
    test('handles network errors correctly', async () => {
      const networkError = new Error('Network Error');
      
      axios.mockRejectedValueOnce(networkError);
      
      await expect(api.getDiagrams()).rejects.toEqual(networkError);
    });
    
    test('handles unauthorized errors correctly', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: { message: 'Token expired' }
        }
      };
      
      axios.mockRejectedValueOnce(unauthorizedError);
      
      // Should call logout when 401 error occurs
      await expect(api.getDiagrams()).rejects.toEqual(unauthorizedError);
      
      // Check if logout was called
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });
});