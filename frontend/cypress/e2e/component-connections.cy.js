/// <reference types="cypress" />

describe('Component Connections Tests', () => {
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

    // Mock the specific diagram API call with pre-populated components
    cy.intercept('GET', '**/api/diagrams/test-diagram-id', {
      statusCode: 200,
      body: {
        _id: 'test-diagram-id',
        name: 'Test AWS Diagram',
        base: 'AWS',
        cloud_components: [
          {
            _id: 'ec2-comp',
            component_type: 'ec2',
            name: 'Web Server',
            position_x: 200,
            position_y: 200,
            configuration: {
              Name: 'web-server',
              'Instance Type': 't2.micro',
              'AMI ID': 'ami-12345678'
            }
          },
          {
            _id: 's3-comp',
            component_type: 's3',
            name: 'Data Bucket',
            position_x: 500,
            position_y: 200,
            configuration: {
              'Bucket Name': 'data-bucket',
              'Region': 'us-east-1',
              'Access Control': 'private'
            }
          },
          {
            _id: 'vpc-comp',
            component_type: 'vpc',
            name: 'Main VPC',
            position_x: 350,
            position_y: 400,
            configuration: {
              Name: 'main-vpc',
              'CIDR Block': '10.0.0.0/16'
            }
          }
        ]
      }
    }).as('getDiagramRequest');

    // Visit the diagram editor
    cy.visit('/diagram/test-diagram-id');
    cy.wait('@getDiagramRequest');
    
    // Wait for diagram editor to fully load
    cy.contains('Test AWS Diagram').should('be.visible');
  });

  it('should display diagram with pre-populated components', () => {
    // Check that components are rendered
    cy.get('.diagram-component').should('have.length', 3);
    cy.contains('.diagram-component', 'Web Server').should('be.visible');
    cy.contains('.diagram-component', 'Data Bucket').should('be.visible');
    cy.contains('.diagram-component', 'Main VPC').should('be.visible');
  });

  it('should create a connection between components', () => {
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
    
    // Click on the EC2 component to select it
    cy.contains('.diagram-component', 'Web Server').click();
    
    // Configuration box should open
    cy.get('.configuration-info-box').should('be.visible');
    
    // Find connection section in config box
    cy.get('.component-connections-section').should('be.visible');
    
    // Add a connection to VPC
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    
    // Select connection type
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    
    // Save configuration
    cy.contains('button', 'Save').click();
    
    // A connection line should be drawn
    cy.get('svg.connections-layer line').should('have.length.at.least', 1);
    
    // Connection label should include the type
    cy.get('.connection-label').contains('Belongs to').should('be.visible');
  });

  it('should create multiple connections from one component', () => {
    // Click on the EC2 component to select it
    cy.contains('.diagram-component', 'Web Server').click();
    
    // Add connection to VPC
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    
    // Add connection to S3
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Data Bucket').click();
    cy.get('.connection-type-dropdown').last().select('Uses');
    
    // Save configuration
    cy.contains('button', 'Save').click();
    
    // Two connection lines should be drawn
    cy.get('svg.connections-layer line').should('have.length', 2);
    
    // Both connection labels should be visible
    cy.get('.connection-label').contains('Belongs to').should('be.visible');
    cy.get('.connection-label').contains('Uses').should('be.visible');
  });

  it('should remove a connection when deleted from configuration', () => {
    // First create a connection
    cy.contains('.diagram-component', 'Web Server').click();
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    cy.contains('button', 'Save').click();
    
    // Verify connection exists
    cy.get('svg.connections-layer line').should('have.length', 1);
    
    // Reopen the component config
    cy.contains('.diagram-component', 'Web Server').click();
    
    // Delete the connection
    cy.get('.delete-connection-btn').click();
    cy.contains('button', 'Save').click();
    
    // Connection should be removed
    cy.get('svg.connections-layer line').should('not.exist');
  });

  it('should show connection properties when selecting a component', () => {
    // Create a connection
    cy.contains('.diagram-component', 'Web Server').click();
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    cy.contains('button', 'Save').click();
    
    // Select the component again
    cy.contains('.diagram-component', 'Web Server').click();
    
    // Connection should be shown in configuration
    cy.get('.existing-connections').contains('Main VPC').should('be.visible');
    cy.get('.existing-connections').contains('Belongs to').should('be.visible');
  });

  it('should update connection type when modified', () => {
    // Create a connection
    cy.contains('.diagram-component', 'Web Server').click();
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    cy.contains('button', 'Save').click();
    
    // Select the component again
    cy.contains('.diagram-component', 'Web Server').click();
    
    // Find the existing connection and change its type
    cy.get('.connection-type-dropdown').select('References');
    cy.contains('button', 'Save').click();
    
    // Connection label should be updated
    cy.get('.connection-label').contains('References').should('be.visible');
    cy.get('.connection-label').contains('Belongs to').should('not.exist');
  });

  it('should highlight connections when component is selected', () => {
    // Create a connection
    cy.contains('.diagram-component', 'Web Server').click();
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    cy.contains('button', 'Save').click();
    
    // Deselect component first by clicking elsewhere
    cy.get('.diagram-canvas').click({ force: true });
    
    // No connection should be highlighted
    cy.get('svg.connections-layer line.selected').should('not.exist');
    
    // Select the Web Server component
    cy.contains('.diagram-component', 'Web Server').click();
    
    // Its connection should be highlighted
    cy.get('svg.connections-layer line.selected').should('exist');
    
    // Select the VPC component
    cy.contains('.diagram-component', 'Main VPC').click();
    
    // The same connection should remain highlighted
    cy.get('svg.connections-layer line.selected').should('exist');
  });

  it('should maintain connections when components are moved', () => {
    // Create a connection
    cy.contains('.diagram-component', 'Web Server').click();
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    cy.contains('button', 'Save').click();
    
    // Get the initial position of the connection line
    cy.get('svg.connections-layer line').then($line => {
      const initialX1 = $line.attr('x1');
      const initialY1 = $line.attr('y1');
      const initialX2 = $line.attr('x2');
      const initialY2 = $line.attr('y2');
      
      // Move the EC2 component
      cy.contains('.diagram-component', 'Web Server')
        .trigger('mousedown', { button: 0 })
        .trigger('dragstart')
        .trigger('drag', { clientX: 100, clientY: 100 })
        .get('.diagram-canvas')
        .trigger('drop', { clientX: 100, clientY: 100 })
        .trigger('dragend');
      
      // The connection line should be updated
      cy.get('svg.connections-layer line').then($newLine => {
        const newX1 = $newLine.attr('x1');
        const newY1 = $newLine.attr('y1');
        const newX2 = $newLine.attr('x2');
        const newY2 = $newLine.attr('y2');
        
        // The source coordinates should have changed
        expect(newX1).to.not.equal(initialX1);
        expect(newY1).to.not.equal(initialY1);
        
        // The target coordinates should be unchanged
        expect(newX2).to.equal(initialX2);
        expect(newY2).to.equal(initialY2);
      });
    });
  });

  it('should not allow connecting a component to itself', () => {
    // Select the EC2 component
    cy.contains('.diagram-component', 'Web Server').click();
    
    // The dropdown should not contain the selected component
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Web Server').should('not.exist');
  });

  it('should not allow duplicate connections to the same component', () => {
    // Create a connection
    cy.contains('.diagram-component', 'Web Server').click();
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    
    // Try to add the same connection again
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').should('not.exist');
  });

  it('should display both inbound and outbound connections in properties panel', () => {
    // Create a connection from EC2 to VPC
    cy.contains('.diagram-component', 'Web Server').click();
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    cy.contains('button', 'Save').click();
    
    // Create another connection from S3 to VPC
    cy.contains('.diagram-component', 'Data Bucket').click();
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('Main VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    cy.contains('button', 'Save').click();
    
    // Select the VPC component
    cy.contains('.diagram-component', 'Main VPC').click();
    
    // In the properties panel, we should see both inbound connections
    cy.get('.properties-panel').contains('Web Server').should('be.visible');
    cy.get('.properties-panel').contains('Data Bucket').should('be.visible');
  });
});