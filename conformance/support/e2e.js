/**
 * Test isolation for a server-backed TodoMVC.
 *
 * TodoMVC's spec isolates its tests by clearing `localStorage` — which is correct for every
 * implementation it was written against, and does nothing here. Measured without the reset below:
 * 17 todos accumulated across one run and 10 of 29 tests failed on state from earlier tests, while
 * the application was behaving correctly.
 *
 * So the fixture is reset where this app actually keeps its state. This is not an edit to the
 * spec — the spec runs byte-identical to upstream, and the same reset serves the Svelte build
 * without modification, so it stays fair across both halves of the migration.
 */

const API = Cypress.env('api') || 'http://localhost:8081';

beforeEach(() => {
  cy.request('DELETE', `${API}/`);
});

// TodoMVC's own spec depends on commands its support file registers (createTodo,
// createDefaultTodos). Fetched alongside the spec by ./fetch-upstream-spec.sh.
try {
  require('../todomvc/cypress/support/e2e.js');
} catch {
  // Upstream support not fetched: the persistence suite defines everything it needs itself.
}
