/// <reference types="cypress" />

describe('User Authentication', () => {
  beforeEach(() => {
    // Reset any previous state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display login page with all required elements', () => {
    cy.visit('/login');
    
    // Check page title
    cy.contains('h2', 'Login').should('be.visible');
    
    // Check form elements
    cy.get('input[id="username"]').should('be.visible');
    cy.get('input[id="password"]').should('be.visible');
    cy.get('button[type="submit"]').contains('Login').should('be.visible');
    
    // Check link to register
    cy.contains('a', 'Create Account').should('be.visible');
  });

  it('should show validation errors for empty form submission', () => {
    cy.visit('/login');
    
    // Submit empty form
    cy.get('button[type="submit"]').click();
    
    // Check for validation errors
    cy.contains('Username is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should show error message for invalid login', () => {
    cy.visit('/login');
    
    // Fill form with incorrect credentials
    cy.get('input[id="username"]').type('invalidusername');
    cy.get('input[id="password"]').type('wrongpassword');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Check for error message
    cy.contains('Invalid username or password').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.visit('/login');
    
    // Intercept the login API call
    cy.intercept('POST', '**/api/users/login', {
      statusCode: 200,
      body: {
        success: true,
        token: 'fake-jwt-token',
        user: {
          _id: 'user123',
          username: 'testuser',
          email: 'testuser@example.com'
        }
      }
    }).as('loginRequest');
    
    // Fill form with valid credentials
    cy.get('input[id="username"]').type('testuser');
    cy.get('input[id="password"]').type('Password123!');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for API call to complete
    cy.wait('@loginRequest');
    
    // Check redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify user data was stored in local storage
    cy.window().its('localStorage.token').should('be.a', 'string');
    cy.window().its('localStorage.user').should('contain', 'testuser');
  });

  it('should navigate to registration page from login', () => {
    cy.visit('/login');
    
    // Click on register link
    cy.contains('a', 'Create Account').click();
    
    // Check URL changed to registration page
    cy.url().should('include', '/create-account');
  });

  it('should display registration page with all required elements', () => {
    cy.visit('/create-account');
    
    // Check page title
    cy.contains('h2', 'Create Account').should('be.visible');
    
    // Check form elements
    cy.get('input[id="username"]').should('be.visible');
    cy.get('input[id="email"]').should('be.visible');
    cy.get('input[id="password"]').should('be.visible');
    cy.get('input[id="confirmPassword"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    
    // Check link back to login
    cy.contains('Sign In').should('be.visible');
  });

  it('should show validation errors on registration page', () => {
    cy.visit('/create-account');
    
    // Fill form with invalid data
    cy.get('input[id="username"]').type('T');
    cy.get('input[id="email"]').type('invalidemail');
    cy.get('input[id="password"]').type('short');
    cy.get('input[id="confirmPassword"]').type('different');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Check for specific validation errors
    cy.contains('Username must be at least 3 characters').should('be.visible');
    cy.contains('Invalid email address').should('be.visible');
    cy.contains('Password must be at least 8 characters').should('be.visible');
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('should register a new user successfully', () => {
    cy.visit('/create-account');
    
    // Intercept the register API call
    cy.intercept('POST', '**/api/users/register', {
      statusCode: 201,
      body: {
        success: true,
        user: {
          _id: 'newuser123',
          username: 'newtestuser',
          email: 'newuser@example.com'
        },
        token: 'fake-jwt-token'
      }
    }).as('registerRequest');
    
    // Fill form with valid data
    cy.get('input[id="username"]').type('newtestuser');
    cy.get('input[id="email"]').type('newuser@example.com');
    cy.get('input[id="password"]').type('Password123!');
    cy.get('input[id="confirmPassword"]').type('Password123!');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for API call to complete
    cy.wait('@registerRequest');
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Account created successfully').should('be.visible');
  });

  it('should show error for existing email on registration', () => {
    cy.visit('/create-account');
    
    // Intercept the register API call with error
    cy.intercept('POST', '**/api/users/register', {
      statusCode: 400,
      body: {
        success: false,
        message: 'Email already exists'
      }
    }).as('registerRequest');
    
    // Fill form with existing email
    cy.get('input[id="username"]').type('existinguser');
    cy.get('input[id="email"]').type('existing@example.com');
    cy.get('input[id="password"]').type('Password123!');
    cy.get('input[id="confirmPassword"]').type('Password123!');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for API call to complete
    cy.wait('@registerRequest');
    
    // Should show error message
    cy.contains('Email already exists').should('be.visible');
  });

  it('should logout successfully', () => {
    // Login first
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'fake-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        _id: 'user123',
        username: 'testuser',
        email: 'testuser@example.com'
      }));
      win.localStorage.setItem('isLoggedIn', 'true');
    });
    
    // Visit dashboard
    cy.visit('/dashboard');
    
    // Find and click logout button
    cy.contains('button', 'Logout').click();
    
    // Should redirect to login page
    cy.url().should('include', '/login');
    
    // Local storage should be cleared
    cy.window().its('localStorage.token').should('be.undefined');
    cy.window().its('localStorage.user').should('be.undefined');
  });
});