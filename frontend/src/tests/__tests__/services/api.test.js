import axios from 'axios';
import { authService, userService, diagramService } from '../../../../services/api';

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    })),
    defaults: {
      headers: {
        common: {}
      }
    }
  };
});

describe('API Services', () => {
  // Mock for localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: jest.fn(key => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn(key => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      })
    };
  })();
  
  // Replace global localStorage
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
  
  // Get the mock axios instance
  const mockApi = axios.create();
  
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('authService', () => {
    test('register should call api.post with correct parameters', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      mockApi.post.mockResolvedValueOnce({ data: { user: userData } });
      
      await authService.register(userData);
      
      expect(mockApi.post).toHaveBeenCalledWith('/users/register', userData);
    });
    
    test('login should call api.post with correct credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockResponse = { data: { token: 'test-token', user: { name: 'Test User' } } };
      mockApi.post.mockResolvedValueOnce(mockResponse);
      
      const result = await authService.login(credentials);
      
      expect(mockApi.post).toHaveBeenCalledWith('/users/login', credentials);
      expect(result).toEqual(mockResponse);
    });
    
    test('login should handle errors properly', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password'
      };
      
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      };
      
      mockApi.post.mockRejectedValueOnce(errorResponse);
      
      await expect(authService.login(credentials)).rejects.toEqual(errorResponse);
    });
    
    test('getProfile should call api.get with correct endpoint', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { user: { name: 'Test User' } } });
      
      await authService.getProfile();
      
      expect(mockApi.get).toHaveBeenCalledWith('/users/profile');
    });
    
    test('logout should remove token and user from localStorage', () => {
      // Set items first
      localStorageMock.setItem('token', 'test-token');
      localStorageMock.setItem('user', JSON.stringify({ name: 'Test User' }));
      
      authService.logout();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });
  
  describe('userService', () => {
    test('getUserProfile should call api.get with correct endpoint', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { user: { name: 'Test User' } } });
      
      await userService.getUserProfile();
      
      expect(mockApi.get).toHaveBeenCalledWith('/users/profile');
    });
    
    test('updateProfile should call api.put with correct parameters', async () => {
      const userData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };
      
      mockApi.put.mockResolvedValueOnce({ data: { user: userData } });
      
      await userService.updateProfile(userData);
      
      expect(mockApi.put).toHaveBeenCalledWith('/users/profile', userData);
    });
  });
  
  describe('diagramService', () => {
    test('getUserDiagrams should call api.get with correct endpoint', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });
      
      await diagramService.getUserDiagrams();
      
      expect(mockApi.get).toHaveBeenCalledWith('/diagrams');
    });
    
    test('getDiagram should call api.get with correct diagram ID', async () => {
      const diagramId = 'test-diagram-id';
      mockApi.get.mockResolvedValueOnce({ data: { name: 'Test Diagram' } });
      
      await diagramService.getDiagram(diagramId);
      
      expect(mockApi.get).toHaveBeenCalledWith(`/diagrams/${diagramId}`);
    });
    
    test('createDiagram should call api.post with correct parameters', async () => {
      const diagramData = {
        name: 'New Test Diagram',
        cloudProvider: 'AWS'
      };
      
      mockApi.post.mockResolvedValueOnce({ data: { ...diagramData, _id: 'new-diagram-id' } });
      
      await diagramService.createDiagram(diagramData);
      
      expect(mockApi.post).toHaveBeenCalledWith('/diagrams', diagramData);
    });
    
    test('updateDiagram should call api.put with correct parameters', async () => {
      const diagramId = 'test-diagram-id';
      const diagramData = {
        name: 'Updated Test Diagram',
        cloudProvider: 'GCP',
        components: []
      };
      
      mockApi.put.mockResolvedValueOnce({ data: { ...diagramData, _id: diagramId } });
      
      await diagramService.updateDiagram(diagramId, diagramData);
      
      expect(mockApi.put).toHaveBeenCalledWith(`/diagrams/${diagramId}`, diagramData);
    });
    
    test('deleteDiagram should call api.delete with correct diagram ID', async () => {
      const diagramId = 'test-diagram-id';
      mockApi.delete.mockResolvedValueOnce({ data: { message: 'Diagram deleted' } });
      
      await diagramService.deleteDiagram(diagramId);
      
      expect(mockApi.delete).toHaveBeenCalledWith(`/diagrams/${diagramId}`);
    });
    
    test('addComponent should call api.post with correct parameters', async () => {
      const diagramId = 'test-diagram-id';
      const componentData = {
        name: 'Test Component',
        type: 'ec2',
        position: { x: 100, y: 100 }
      };
      
      mockApi.post.mockResolvedValueOnce({ data: { ...componentData, _id: 'new-component-id' } });
      
      await diagramService.addComponent(diagramId, componentData);
      
      expect(mockApi.post).toHaveBeenCalledWith(`/diagrams/${diagramId}/components`, componentData);
    });
    
    test('removeComponent should call api.delete with correct IDs', async () => {
      const diagramId = 'test-diagram-id';
      const componentId = 'test-component-id';
      
      mockApi.delete.mockResolvedValueOnce({ data: { message: 'Component removed' } });
      
      await diagramService.removeComponent(diagramId, componentId);
      
      expect(mockApi.delete).toHaveBeenCalledWith(`/diagrams/${diagramId}/components/${componentId}`);
    });
  });
  
  describe('API Interceptors', () => {
    test('request interceptor should add auth token if available', () => {
      // This is a bit trickier to test directly as the interceptors are set up when the module is imported
      // We can test the behavior instead by mocking the interceptor function calls
      
      const requestInterceptor = mockApi.interceptors.request.use.mock.calls[0][0];
      
      // Test with no token
      let config = { headers: {} };
      config = requestInterceptor(config);
      expect(config.headers.Authorization).toBeUndefined();
      
      // Test with token
      localStorageMock.setItem('token', 'test-token');
      config = { headers: {} };
      config = requestInterceptor(config);
      expect(config.headers.Authorization).toBe('Bearer test-token');
    });
    
    test('response interceptor should handle 401 errors', () => {
      // Get the error handler function from the response interceptor
      const responseErrorHandler = mockApi.interceptors.response.use.mock.calls[0][1];
      
      // Original window.location object
      const originalLocation = window.location;
      
      // Mock window.location
      delete window.location;
      window.location = { href: '' };
      
      // Test 401 response
      const unauthorizedError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      
      // This should clear localStorage and redirect to login
      expect(() => responseErrorHandler(unauthorizedError)).toThrow();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.href).toBe('/login');
      
      // Restore original location
      window.location = originalLocation;
    });
  });
});