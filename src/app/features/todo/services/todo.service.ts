import { effect, inject, Injectable, signal } from '@angular/core';
import { LOCAL_STORAGE } from '~core/providers/local-storage';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '~features/todo/types/todo.type';

const TODOS_STORAGE_KEY = 'todos';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private readonly storageService = inject(LOCAL_STORAGE);
  private readonly _todos = signal<Todo[]>(this.loadTodosFromStorage());

  readonly todos = this._todos.asReadonly();

  constructor() {
    // Save to storage whenever todos change
    effect(() => {
      const todos = this._todos();
      this.saveTodosToStorage(todos);
    });
  }

  getAllTodos(): Todo[] {
    return this._todos();
  }

  getTodoById(id: string): Todo | undefined {
    return this._todos().find((todo) => todo.id === id);
  }

  createTodo(request: CreateTodoRequest): Todo {
    const newTodo: Todo = {
      id: this.generateId(),
      title: request.title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this._todos.update((todos) => [...todos, newTodo]);
    return newTodo;
  }

  updateTodo(id: string, request: UpdateTodoRequest): Todo | null {
    const todo = this.getTodoById(id);
    if (!todo) return null;

    const updatedTodo: Todo = {
      ...todo,
      ...(request.title !== undefined && { title: request.title.trim() }),
      ...(request.completed !== undefined && { completed: request.completed }),
      updatedAt: new Date().toISOString(),
    };

    this._todos.update((todos) =>
      todos.map((t) => (t.id === id ? updatedTodo : t)),
    );
    return updatedTodo;
  }

  deleteTodo(id: string): boolean {
    const todo = this.getTodoById(id);
    if (!todo) return false;

    this._todos.update((todos) => todos.filter((t) => t.id !== id));
    return true;
  }

  toggleTodo(id: string): Todo | null {
    const todo = this.getTodoById(id);
    if (!todo) return null;

    return this.updateTodo(id, { completed: !todo.completed });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadTodosFromStorage(): Todo[] {
    try {
      const stored = this.storageService?.getItem(TODOS_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as Todo[];
    } catch {
      return [];
    }
  }

  private saveTodosToStorage(todos: Todo[]): void {
    try {
      this.storageService?.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Storage might be full or unavailable, ignore
    }
  }
}

