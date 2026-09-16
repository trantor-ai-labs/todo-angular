import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewChecked, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Todo, TodosService } from '../todos.service';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './todo-item.component.html',
})
export class TodoItemComponent implements AfterViewChecked {
  // Upstream this component mutated the todo it was handed and told nobody. That was harmless
  // when the list lived in a field; with a server behind it, an unannounced mutation is a change
  // the user can see and the backend never hears about.
  private todosService = inject(TodosService);

  @Input({ required: true }) todo!: Todo;

  @Output() remove = new EventEmitter<Todo>();

  @ViewChild('todoInputRef') inputRef?: ElementRef<HTMLInputElement>;

  title = '';
  isEditing = false;

  // Track which edit session we've already focused so we don't re-focus
  // on every change-detection pass while editing.
  private focusedFor: Todo | null = null;

  toggleTodo(): void {
    this.todo.completed = !this.todo.completed;
    this.todosService.update(this.todo);
  }

  removeTodo(): void {
    this.remove.emit(this.todo);
  }

  startEdit(): void {
    this.isEditing = true;
  }

  handleFocus(_event: Event): void {
    this.title = this.todo.title;
  }

  commitEdit(): void {
    if (!this.isEditing) return;
    const text = this.title.trim();
    this.isEditing = false;
    if (text.length === 0) {
      this.remove.emit(this.todo);
    } else {
      this.todo.title = text;
      this.todosService.update(this.todo);
    }
  }

  cancelEdit(): void {
    this.title = this.todo.title;
    this.isEditing = false;
  }

  ngAfterViewChecked(): void {
    if (this.isEditing && this.focusedFor !== this.todo) {
      this.inputRef?.nativeElement.focus();
      this.focusedFor = this.todo;
    } else if (!this.isEditing && this.focusedFor) {
      this.focusedFor = null;
    }
  }
}
