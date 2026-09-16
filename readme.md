# todo-angular

TodoMVC's Angular 21 example, wired to persist to a real server instead of a field in memory.

This is the **"before" state of a migration case study**: this application is being migrated to
Svelte, and the point of the exercise is to show that everything continues to work.

## Provenance

The application is derived from [`tastejs/todomvc`](https://github.com/tastejs/todomvc)
`examples/angular`, at commit `ff43b02e59dfa604386bb382034b2cd07c2bcd8a`. Upstream has no
repository-level LICENSE and GitHub reports `NOASSERTION`; this derivative is kept for internal
case-study use with the origin stated here and in each changed file. Nothing from TodoMVC's test
suite is vendored — `conformance/` fetches it at a pinned commit.

## What was changed, and why each change was forced

Four files. The rest of the example is untouched, deliberately: a migration story is worth less
when the "before" state has been quietly redesigned to make the "after" easy.

| file | change | why |
|---|---|---|
| `src/app/todos.service.ts` | rewritten — a signal-backed cache over the Todo-Backend API | upstream held a plain array that dies with the tab |
| `src/app/api.config.ts` | new — `API_BASE_URL` injection token | the one seam a port to another framework must reproduce deliberately |
| `src/app/todo-item/todo-item.component.ts` | toggling and editing now tell the service | upstream mutated the todo it was handed and told nobody, which is harmless in a field and invisible data loss against a server |
| `package.json` | `conformance` scripts | — |

### The one that is worth knowing about

Angular 21 is **zoneless by default**, so change detection runs on events — and a promise settling
is not an event. Measured with a plain array: the initial `GET` returned `200` with two todos and
the service held them, while `.todo-list li` stayed at `0` until an unrelated keystroke forced a
pass. The list is a `signal` for that reason, not for fashion. Introducing a network boundary is
what forced it, and the Svelte port will have to solve the same problem with its own reactivity.

## Running it

```bash
npm install
npm run build
# with trantor-ai-labs/todo-backend-java running on :8081
npx http-server dist/browser -p 8000
```

The API location defaults to `http://localhost:8081` and can be overridden at runtime with
`window.__TODO_API__`, so a built bundle can be pointed elsewhere without a rebuild.

## Verifying it

See [`conformance/README.md`](conformance/README.md). Two suites: TodoMVC's own 31-test
framework-agnostic browser spec (**not ours**, fetched pinned, and the control for the migration),
and a 3-test server-persistence suite that covers what the upstream spec structurally cannot —
including *a second browser session sees the same todos*, which `localStorage` can never satisfy.

Both must pass identically against the Svelte application, with no edit to either spec.
