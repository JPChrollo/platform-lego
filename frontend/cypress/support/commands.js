// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

/**
 * Custom command to login
 */
Cypress.Commands.add('login', (email = 'testuser@example.com', password = 'Password123!') => {
  // Direct login using localStorage without UI interaction (faster for tests)
  cy.window().then((win) => {
    win.localStorage.setItem('token', 'fake-jwt-token');
    win.localStorage.setItem('user', JSON.stringify({
      _id: 'user123',
      name: 'Test User',
      email: email
    }));
  });

  // Alternatively, use the UI approach
  // cy.session([email, password], () => {
  //   cy.visit('/login');
  //   cy.get('input[name="email"]').type(email);
  //   cy.get('input[name="password"]').type(password);
  //   cy.get('button[type="submit"]').click();
  //   
  //   // Wait for login to complete and redirect
  //   cy.url().should('include', '/dashboard');
  // });
});

/**
 * Custom command to create a new diagram
 */
Cypress.Commands.add('createDiagram', (name = 'Test Diagram', cloudProvider = 'AWS') => {
  // Mock API response
  cy.intercept('POST', '**/api/diagrams', {
    statusCode: 200,
    body: {
      _id: 'new-diagram-id',
      name: name,
      base: cloudProvider,
      created_at: new Date().toISOString(),
      cloud_components: []
    }
  }).as('createDiagramRequest');
  
  cy.visit('/dashboard');
  cy.contains('button', 'Create New Diagram').click();
  cy.get('input[name="name"]').type(name);
  cy.get('select[name="base"]').select(cloudProvider);
  cy.contains('button', 'Create').click();
  
  // Wait for API call and redirect
  cy.wait('@createDiagramRequest');
  cy.url().should('include', '/diagram/');
});

/**
 * Custom command to add a component to diagram
 */
Cypress.Commands.add('addComponent', (componentType, posX = 400, posY = 300) => {
  // Find component in menu and drag to canvas
  cy.get(`.icon-menu .component-icon[data-type="${componentType}"]`)
    .trigger('mousedown', { button: 0 })
    .trigger('dragstart');
  
  cy.get('.diagram-canvas')
    .trigger('dragover')
    .trigger('drop', { clientX: posX, clientY: posY })
    .trigger('dragend');
  
  // Verify component was added
  cy.get(`.diagram-component[data-type="${componentType}"]`).should('exist');
});

/**
 * Custom command to connect components
 */
Cypress.Commands.add('connectComponents', (sourceComponentName, targetComponentName, connectionType = 'Uses') => {
  // Select source component
  cy.contains('.diagram-component', sourceComponentName).click();
  
  // Add connection in configuration box
  cy.get('.add-connection-dropdown').click();
  cy.get('.connection-option').contains(targetComponentName).click();
  cy.get('.connection-type-dropdown').last().select(connectionType);
  
  // Save configuration
  cy.contains('button', 'Save').click();
  
  // Verify connection is created
  cy.get('svg.connections-layer line').should('exist');
});

/**
 * Custom command to verify diagram state
 */
Cypress.Commands.add('verifyDiagramState', (expectedComponents, expectedConnections = []) => {
  // Verify components count
  cy.get('.diagram-component').should('have.length', expectedComponents.length);
  
  // Verify each expected component exists
  expectedComponents.forEach(component => {
    cy.contains('.diagram-component', component.name).should('exist');
  });
  
  // Verify connections count
  cy.get('svg.connections-layer line').should('have.length', expectedConnections.length);
  
  // Verify each expected connection exists
  expectedConnections.forEach(connection => {
    cy.contains('.connection-label', connection.type).should('exist');
  });
});

/**
 * Custom command to take a screenshot of the diagram
 */
Cypress.Commands.add('snapshotDiagram', (name) => {
  cy.get('.diagram-canvas-container').screenshot(name);
});