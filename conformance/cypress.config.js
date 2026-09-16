const { defineConfig } = require('cypress');

/**
 * Serves the built app at the path layout TodoMVC's own spec expects, so that spec runs unedited.
 * `--env framework=angular` keeps upstream's localStorage-coupled persistence test skipped, which
 * is correct for a server-backed app; `e2e/persistence.cy.js` covers that ground instead.
 */
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8000/examples/angular/dist/browser',
    specPattern: ['e2e/**/*.cy.js', 'todomvc/cypress/e2e/**/*.cy.js'],
    supportFile: 'support/e2e.js',
    viewportWidth: 890,
    includeShadowDom: true,
    video: false,
    screenshotOnRunFailure: false,
  },
});
