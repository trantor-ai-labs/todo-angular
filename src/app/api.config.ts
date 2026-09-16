import { InjectionToken } from '@angular/core';

/**
 * Where the Todo-Backend service lives.
 *
 * Defaults to the same origin the page came from, under `/api`, and that default is load-bearing
 * rather than tidy. The alternative — an absolute URL baked in or injected at container start —
 * has to answer "what hostname is the backend reachable as?", and there is no single answer: a
 * person browsing from their laptop says `localhost`, a browser inside the conformance network
 * says the service name, and a deployed demo says something else again. Same-origin makes the
 * question disappear; the reverse proxy in front of the app answers it once.
 *
 * `window.__TODO_API__` overrides it for running the app outside a proxy (`ng serve` against a
 * backend on :8081).
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => (globalThis as { __TODO_API__?: string }).__TODO_API__ ?? '/api',
});
