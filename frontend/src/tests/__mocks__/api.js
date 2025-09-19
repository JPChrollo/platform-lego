// Mock API service
import { jest } from '@jest/globals';

// Authentication services
export const authService = {
  register: jest.fn(() => Promise.resolve({
    data: { 
      success: true,
      message: 'User registered successfully'
    }
  })),
  
  login: jest.fn(() => Promise.resolve({
    data: {
      token: 'fake-jwt-token',
      user: {
        _id: 'user123',
        name: 'Test User',
        email: 'testuser@example.com'
      }
    }
  })),
  
  getProfile: jest.fn(() => Promise.resolve({
    data: {
      _id: 'user123',
      name: 'Test User',
      email: 'testuser@example.com'
    }
  })),
  
  logout: jest.fn()
};

// User services
export const userService = {
  getUserProfile: jest.fn(() => Promise.resolve({
    data: {
      _id: 'user123',
      name: 'Test User',
      email: 'testuser@example.com'
    }
  })),
  
  updateProfile: jest.fn(() => Promise.resolve({
    data: {
      _id: 'user123',
      name: 'Updated User',
      email: 'testuser@example.com',
      updated: true
    }
  }))
};

// Diagram services
export const diagramService = {
  getUserDiagrams: jest.fn(() => Promise.resolve({
    data: [
      {
        _id: 'test-diagram-id',
        name: 'Test Diagram',
        base: 'AWS',
        created_at: '2023-01-01T00:00:00.000Z'
      },
      {
        _id: 'another-diagram-id',
        name: 'Another Diagram',
        base: 'Azure',
        created_at: '2023-01-02T00:00:00.000Z'
      }
    ]
  })),
  
  getDiagram: jest.fn(() => Promise.resolve({
    data: {
      _id: 'test-diagram-id',
      name: 'Test Diagram',
      base: 'AWS',
      cloud_components: [
        {
          _id: 'test-component-id',
          component_type: 'ec2',
          name: 'Test EC2',
          position_x: 100,
          position_y: 150,
          configuration: {
            Name: 'test-instance',
            'Instance Type': 't2.micro'
          }
        }
      ]
    }
  })),
  
  createDiagram: jest.fn(() => Promise.resolve({
    data: {
      _id: 'new-diagram-id',
      name: 'New Diagram',
      base: 'AWS',
      created_at: '2023-01-03T00:00:00.000Z',
      cloud_components: []
    }
  })),
  
  updateDiagram: jest.fn(() => Promise.resolve({
    data: {
      _id: 'test-diagram-id',
      name: 'Test Diagram',
      updated: true
    }
  })),
  
  deleteDiagram: jest.fn(() => Promise.resolve({
    data: {
      success: true,
      message: 'Diagram deleted successfully'
    }
  })),
  
  addComponent: jest.fn(() => Promise.resolve({
    data: {
      _id: 'test-diagram-id',
      updated: true,
      component: {
        _id: 'new-component-id',
        component_type: 's3',
        name: 'New S3',
        position_x: 200,
        position_y: 250,
        configuration: {}
      }
    }
  })),
  
  removeComponent: jest.fn(() => Promise.resolve({
    data: {
      success: true,
      message: 'Component removed successfully'
    }
  }))
};

export default {
  authService,
  userService,
  diagramService
};