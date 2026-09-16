import { Injectable, computed, inject, signal } from '@angular/core';
import { API_BASE_URL } from './api.config';

export interface Todo {
  /** Server-assigned. Absent only for the brief window before a POST returns. */
  id?: number;
  /** What the server believes it is reachable as. Recorded, but not used to address it — see `at`. */
  url?: string;
  title: string;
  completed: boolean;
  order?: number;
}

/**
 * Todos held on the server, not in the browser.
 *
 * The upstream TodoMVC Angular example keeps a plain in-memory array that dies with the tab, which
 * is why TodoMVC's own Cypress spec lists `angular` (and `svelte`) under `noLocalStorageCheck` and
 * skips `should persist its data`. This estate wires both ends to a real Todo-Backend service, so
 * that test stops being skipped and becomes the thing that proves a front-end migration preserved
 * behaviour across a network boundary.
 *
 * Three properties are deliberate:
 *
 *   State is a signal, because this application is zoneless — the Angular 21 default. Change
 *   detection is driven by events, and a promise settling is not one. Measured with a plain array:
 *   the initial GET returned 200 with two todos and the service held them, while `.todo-list li`
 *   stayed at 0 until an unrelated keystroke forced a pass. Reactivity has to be declared now that
 *   state can arrive from the network.
 *
 *   Reads stay synchronous. Components read through `getItems()` during change detection, so the
 *   signal is the render source and the network is never on that path. Making reads async would
 *   have meant rewriting all four components, and a migration case study is worth less when the
 *   "before" state has been quietly redesigned to make the "after" easy.
 *
 *   Writes are optimistic. The local list changes first and the request follows, so the UI stays
 *   as responsive as the upstream in-memory version. A failed request reloads from the server
 *   rather than leaving the screen lying about what was saved.
 */
@Injectable({ providedIn: 'root' })
export class TodosService {
  private base = inject(API_BASE_URL);

  private items = signal<Todo[]>([]);

  /**
   * Address a todo through the base this client was configured with, not through the `url` the
   * server put in the payload.
   *
   * The Todo-Backend spec requires the server to emit a `url`, and it does. But that URL encodes
   * the hostname the *server* thinks it has, which is not necessarily one the *browser* can
   * resolve — the same payload is wrong for a laptop, a test network and a deployment. The id is
   * the stable part.
   */
  private at(todo: Todo): string | null {
    if (todo.id == null) return todo.url ?? null;
    return `${this.base.replace(/\/$/, '')}/${todo.id}`;
  }

  /** Read-only view for anything that wants the whole list reactively. */
  readonly all = computed(() => this.items());

  constructor() {
    void this.reload();
  }

  /** The server is the source of truth; this is how the local list is re-truthed. */
  async reload(): Promise<void> {
    try {
      const res = await fetch(this.base, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`GET ${this.base} -> ${res.status}`);
      this.items.set((await res.json()) as Todo[]);
    } catch (err) {
      console.error('todo-backend unreachable; showing what is cached locally', err);
    }
  }

  addItem(title: string): void {
    const todo: Todo = { title, completed: false };
    this.items.set([...this.items(), todo]);
    void this.send('POST', this.base, { title, completed: false }).then((saved) => {
      // Mutate the object the list already holds rather than replacing it: `@for` tracks todos by
      // identity, so swapping the object would detach the <li> the user may already be editing.
      if (saved) Object.assign(todo, saved);
      this.touch();
    });
  }

  removeItem(todo: Todo): void {
    this.items.set(this.items().filter((t) => t !== todo));
    const url = this.at(todo);
    if (url) void this.send('DELETE', url);
  }

  /** Called after a component has already mutated the todo it holds. */
  update(todo: Todo): void {
    this.touch();
    const url = this.at(todo);
    if (!url) return;
    void this.send('PATCH', url, { title: todo.title, completed: todo.completed });
  }

  clearCompleted(): void {
    const doomed = this.items().filter((todo) => todo.completed);
    this.items.set(this.items().filter((todo) => !todo.completed));
    for (const todo of doomed) {
      const url = this.at(todo);
      if (url) void this.send('DELETE', url);
    }
  }

  toggleAll(completed: boolean): void {
    for (const todo of this.items()) {
      todo.completed = completed;
      const url = this.at(todo);
      if (url) void this.send('PATCH', url, { title: todo.title, completed });
    }
    this.touch();
  }

  getItems(type = 'all'): Todo[] {
    const todos = this.items();
    switch (type) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
    }

    return todos;
  }

  /**
   * Re-publish the list after a todo was mutated in place.
   *
   * The array identity changes so the signal notifies; the todo identities do not, so `@for`'s
   * `track todo` keeps every existing <li> exactly where it was.
   */
  private touch(): void {
    this.items.set([...this.items()]);
  }

  private async send(method: string, url: string, body?: unknown): Promise<Todo | null> {
    try {
      const res = await fetch(url, {
        method,
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}`);
      return method === 'DELETE' ? null : ((await res.json()) as Todo);
    } catch (err) {
      // The screen is now ahead of the server. Re-reading is the only honest repair:
      // it either confirms the optimistic change or visibly undoes it.
      console.error(`${method} ${url} failed; reloading from the server`, err);
      void this.reload();
      return null;
    }
  }
}
