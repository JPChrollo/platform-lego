/// <reference types="cypress" />

describe('Diagram Creation Workflow', () => {
  beforeEach(() => {
    // Login before each test
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'fake-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        _id: 'user123',
        name: 'Test User',
        email: 'testuser@example.com'
      }));
    });

    // Mock the user diagrams API call for dashboard
    cy.intercept('GET', '**/api/diagrams', {
      statusCode: 200,
      body: []
    }).as('getDiagramsRequest');

    // Visit the dashboard
    cy.visit('/dashboard');
    cy.wait('@getDiagramsRequest');
  });

  it('should display dashboard with create diagram button', () => {
    // Check for dashboard elements
    cy.contains('h1', 'Your Cloud Diagrams').should('be.visible');
    cy.contains('button', 'Create New Diagram').should('be.visible');
  });

  it('should open create diagram modal when button is clicked', () => {
    // Click create new diagram button
    cy.contains('button', 'Create New Diagram').click();
    
    // Check if modal is displayed
    cy.get('.create-diagram-modal').should('be.visible');
    cy.contains('h2', 'Create New Diagram').should('be.visible');
    
    // Check form elements
    cy.get('input[name="diagramName"]').should('be.visible');
    cy.get('select[name="cloudProvider"]').should('be.visible');
    cy.contains('button', 'Create').should('be.visible');
    cy.contains('button', 'Cancel').should('be.visible');
  });

  it('should show validation errors for empty form submission', () => {
    // Open the create diagram modal
    cy.contains('button', 'Create New Diagram').click();
    
    // Submit empty form
    cy.contains('button', 'Create').click();
    
    // Check for validation errors
    cy.contains('Diagram name is required').should('be.visible');
  });

  it('should close modal when cancel is clicked', () => {
    // Open the create diagram modal
    cy.contains('button', 'Create New Diagram').click();
    
    // Click cancel
    cy.contains('button', 'Cancel').click();
    
    // Modal should be hidden
    cy.get('.create-diagram-modal').should('not.exist');
  });

  it('should create a new diagram and redirect to editor', () => {
    // Intercept the create diagram API call
    cy.intercept('POST', '**/api/diagrams', {
      statusCode: 201,
      body: {
        _id: 'new-diagram-123',
        name: 'Test AWS Diagram',
        base: 'AWS',
        cloud_components: []
      }
    }).as('createDiagramRequest');
    
    // Open the create diagram modal
    cy.contains('button', 'Create New Diagram').click();
    
    // Fill form
    cy.get('input[name="diagramName"]').type('Test AWS Diagram');
    cy.get('select[name="cloudProvider"]').select('AWS');
    
    // Submit form
    cy.contains('button', 'Create').click();
    
    // Wait for API call to complete
    cy.wait('@createDiagramRequest');
    
    // Check for redirect to diagram editor
    cy.url().should('include', '/diagram/new-diagram-123');
  });

  it('should handle error during diagram creation', () => {
    // Intercept the create diagram API call with error
    cy.intercept('POST', '**/api/diagrams', {
      statusCode: 500,
      body: {
        message: 'Server error creating diagram'
      }
    }).as('createDiagramRequest');
    
    // Open the create diagram modal
    cy.contains('button', 'Create New Diagram').click();
    
    // Fill form
    cy.get('input[name="diagramName"]').type('Test Error Diagram');
    cy.get('select[name="cloudProvider"]').select('AWS');
    
    // Submit form
    cy.contains('button', 'Create').click();
    
    // Wait for API call to complete
    cy.wait('@createDiagramRequest');
    
    // Should show error message
    cy.contains('Error creating diagram').should('be.visible');
  });

  it('should display existing diagrams on the dashboard', () => {
    // Mock the user diagrams API call with existing diagrams
    cy.intercept('GET', '**/api/diagrams', {
      statusCode: 200,
      body: [
        {
          _id: 'existing-diagram-1',
          name: 'Existing AWS Diagram',
          base: 'AWS',
          createdAt: '2025-09-10T10:00:00.000Z',
          updatedAt: '2025-09-10T10:00:00.000Z'
        },
        {
          _id: 'existing-diagram-2',
          name: 'Existing GCP Diagram',
          base: 'GCP',
          createdAt: '2025-09-11T10:00:00.000Z',
          updatedAt: '2025-09-11T10:00:00.000Z'
        }
      ]
    }).as('getDiagramsWithDataRequest');
    
    // Reload dashboard
    cy.visit('/dashboard');
    cy.wait('@getDiagramsWithDataRequest');
    
    // Check if diagrams are displayed
    cy.contains('Existing AWS Diagram').should('be.visible');
    cy.contains('Existing GCP Diagram').should('be.visible');
    
    // Check for edit buttons
    cy.get('[data-diagram-id="existing-diagram-1"] .edit-diagram-btn').should('be.visible');
    cy.get('[data-diagram-id="existing-diagram-2"] .edit-diagram-btn').should('be.visible');
  });

  it('should navigate to existing diagram editor when clicked', () => {
    // Mock the user diagrams API call with existing diagrams
    cy.intercept('GET', '**/api/diagrams', {
      statusCode: 200,
      body: [
        {
          _id: 'existing-diagram-1',
          name: 'Existing AWS Diagram',
          base: 'AWS',
          createdAt: '2025-09-10T10:00:00.000Z',
          updatedAt: '2025-09-10T10:00:00.000Z'
        }
      ]
    }).as('getDiagramsWithDataRequest');
    
    // Reload dashboard
    cy.visit('/dashboard');
    cy.wait('@getDiagramsWithDataRequest');
    
    // Mock the specific diagram API call
    cy.intercept('GET', '**/api/diagrams/existing-diagram-1', {
      statusCode: 200,
      body: {
        _id: 'existing-diagram-1',
        name: 'Existing AWS Diagram',
        base: 'AWS',
        cloud_components: []
      }
    }).as('getSpecificDiagramRequest');
    
    // Click on edit button
    cy.get('[data-diagram-id="existing-diagram-1"] .edit-diagram-btn').click();
    
    // Wait for diagram to load
    cy.wait('@getSpecificDiagramRequest');
    
    // Check for redirect to diagram editor
    cy.url().should('include', '/diagram/existing-diagram-1');
  });

  it('should delete a diagram when delete button is clicked', () => {
    // Mock the user diagrams API call with existing diagrams
    cy.intercept('GET', '**/api/diagrams', {
      statusCode: 200,
      body: [
        {
          _id: 'existing-diagram-1',
          name: 'Existing AWS Diagram',
          base: 'AWS',
          createdAt: '2025-09-10T10:00:00.000Z',
          updatedAt: '2025-09-10T10:00:00.000Z'
        }
      ]
    }).as('getDiagramsWithDataRequest');
    
    // Reload dashboard
    cy.visit('/dashboard');
    cy.wait('@getDiagramsWithDataRequest');
    
    // Mock the delete diagram API call
    cy.intercept('DELETE', '**/api/diagrams/existing-diagram-1', {
      statusCode: 200,
      body: {
        message: 'Diagram deleted successfully'
      }
    }).as('deleteDiagramRequest');
    
    // Mock the user diagrams API call after deletion
    cy.intercept('GET', '**/api/diagrams', {
      statusCode: 200,
      body: []
    }).as('getEmptyDiagramsRequest');
    
    // Click on delete button
    cy.get('[data-diagram-id="existing-diagram-1"] .delete-diagram-btn').click();
    
    // Confirm delete in modal
    cy.contains('button', 'Yes, Delete').click();
    
    // Wait for delete API call
    cy.wait('@deleteDiagramRequest');
    
    // Should refresh diagrams list
    cy.wait('@getEmptyDiagramsRequest');
    
    // Should show success message
    cy.contains('Diagram deleted successfully').should('be.visible');
    
    // Diagram should no longer be in the list
    cy.contains('Existing AWS Diagram').should('not.exist');
  });
});