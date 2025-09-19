# Testing Plan for Platform Lego

This document outlines our testing strategy and test coverage for the Platform Lego application, split between End-to-End tests using Cypress and Unit tests using Jest.

## End-to-End Tests (Cypress)

These tests validate the application's functionality from a user's perspective, testing complete flows through the application.

| Test Suite | Test Cases | Description | Status |
|------------|------------|-------------|--------|
| **User Authentication** | Login page validation | Verify all required elements on login page | Complete |
|  | Login form validation | Test validation for empty or invalid inputs | Complete |
|  | Invalid login handling | Test error message for incorrect credentials | Complete |
|  | Successful login | Verify login, redirection, and localStorage state | Complete |
|  | Navigation to registration | Test navigation from login to create account | Complete |
|  | Registration page validation | Verify all required elements on registration page | Complete |
|  | Registration form validation | Test validation for invalid inputs | Complete |
|  | Successful registration | Verify account creation and redirection | Complete |
|  | Existing email handling | Test error message for duplicate email | Complete |
|  | User logout | Verify logout functionality and state cleanup | Complete |
| **Diagram Creation** | Dashboard validation | Verify dashboard elements and diagram list | Complete |
|  | Create new diagram | Test creating a new diagram from dashboard | Complete |
|  | Diagram title validation | Test validation for diagram title | Complete |
|  | Diagram template selection | Test selecting different templates | Complete |
|  | Diagram creation success | Verify successful creation and redirection | Complete |
| **Component Manipulation** | Drag and drop components | Test adding components via drag and drop | Complete |
|  | Component positioning | Test moving components around the canvas | Complete |
|  | Component selection | Test selecting and highlighting components | Complete |
|  | Component deletion | Test removing components from diagram | Complete |
|  | Component configuration | Test configuring component properties | Complete |
| **Component Connections** | Create connection | Test creating connections between components | In Progress |
|  | Connection validation | Test validation for valid/invalid connections | In Progress |
|  | Connection styling | Test different connection styles | In Progress |
|  | Connection deletion | Test removing connections | In Progress |
| **Diagram Saving** | Auto-save functionality | Test diagram auto-save feature | Planned |
|  | Manual save | Test manual save button functionality | Planned |
|  | Save conflicts | Test handling of concurrent edit conflicts | Planned |
|  | Diagram persistence | Verify diagram state persists across sessions | Planned |

## Unit Tests (Jest)

These tests focus on individual components and functions in isolation to ensure they work correctly.

| Component/Module | Test Cases | Description | Status |
|-----------------|------------|-------------|--------|
| **DiagramEditView** | Component rendering | Test initial render and state setup | Complete |
|  | Canvas interaction | Test zoom, pan and view adjustments | Complete |
|  | Component addition | Test adding components programmatically | Complete |
|  | Event handling | Test mouse and keyboard event handlers | Complete |
|  | State management | Test state updates for diagram changes | Complete |
| **ConfigurationInfoBox** | Component rendering | Test rendering with various props | Complete |
|  | Form controls | Test input fields and validation | Complete |
|  | Property changes | Test handling of property changes | Complete |
|  | Form submission | Test submission and propagation | Complete |
|  | Conditional rendering | Test display logic based on component type | Complete |
| **IconMenu** | Component rendering | Test menu items and structure | Complete |
|  | Item selection | Test selecting menu items | Complete |
|  | Drag events | Test drag start/end events | Complete |
|  | Filtering | Test category filtering functionality | Complete |
| **TerraformCodeView** | Component rendering | Test code view with various input | Complete |
|  | Code generation | Test Terraform code generation | Complete |
|  | Syntax highlighting | Test code formatting and highlighting | Complete |
|  | Copy functionality | Test copy to clipboard feature | Complete |
| **API Services** | Authentication calls | Test login, register, and logout API calls | Complete |
|  | Diagram operations | Test CRUD operations for diagrams | Complete |
|  | Error handling | Test API error handling | Complete |
|  | Request formatting | Test proper request formatting | Complete |
|  | Response parsing | Test response handling and transformation | Complete |

## Testing Coverage Goals

- **End-to-End Coverage**: 85% of user flows
- **Unit Test Coverage**: 90% of components and functions
- **API Test Coverage**: 100% of API endpoints

## Testing Environment Setup

- **Cypress Configuration**: `cypress.config.mjs` configured with appropriate baseUrl and timeouts
- **Jest Configuration**: `jest.config.js` with proper module mocking and setup files
- **Continuous Integration**: Automated test runs on each pull request

## Test Running Instructions

### Cypress Tests
```bash
# Run all Cypress tests in headless mode
npm run cypress:run

# Open Cypress UI for interactive testing
npm run cypress:open
```

### Jest Tests
```bash
# Run all Jest tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```
