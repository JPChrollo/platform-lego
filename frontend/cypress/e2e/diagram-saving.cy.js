/// <reference types="cypress" />

describe('Diagram Saving Tests', () => {
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

    // Mock the API call to fetch a specific diagram
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

  it('should save diagram changes when the save button is clicked', () => {
    // Setup intercept for the save action
    cy.intercept('PUT', '**/api/diagrams/test-diagram-id', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Diagram saved successfully'
      }
    }).as('saveDiagramRequest');

    // Make a change to the diagram (add a new component)
    cy.get('.icon-menu').contains('S3').click();
    cy.get('.diagram-canvas').click(400, 300);

    // Verify the new component is displayed
    cy.get('.diagram-component').should('have.length', 2);

    // Click the save button
    cy.get('.save-diagram-button').click();

    // Verify the request was sent with correct data
    cy.wait('@saveDiagramRequest').its('request.body').should('include', {
      name: 'Test AWS Diagram',
      base: 'AWS'
    });

    // Check if the success notification is displayed
    cy.contains('Diagram saved successfully').should('be.visible');
  });

  it('should show error notification when save fails', () => {
    // Setup intercept for the save action to fail
    cy.intercept('PUT', '**/api/diagrams/test-diagram-id', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Failed to save diagram'
      }
    }).as('saveDiagramRequestFailure');

    // Make a change to the diagram
    cy.get('.icon-menu').contains('S3').click();
    cy.get('.diagram-canvas').click(400, 300);

    // Click the save button
    cy.get('.save-diagram-button').click();

    // Verify the error notification is displayed
    cy.contains('Failed to save diagram').should('be.visible');
  });

  it('should maintain unsaved changes when navigating between tabs', () => {
    // Add a new component
    cy.get('.icon-menu').contains('S3').click();
    cy.get('.diagram-canvas').click(400, 300);

    // Verify the new component is displayed
    cy.get('.diagram-component').should('have.length', 2);

    // Navigate to the Terraform tab
    cy.contains('button', 'Terraform Code').click();

    // Navigate back to the diagram tab
    cy.contains('button', 'Diagram').click();

    // Verify the added component is still there
    cy.get('.diagram-component').should('have.length', 2);
  });

  it('should prompt when leaving with unsaved changes', () => {
    // Mock the confirmation dialog
    cy.on('window:confirm', () => true);

    // Add a new component
    cy.get('.icon-menu').contains('S3').click();
    cy.get('.diagram-canvas').click(400, 300);

    // Setup intercept for the dashboard page
    cy.intercept('GET', '**/api/diagrams', {
      statusCode: 200,
      body: []
    }).as('getDiagramsRequest');

    // Try to navigate away
    cy.get('a[href="/dashboard"]').click();

    // Confirmation dialog should appear (intercepted by our mock)
    
    // Should navigate to dashboard after confirmation
    cy.url().should('include', '/dashboard');
  });

  it('should save diagram with component configurations', () => {
    // Setup intercept for the save action
    cy.intercept('PUT', '**/api/diagrams/test-diagram-id', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Diagram saved successfully'
      }
    }).as('saveDiagramRequest');

    // Select the existing EC2 component
    cy.contains('.diagram-component', 'Web Server').click();
    
    // Configuration box should open
    cy.get('.configuration-info-box').should('be.visible');
    
    // Update a configuration value
    cy.get('.configuration-info-box input[name="Instance Type"]')
      .clear()
      .type('t3.medium');
    
    // Save the configuration
    cy.contains('button', 'Save').click();
    
    // Click the main save button to save the diagram
    cy.get('.save-diagram-button').click();
    
    // Verify the request was sent with updated configuration
    cy.wait('@saveDiagramRequest').its('request.body.cloud_components.0.configuration')
      .should('include', { 'Instance Type': 't3.medium' });
  });

  it('should save diagram with component positions', () => {
    // Setup intercept for the save action
    cy.intercept('PUT', '**/api/diagrams/test-diagram-id', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Diagram saved successfully'
      }
    }).as('saveDiagramRequest');

    // Move the EC2 component
    cy.contains('.diagram-component', 'Web Server')
      .trigger('mousedown', { button: 0 })
      .trigger('dragstart')
      .trigger('drag', { clientX: 300, clientY: 300 })
      .get('.diagram-canvas')
      .trigger('drop', { clientX: 300, clientY: 300 })
      .trigger('dragend');
    
    // Save the diagram
    cy.get('.save-diagram-button').click();
    
    // Verify the request contains the updated position
    cy.wait('@saveDiagramRequest').its('request.body.cloud_components.0')
      .should('include', { position_x: 300, position_y: 300 });
  });

  it('should save diagram with component connections', () => {
    // Setup intercept for the save action
    cy.intercept('PUT', '**/api/diagrams/test-diagram-id', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Diagram saved successfully'
      }
    }).as('saveDiagramRequest');

    // Add a new VPC component
    cy.get('.icon-menu').contains('VPC').click();
    cy.get('.diagram-canvas').click(400, 300);
    
    // Create a connection
    cy.contains('.diagram-component', 'Web Server').click();
    cy.get('.add-connection-dropdown').click();
    cy.get('.connection-option').contains('VPC').click();
    cy.get('.connection-type-dropdown').last().select('Belongs to');
    cy.contains('button', 'Save').click();
    
    // Save the diagram
    cy.get('.save-diagram-button').click();
    
    // Verify the request contains the connection
    cy.wait('@saveDiagramRequest').then((interception) => {
      const ec2Component = interception.request.body.cloud_components.find(
        comp => comp.component_type === 'ec2'
      );
      expect(ec2Component.connections).to.exist;
      expect(ec2Component.connections.length).to.equal(1);
      expect(ec2Component.connections[0].type).to.equal('Belongs to');
    });
  });

  it('should load saved diagram with all components and connections', () => {
    // Mock a more complex diagram with components and connections
    cy.intercept('GET', '**/api/diagrams/complex-diagram-id', {
      statusCode: 200,
      body: {
        _id: 'complex-diagram-id',
        name: 'Complex AWS Diagram',
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
              'Instance Type': 't2.micro'
            },
            connections: [
              {
                target_id: 's3-comp',
                type: 'Uses'
              },
              {
                target_id: 'vpc-comp',
                type: 'Belongs to'
              }
            ]
          },
          {
            _id: 's3-comp',
            component_type: 's3',
            name: 'Data Bucket',
            position_x: 500,
            position_y: 200,
            configuration: {
              'Bucket Name': 'data-bucket'
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
    }).as('getComplexDiagramRequest');

    // Visit the complex diagram
    cy.visit('/diagram/complex-diagram-id');
    cy.wait('@getComplexDiagramRequest');
    
    // Verify all components are loaded
    cy.get('.diagram-component').should('have.length', 3);
    
    // Verify connections are drawn
    cy.get('svg.connections-layer line').should('have.length', 2);
    
    // Verify connection labels
    cy.get('.connection-label').contains('Uses').should('be.visible');
    cy.get('.connection-label').contains('Belongs to').should('be.visible');
  });

  it('should autosave diagram after specific actions', () => {
    // Setup intercept for autosave action
    cy.intercept('PUT', '**/api/diagrams/test-diagram-id/autosave', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Diagram autosaved'
      }
    }).as('autosaveDiagramRequest');

    // Make significant changes - add component
    cy.get('.icon-menu').contains('S3').click();
    cy.get('.diagram-canvas').click(400, 300);

    // Wait a moment for autosave to trigger (assuming autosave after 3 seconds of inactivity)
    cy.wait(3000);
    
    // Verify autosave was triggered
    cy.wait('@autosaveDiagramRequest');
    
    // Autosave notification should appear briefly
    cy.contains('Autosaved').should('be.visible');
  });

  it('should export diagram as PNG', () => {
    // Mock the browser's download functionality
    cy.window().then((win) => {
      cy.stub(win.document.createElement('a'), 'click').as('downloadClick');
    });
    
    // Click the export button
    cy.get('.export-button').click();
    cy.get('.export-png-option').click();
    
    // Verify the download was triggered
    cy.get('@downloadClick').should('be.called');
  });

  it('should generate and display Terraform code', () => {
    // Navigate to the Terraform tab
    cy.contains('button', 'Terraform Code').click();
    
    // Check if Terraform code is displayed
    cy.get('.terraform-code-view').should('be.visible');
    cy.get('.terraform-code-view code').should('contain', 'resource');
    
    // Check if code contains the component configuration
    cy.get('.terraform-code-view code').should('contain', 'web-server');
    cy.get('.terraform-code-view code').should('contain', 't2.micro');
  });

  it('should export Terraform code to file', () => {
    // Mock the browser's download functionality
    cy.window().then((win) => {
      cy.stub(win.document.createElement('a'), 'click').as('downloadClick');
    });
    
    // Navigate to the Terraform tab
    cy.contains('button', 'Terraform Code').click();
    
    // Click the export Terraform button
    cy.get('.export-terraform-button').click();
    
    // Verify the download was triggered
    cy.get('@downloadClick').should('be.called');
  });

  it('should create a new version when saving', () => {
    // Setup intercept for the version creation
    cy.intercept('POST', '**/api/diagrams/test-diagram-id/versions', {
      statusCode: 200,
      body: {
        success: true,
        version: {
          _id: 'version-1',
          version_number: 1,
          created_at: new Date().toISOString()
        }
      }
    }).as('createVersionRequest');

    // Click the "Save as Version" button
    cy.get('.save-version-button').click();
    
    // Enter version description
    cy.get('.version-description-input').type('Initial version');
    
    // Confirm version creation
    cy.get('.confirm-version-button').click();
    
    // Verify the version creation request was made
    cy.wait('@createVersionRequest');
    
    // Verify success notification
    cy.contains('Version 1 created successfully').should('be.visible');
  });

  it('should restore a previous version', () => {
    // Setup intercept for versions list
    cy.intercept('GET', '**/api/diagrams/test-diagram-id/versions', {
      statusCode: 200,
      body: [
        {
          _id: 'version-1',
          version_number: 1,
          description: 'Initial version',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          _id: 'version-2',
          version_number: 2,
          description: 'Added S3',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getVersionsRequest');
    
    // Setup intercept for version restoration
    cy.intercept('GET', '**/api/diagrams/test-diagram-id/versions/version-1', {
      statusCode: 200,
      body: {
        _id: 'test-diagram-id',
        name: 'Test AWS Diagram',
        base: 'AWS',
        cloud_components: [
          {
            _id: 'ec2-comp',
            component_type: 'ec2',
            name: 'Initial EC2',
            position_x: 200,
            position_y: 200
          }
        ]
      }
    }).as('restoreVersionRequest');
    
    // Open versions panel
    cy.get('.versions-button').click();
    
    // Wait for versions to load
    cy.wait('@getVersionsRequest');
    
    // Select version 1
    cy.contains('.version-item', 'Version 1').click();
    
    // Click restore button
    cy.get('.restore-version-button').click();
    
    // Confirm restoration
    cy.get('.confirm-restore-button').click();
    
    // Wait for restoration
    cy.wait('@restoreVersionRequest');
    
    // Verify the component from version 1 is displayed
    cy.contains('.diagram-component', 'Initial EC2').should('be.visible');
  });
});