import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // Make sure this matches your frontend server port
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000
  },
  env: {
    apiUrl: 'http://localhost:5002/api'
  },
  retries: {
    runMode: 2,
    openMode: 0
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite' // Change to vite if you're using Vite
    },
    supportFile: 'cypress/support/component.js',
    specPattern: 'cypress/component/**/*.cy.{js,jsx}',
    indexHtmlFile: 'cypress/support/component-index.html'
  }
});