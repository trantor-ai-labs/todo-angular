/**
 * Server persistence — the part TodoMVC's own spec cannot assert.
 *
 * Upstream's `should persist its data` reads `localStorage` directly, so it is skipped for every
 * app that keeps its state elsewhere (TodoMVC lists both `angular` and `svelte` under
 * `noLocalStorageCheck`). These three tests assert the same intent against the actual store, and
 * the second asserts something `localStorage` is structurally incapable of doing.
 *
 * They must pass identically before and after the Angular -> Svelte migration. They are the
 * evidence for "everything continues to work": not that the UI still renders, but that the data
 * still lives where it lived, reachable by the same contract.
 *
 * Every test waits on the write request before reloading. The UI is optimistic — the todo appears
 * the instant it is typed, well before the POST lands — so asserting on the DOM and reloading
 * immediately races the network and fails against a correct application. Measured: reloading on
 * the DOM assertion alone failed 2 of 3 of these while the app was working. What has to be waited
 * for is the server acknowledging the write, which is the whole thing under test.
 */

const API = Cypress.env('api') || 'http://localhost:8081';

// The path the built app is served at, matching TodoMVC's own layout convention so both specs can
// share one baseUrl. Pointing this at the Svelte build is the only change these tests need to
// become the "after" half of the migration — which is the point of keeping them framework-blind.
const APP = '/' + (Cypress.env('app') || 'angular/dist/browser');

beforeEach(() => {
  cy.request('DELETE', `${API}/`);
});

describe('server persistence', () => {
  it('a todo survives a reload', () => {
    cy.intercept('POST', '**/api*').as('create');
    cy.visit(APP);
    cy.get('.new-todo').type('survive a reload{enter}');
    cy.wait('@create').its('response.statusCode').should('eq', 200);

    cy.reload();

    // No interaction after the reload: if the app only re-rendered on a keystroke, this fails.
    cy.get('.todo-list li').should('have.length', 1);
    cy.get('.todo-list li label').should('contain', 'survive a reload');
  });

  it('a second browser session sees the same todos', () => {
    cy.intercept('POST', '**/api*').as('create');
    cy.visit(APP);
    cy.get('.new-todo').type('written by session one{enter}');
    cy.wait('@create').its('response.statusCode').should('eq', 200);

    // Clear everything the browser could be remembering. localStorage, sessionStorage and cookies
    // are all per-origin browser state; if the todo comes back after this, it was never in the
    // browser. No amount of client-side storage can pass this test.
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => win.sessionStorage.clear());

    cy.visit(APP);
    cy.get('.todo-list li label').should('contain', 'written by session one');
  });

  it('a todo created over the API appears in the UI', () => {
    cy.request('POST', `${API}/`, { title: 'created by the API', completed: false });

    cy.visit(APP);

    // Proves the UI reads the store the API writes, rather than keeping a parallel copy that
    // happens to agree because the same client wrote both.
    cy.get('.todo-list li label').should('contain', 'created by the API');
  });
});
