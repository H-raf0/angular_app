import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TodoService } from '~features/todo/services/todo.service';
import { translations } from '~locale/translations';
import { TrimDirective } from '~shared/directives/trim.directive';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';

@Component({
  selector: 'app-todo-list',
  imports: [ReactiveFormsModule, TrimDirective],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TodoListComponent {
  private readonly todoService = inject(TodoService);
  private readonly formBuilder = inject(FormBuilder);

  readonly translations = translations;
  readonly todos = this.todoService.todos;
  readonly newTodoForm = this.formBuilder.group({
    title: new FormControl<string>('', {
      validators: [Validators.required, Validators.minLength(1)],
      nonNullable: true,
    }),
  });
  readonly isLoading = signal(false);

  get titleControl(): FormControl<string> {
    return this.newTodoForm.get('title') as FormControl<string>;
  }

  addTodo(): void {
    if (this.newTodoForm.invalid) {
      this.newTodoForm.markAllAsTouched();
      return;
    }

    const title = this.titleControl.value.trim();
    if (!title) return;

    this.todoService.createTodo({ title });
    this.newTodoForm.reset();
  }

  toggleTodo(id: string): void {
    this.todoService.toggleTodo(id);
  }

  deleteTodo(id: string): void {
    this.todoService.deleteTodo(id);
  }

  updateTodoTitle(id: string, newTitle: string): void {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      this.deleteTodo(id);
      return;
    }
    this.todoService.updateTodo(id, { title: trimmedTitle });
  }

  getCompletedCount(): number {
    return this.todos().filter((todo) => todo.completed).length;
  }

  getTotalCount(): number {
    return this.todos().length;
  }
}

