# Conformance

Two suites run against this application. Only one of them is ours, and that is the point.

## 1. TodoMVC's own browser spec — 31 tests, not ours

`cypress/e2e/spec.cy.js` from [tastejs/todomvc](https://github.com/tastejs/todomvc) is
framework-agnostic: it takes `--env framework=<name>` and drives any TodoMVC implementation
through the same 31 assertions. It is **fetched, never vendored** — the upstream repository has
no root LICENSE and GitHub reports `NOASSERTION`, so we point at it rather than copy it.

It is the migration's control. The same 31 tests must pass against the Angular application and
against the Svelte one, with no edit to the spec, or the migration changed behaviour.

**One of the 31 is skipped here, and it is skipped upstream too.** `should persist its data`
asserts on `localStorage` contents directly — `checkTodosInLocalStorage`,
`checkNumberOfCompletedTodosInLocalStorage` — so it only means anything for apps that persist
in the browser. TodoMVC lists both `angular` and `svelte` under `noLocalStorageCheck` for exactly
that reason. A server-backed app fails those assertions *while persisting correctly*, so the
honest thing is to leave it skipped and prove persistence separately.

## 2. Server persistence — 3 tests, ours, and clearly labelled

`e2e/persistence.cy.js` covers what the upstream test cannot, because it asserts something
`localStorage` is structurally incapable of:

| test | why it cannot be faked in the browser |
|---|---|
| a todo survives a reload | the weakest claim; localStorage would also pass |
| a second browser session sees the same todos | localStorage is per-origin, per-profile — this can only pass against a shared server |
| a todo created over the API appears in the UI | proves the UI reads the same store the API writes, not a parallel copy |

The second one is the one to show someone. It is the difference between "the page remembered"
and "the data is on the server", and it must hold identically before and after the migration.

## Running

```bash
npm run conformance        # both suites, headless
```

The script starts the Java backend, serves `dist/browser` under the path layout TodoMVC's spec
expects, fetches the upstream spec, and runs both.
