import { effect, inject, Injectable, signal } from '@angular/core';
import { LOCAL_STORAGE } from '~core/providers/local-storage';
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TaskPriority,
  TaskStatus,
} from '~features/todo/types/todo.type';
import { TaskPriority as TaskPriorityEnum, TaskStatus as TaskStatusEnum } from '~features/todo/types/todo.type';

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
      priority: request.priority ?? TaskPriorityEnum.MEDIUM,
      status: request.status ?? TaskStatusEnum.NOT_STARTED,
      ...(request.description && { description: request.description.trim() }),
      ...(request.dueDate && { dueDate: request.dueDate }),
      tags: request.tags ?? [],
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
      ...(request.priority !== undefined && { priority: request.priority }),
      ...(request.status !== undefined && { status: request.status }),
      ...(request.description !== undefined && { description: request.description?.trim() }),
      ...(request.dueDate !== undefined && { dueDate: request.dueDate }),
      ...(request.tags !== undefined && { tags: request.tags }),
      updatedAt: new Date().toISOString(),
    };

    // Sync completed status with TaskStatus
    if (request.completed !== undefined) {
      if (request.completed && updatedTodo.status !== TaskStatusEnum.COMPLETED) {
        updatedTodo.status = TaskStatusEnum.COMPLETED;
      } else if (!request.completed && updatedTodo.status === TaskStatusEnum.COMPLETED) {
        updatedTodo.status = TaskStatusEnum.NOT_STARTED;
      }
    }

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

    const newCompleted = !todo.completed;
    return this.updateTodo(id, {
      completed: newCompleted,
      status: newCompleted ? TaskStatusEnum.COMPLETED : TaskStatusEnum.NOT_STARTED,
    });
  }

  getTasksByPriority(priority: TaskPriority): Todo[] {
    return this._todos().filter((todo) => todo.priority === priority);
  }

  getTasksByStatus(status: TaskStatus): Todo[] {
    return this._todos().filter((todo) => todo.status === status);
  }

  getTasksByTag(tag: string): Todo[] {
    return this._todos().filter((todo) => todo.tags.includes(tag));
  }

  getOverdueTasks(): Todo[] {
    const now = new Date().toISOString();
    return this._todos().filter(
      (todo) => todo.dueDate && !todo.completed && todo.dueDate < now,
    );
  }

  getAllTags(): string[] {
    const allTags = this._todos().flatMap((todo) => todo.tags);
    return Array.from(new Set(allTags)).sort();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadTodosFromStorage(): Todo[] {
    try {
      const stored = this.storageService?.getItem(TODOS_STORAGE_KEY);
      if (!stored) return [];
      const todos = JSON.parse(stored) as Todo[];
      // Migrate old todos to new format
      return todos.map((todo) => this.migrateTodo(todo));
    } catch {
      return [];
    }
  }

  private migrateTodo(todo: Partial<Todo> & { id: string; title: string; completed: boolean }): Todo {
    return {
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      priority: todo.priority ?? TaskPriorityEnum.MEDIUM,
      status: todo.status ?? (todo.completed ? TaskStatusEnum.COMPLETED : TaskStatusEnum.NOT_STARTED),
      ...(todo.description && { description: todo.description }),
      ...(todo.dueDate && { dueDate: todo.dueDate }),
      tags: todo.tags ?? [],
      createdAt: todo.createdAt ?? new Date().toISOString(),
      updatedAt: todo.updatedAt ?? new Date().toISOString(),
    };
  }

  private saveTodosToStorage(todos: Todo[]): void {
    try {
      this.storageService?.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Storage might be full or unavailable, ignore
    }
  }
}

