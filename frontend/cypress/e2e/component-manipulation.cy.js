/// <reference types="cypress" />

describe('Diagram Component Manipulation', () => {
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

    // Mock the specific diagram API call for an empty diagram
    cy.intercept('GET', '**/api/diagrams/test-diagram-id', {
      statusCode: 200,
      body: {
        _id: 'test-diagram-id',
        name: 'Test AWS Diagram',
        base: 'AWS',
        cloud_components: []
      }
    }).as('getDiagramRequest');

    // Visit the diagram editor
    cy.visit('/diagram/test-diagram-id');
    cy.wait('@getDiagramRequest');
    
    // Wait for diagram editor to fully load
    cy.contains('Test AWS Diagram').should('be.visible');
  });

  it('should display diagram editor with icon menu and empty canvas', () => {
    // Check for diagram editor elements
    cy.contains('Test AWS Diagram').should('be.visible');
    cy.contains('Save Diagram').should('be.visible');
    
    // Check for icon menu
    cy.get('.icon-menu').should('be.visible');
    cy.contains('AWS Components').should('be.visible');
    
    // Check for empty canvas
    cy.get('.diagram-canvas').should('be.visible');
    cy.contains('Drag and drop components from the icon menu to create your diagram').should('be.visible');
  });

  it('should allow dragging a component from icon menu to canvas', () => {
    // Mock the update diagram API call
    cy.intercept('PUT', '**/api/diagrams/test-diagram-id', {
      statusCode: 200,
      body: {
        _id: 'test-diagram-id',
        name: 'Test AWS Diagram',
        base: 'AWS',
        updated: true
      }
    }).as('updateDiagramRequest');
    
    // Select an EC2 component from icon menu
    cy.get('.icon-menu-item')
      .contains('EC2')
      .as('ec2Component');
    
    // Get the canvas element
    cy.get('.diagram-canvas')
      .as('canvas');
    
    // Perform drag and drop operation using custom command
    cy.dragAndDrop('@ec2Component', '@canvas');
    
    // The component should be added to the canvas
    cy.get('.diagram-component').should('exist');
    cy.contains('EC2').should('be.visible');
  });

  it('should open configuration panel when clicking on a component', () => {
    // Add a component to the diagram first
    cy.get('.icon-menu-item')
      .contains('EC2')
      .as('ec2Component');
    
    // Get the canvas element
    cy.get('.diagram-canvas')
      .as('canvas');
    
    // Perform drag and drop operation
    cy.dragAndDrop('@ec2Component', '@canvas');
    
    // Click on the added component
    cy.get('.diagram-component')
      .first()
      .click();
    
    // Configuration panel should open
    cy.get('.configuration-info-box').should('be.visible');
    cy.contains('Configuration for EC2').should('be.visible');
    cy.get('input[name="Name"]').should('be.visible');
    cy.get('select[name="Instance Type"]').should('be.visible');
  });

  it('should update component configuration when saving', () => {
    // Add a component to the diagram first
    cy.get('.icon-menu-item')
      .contains('EC2')
      .as('ec2Component');
    
    cy.get('.diagram-canvas')
      .as('canvas');
    
    cy.dragAndDrop('@ec2Component', '@canvas');
    
    // Click on the added component
    cy.get('.diagram-component')
      .first()
      .click();
    
    // Update configuration
    cy.get('input[name="Name"]').clear().type('Web Server');
    cy.get('select[name="Instance Type"]').select('t2.micro');
    cy.get('input[name="AMI ID"]').clear().type('ami-12345678');
    
    // Save configuration
    cy.contains('button', 'Save').click();
    
    // Configuration panel should close
    cy.get('.configuration-info-box').should('not.exist');
    
    // Component name should be updated on the canvas
    cy.get('.diagram-component')
      .first()
      .should('contain', 'Web Server');
    
    // Configuration should be visible in properties panel
    cy.get('.properties-panel')
      .should('contain', 'Web Server')
      .should('contain', 'ami-12345678');
  });

  it('should move component when dragging on canvas', () => {
    // Add a component to the diagram first
    cy.get('.icon-menu-item')
      .contains('EC2')
      .as('ec2Component');
    
    cy.get('.diagram-canvas')
      .as('canvas');
    
    cy.dragAndDrop('@ec2Component', '@canvas');
    
    // Get the component's initial position
    cy.get('.diagram-component')
      .first()
      .then($component => {
        const initialPosition = $component.position();
        
        // Drag the component to a new position
        cy.get('.diagram-component')
          .first()
          .trigger('mousedown', { button: 0 })
          .trigger('dragstart')
          .trigger('drag', { clientX: 500, clientY: 300 })
          .get('.diagram-canvas')
          .trigger('drop', { clientX: 500, clientY: 300 })
          .trigger('dragend');
        
        // Verify component was moved
        cy.get('.diagram-component')
          .first()
          .then($movedComponent => {
            const newPosition = $movedComponent.position();
            expect(newPosition.left).to.not.equal(initialPosition.left);
            expect(newPosition.top).to.not.equal(initialPosition.top);
          });
      });
  });

  it('should allow adding multiple components to the canvas', () => {
    // Add EC2 component
    cy.get('.icon-menu-item')
      .contains('EC2')
      .as('ec2Component');
    
    cy.get('.diagram-canvas')
      .as('canvas');
    
    cy.dragAndDrop('@ec2Component', '@canvas');
    
    // Add S3 component
    cy.get('.icon-menu-item')
      .contains('S3 Bucket')
      .as('s3Component');
    
    cy.dragAndDrop('@s3Component', '@canvas');
    
    // Verify both components exist
    cy.get('.diagram-component').should('have.length', 2);
    cy.contains('.diagram-component', 'EC2').should('exist');
    cy.contains('.diagram-component', 'S3 Bucket').should('exist');
  });

  it('should allow deleting a component from the canvas', () => {
    // Add a component to the diagram first
    cy.get('.icon-menu-item')
      .contains('EC2')
      .as('ec2Component');
    
    cy.get('.diagram-canvas')
      .as('canvas');
    
    cy.dragAndDrop('@ec2Component', '@canvas');
    
    // Verify component exists
    cy.get('.diagram-component').should('exist');
    
    // Click on the component to select it
    cy.get('.diagram-component')
      .first()
      .click();
    
    // Find and click delete button in configuration panel
    cy.get('.configuration-info-box')
      .find('button')
      .contains('Delete')
      .click();
    
    // Verify component was deleted
    cy.get('.diagram-component').should('not.exist');
  });

  it('should switch cloud providers in the icon menu', () => {
    // Initially AWS components should be shown
    cy.contains('AWS Components').should('be.visible');
    cy.contains('EC2').should('be.visible');
    
    // Click on GCP button
    cy.contains('button', 'GCP').click();
    
    // GCP components should now be shown
    cy.contains('GCP Components').should('be.visible');
    cy.contains('Compute Engine').should('be.visible');
    cy.contains('EC2').should('not.exist');
    
    // Click on Azure button
    cy.contains('button', 'Azure').click();
    
    // Azure components should now be shown
    cy.contains('Azure Components').should('be.visible');
    cy.contains('Virtual Machines').should('be.visible');
    cy.contains('Compute Engine').should('not.exist');
  });

  it('should validate required fields in component configuration', () => {
    // Add a component to the diagram first
    cy.get('.icon-menu-item')
      .contains('EC2')
      .as('ec2Component');
    
    cy.get('.diagram-canvas')
      .as('canvas');
    
    cy.dragAndDrop('@ec2Component', '@canvas');
    
    // Click on the added component
    cy.get('.diagram-component')
      .first()
      .click();
    
    // Clear required field
    cy.get('input[name="AMI ID"]').clear();
    
    // Try to save configuration
    cy.contains('button', 'Save').click();
    
    // Validation error should be shown
    cy.contains('This field is required').should('be.visible');
    
    // Fill the required field
    cy.get('input[name="AMI ID"]').type('ami-12345678');
    
    // Save configuration should now work
    cy.contains('button', 'Save').click();
    
    // Configuration panel should close
    cy.get('.configuration-info-box').should('not.exist');
  });

  it('should search components in icon menu', () => {
    // Initially all components should be visible
    cy.get('.icon-menu-item').its('length').should('be.gt', 5);
    
    // Enter search term
    cy.get('.icon-menu-search input').type('S3');
    
    // Only S3 related components should be visible
    cy.contains('.icon-menu-item', 'S3 Bucket').should('be.visible');
    cy.contains('.icon-menu-item', 'EC2').should('not.be.visible');
    
    // Clear search
    cy.get('.icon-menu-search input').clear();
    
    // All components should be visible again
    cy.contains('.icon-menu-item', 'EC2').should('be.visible');
  });
});