/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login without UI
     * @example cy.login('user@example.com', 'password')
     */
    login(email?: string, password?: string): Chainable<Element>;

    /**
     * Custom command to create a diagram
     * @example cy.createDiagram('My Test Diagram', 'AWS')
     */
    createDiagram(name: string, cloudProvider?: string): Chainable<Element>;

    /**
     * Custom command to add a component to the diagram
     * @example cy.addComponent('ec2', 400, 300)
     */
    addComponent(componentType: string, posX?: number, posY?: number): Chainable<Element>;

    /**
     * Custom command to connect two components
     * @example cy.connectComponents('Web Server', 'Data Bucket', 'Uses')
     */
    connectComponents(sourceComponentName: string, targetComponentName: string, connectionType?: string): Chainable<Element>;

    /**
     * Custom command to verify the diagram state
     * @example cy.verifyDiagramState(components, connections)
     */
    verifyDiagramState(expectedComponents: any[], expectedConnections?: any[]): Chainable<Element>;

    /**
     * Custom command to take a screenshot of the diagram
     * @example cy.snapshotDiagram('my-diagram')
     */
    snapshotDiagram(name: string): Chainable<Element>;
  }
}