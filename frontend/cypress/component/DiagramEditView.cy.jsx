import React from 'react';
import { mount } from 'cypress/react';
import DiagramEditView from '../../src/components/DiagramEditView';
import { MemoryRouter } from 'react-router-dom';

describe('DiagramEditView Component Test', () => {
  const mockDiagram = {
    _id: 'test-diagram-id',
    name: 'Test Diagram',
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
  };

  beforeEach(() => {
    // Mock API calls
    cy.intercept('GET', '**/api/diagrams/test-diagram-id', {
      statusCode: 200,
      body: mockDiagram
    }).as('getDiagramRequest');

    cy.intercept('GET', '**/api/component-templates**', {
      statusCode: 200,
      body: [
        {
          type: 'ec2',
          name: 'EC2 Instance',
          icon: 'ec2-icon.png'
        },
        {
          type: 's3',
          name: 'S3 Bucket',
          icon: 's3-icon.png'
        }
      ]
    }).as('getComponentTemplatesRequest');

    // Mock save endpoint
    cy.intercept('PUT', '**/api/diagrams/**', {
      statusCode: 200,
      body: { success: true }
    }).as('saveDiagramRequest');
  });

  it('renders the component correctly', () => {
    mount(
      <MemoryRouter initialEntries={['/diagram/test-diagram-id']}>
        <DiagramEditView diagramId="test-diagram-id" />
      </MemoryRouter>
    );

    // Wait for API calls to complete
    cy.wait('@getDiagramRequest');
    cy.wait('@getComponentTemplatesRequest');

    // Check if component renders main sections
    cy.get('.diagram-edit-container').should('exist');
    cy.get('.diagram-canvas').should('exist');
    cy.get('.icon-menu').should('exist');

    // Check if diagram name is displayed
    cy.contains('Test Diagram').should('exist');

    // Check if component is rendered on canvas
    cy.get('.diagram-component').should('have.length', 1);
    cy.contains('.diagram-component', 'Web Server').should('exist');
  });

  it('allows adding a new component to the canvas', () => {
    mount(
      <MemoryRouter initialEntries={['/diagram/test-diagram-id']}>
        <DiagramEditView diagramId="test-diagram-id" />
      </MemoryRouter>
    );

    cy.wait('@getDiagramRequest');
    cy.wait('@getComponentTemplatesRequest');

    // Simulate dragging an S3 component to the canvas
    cy.contains('.icon-menu', 'S3 Bucket')
      .trigger('mousedown')
      .trigger('dragstart');

    cy.get('.diagram-canvas')
      .trigger('dragover')
      .trigger('drop', { clientX: 400, clientY: 300 })
      .trigger('dragend');

    // Check if the new component is added
    cy.get('.diagram-component').should('have.length', 2);
  });

  it('opens configuration panel when clicking a component', () => {
    mount(
      <MemoryRouter initialEntries={['/diagram/test-diagram-id']}>
        <DiagramEditView diagramId="test-diagram-id" />
      </MemoryRouter>
    );

    cy.wait('@getDiagramRequest');
    cy.wait('@getComponentTemplatesRequest');

    // Click on the EC2 component
    cy.contains('.diagram-component', 'Web Server').click();

    // Check if configuration panel is displayed
    cy.get('.configuration-info-box').should('be.visible');
    cy.get('input[name="Name"]').should('have.value', 'web-server');
    cy.get('input[name="Instance Type"]').should('have.value', 't2.micro');
  });

  it('saves changes when save button is clicked', () => {
    mount(
      <MemoryRouter initialEntries={['/diagram/test-diagram-id']}>
        <DiagramEditView diagramId="test-diagram-id" />
      </MemoryRouter>
    );

    cy.wait('@getDiagramRequest');
    cy.wait('@getComponentTemplatesRequest');

    // Click on the EC2 component
    cy.contains('.diagram-component', 'Web Server').click();

    // Update a configuration value
    cy.get('input[name="Instance Type"]')
      .clear()
      .type('t3.medium');

    // Save configuration
    cy.contains('button', 'Save').click();

    // Click the main save button
    cy.get('.save-diagram-button').click();

    // Verify save API was called
    cy.wait('@saveDiagramRequest').its('request.body.cloud_components.0.configuration')
      .should('include', { 'Instance Type': 't3.medium' });
  });

  it('deletes a component when delete button is clicked', () => {
    mount(
      <MemoryRouter initialEntries={['/diagram/test-diagram-id']}>
        <DiagramEditView diagramId="test-diagram-id" />
      </MemoryRouter>
    );

    cy.wait('@getDiagramRequest');
    cy.wait('@getComponentTemplatesRequest');

    // Click on the EC2 component
    cy.contains('.diagram-component', 'Web Server').click();

    // Click delete button in configuration panel
    cy.get('.delete-component-button').click();

    // Confirm deletion
    cy.get('.confirmation-modal button.confirm').click();

    // Verify component is removed
    cy.get('.diagram-component').should('have.length', 0);
  });

  it('switches to Terraform view when tab is clicked', () => {
    // Mock terraform code generation
    cy.intercept('GET', '**/api/diagrams/*/terraform', {
      statusCode: 200,
      body: {
        code: 'resource "aws_instance" "web_server" { ami = "ami-12345678" }'
      }
    }).as('getTerraformRequest');

    mount(
      <MemoryRouter initialEntries={['/diagram/test-diagram-id']}>
        <DiagramEditView diagramId="test-diagram-id" />
      </MemoryRouter>
    );

    cy.wait('@getDiagramRequest');
    cy.wait('@getComponentTemplatesRequest');

    // Click on Terraform tab
    cy.contains('button', 'Terraform Code').click();

    // Wait for terraform code to load
    cy.wait('@getTerraformRequest');

    // Verify terraform view is displayed
    cy.get('.terraform-code-view').should('be.visible');
    cy.get('.terraform-code-view').contains('resource "aws_instance"');
  });
});