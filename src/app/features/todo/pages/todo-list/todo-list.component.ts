import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TodoService } from '~features/todo/services/todo.service';
import { translations } from '~locale/translations';
import { TrimDirective } from '~shared/directives/trim.directive';
import type { TaskPriority, TaskStatus, UpdateTodoRequest } from '~features/todo/types/todo.type';
import { TaskPriority as TaskPriorityEnum, TaskStatus as TaskStatusEnum } from '~features/todo/types/todo.type';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';

// Type declaration for $localize (provided by @angular/localize)
declare const $localize: typeof import('@angular/localize').loadTranslations extends (...args: any[]) => any
  ? (template: TemplateStringsArray, ...substitutions: any[]) => string
  : (template: TemplateStringsArray, ...substitutions: any[]) => string;

type SortField = 'priority' | 'dueDate' | 'createdAt' | 'status' | 'title';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-todo-list',
  imports: [ReactiveFormsModule, TrimDirective, CommonModule],
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
  readonly TaskPriorityEnum = TaskPriorityEnum;
  readonly TaskStatusEnum = TaskStatusEnum;

  // Form controls
  readonly newTodoForm = this.formBuilder.group({
    title: new FormControl<string>('', {
      validators: [Validators.required, Validators.minLength(1)],
      nonNullable: true,
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    priority: new FormControl<TaskPriority>(TaskPriorityEnum.MEDIUM, { nonNullable: true }),
    status: new FormControl<TaskStatus>(TaskStatusEnum.NOT_STARTED, { nonNullable: true }),
    dueDate: new FormControl<string>('', { nonNullable: true }),
    tags: new FormArray<FormControl<string>>([]),
    newTag: new FormControl<string>('', { nonNullable: true }),
  });
  readonly showAdvancedForm = signal(false);
  readonly isLoading = signal(false);

  // Filter signals
  readonly filterPriority = signal<TaskPriority | 'all'>('all');
  readonly filterStatus = signal<TaskStatus | 'all'>('all');
  readonly filterTag = signal<string>('all');
  readonly searchQuery = signal<string>('');

  // Sort signals
  readonly sortField = signal<SortField>('createdAt');
  readonly sortDirection = signal<SortDirection>('desc');

  // Available options
  readonly availableTags = computed(() => this.todoService.getAllTags());

  // Computed filtered and sorted tasks
  readonly filteredTasks = computed(() => {
    let tasks = this.todos();

    // Apply priority filter
    if (this.filterPriority() !== 'all') {
      tasks = tasks.filter((task) => task.priority === this.filterPriority());
    }

    // Apply status filter
    if (this.filterStatus() !== 'all') {
      tasks = tasks.filter((task) => task.status === this.filterStatus());
    }

    // Apply tag filter
    if (this.filterTag() !== 'all') {
      tasks = tasks.filter((task) => task.tags.includes(this.filterTag()));
    }

    // Apply search query
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    return tasks;
  });

  readonly sortedTasks = computed(() => {
    const tasks = [...this.filteredTasks()];
    const field = this.sortField();
    const direction = this.sortDirection();

    tasks.sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case 'priority':
          const priorityOrder = {
            [TaskPriorityEnum.HIGH]: 3,
            [TaskPriorityEnum.MEDIUM]: 2,
            [TaskPriorityEnum.LOW]: 1,
          };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = a.dueDate.localeCompare(b.dueDate);
          break;
        case 'createdAt':
          comparison = a.createdAt.localeCompare(b.createdAt);
          break;
        case 'status':
          const statusOrder = {
            [TaskStatusEnum.NOT_STARTED]: 1,
            [TaskStatusEnum.IN_PROGRESS]: 2,
            [TaskStatusEnum.BLOCKED]: 3,
            [TaskStatusEnum.COMPLETED]: 4,
          };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return tasks;
  });

  get titleControl(): FormControl<string> {
    return this.newTodoForm.get('title') as FormControl<string>;
  }

  get descriptionControl(): FormControl<string> {
    return this.newTodoForm.get('description') as FormControl<string>;
  }

  get priorityControl(): FormControl<TaskPriority> {
    return this.newTodoForm.get('priority') as FormControl<TaskPriority>;
  }

  get statusControl(): FormControl<TaskStatus> {
    return this.newTodoForm.get('status') as FormControl<TaskStatus>;
  }

  get dueDateControl(): FormControl<string> {
    return this.newTodoForm.get('dueDate') as FormControl<string>;
  }

  get tagsArray(): FormArray<FormControl<string>> {
    return this.newTodoForm.get('tags') as FormArray<FormControl<string>>;
  }

  get newTagControl(): FormControl<string> {
    return this.newTodoForm.get('newTag') as FormControl<string>;
  }

  addTodo(): void {
    if (this.newTodoForm.invalid || !this.titleControl.value.trim()) {
      this.newTodoForm.markAllAsTouched();
      return;
    }

    const tags = this.tagsArray.controls.map((control) => control.value.trim()).filter((tag) => tag);

    const description = this.descriptionControl.value.trim();
    const dueDate = this.dueDateControl.value;

    this.todoService.createTodo({
      title: this.titleControl.value.trim(),
      ...(description && { description }),
      priority: this.priorityControl.value,
      status: this.statusControl.value,
      ...(dueDate && { dueDate }),
      tags,
    });

    this.newTodoForm.reset({
      title: '',
      description: '',
      priority: TaskPriorityEnum.MEDIUM,
      status: TaskStatusEnum.NOT_STARTED,
      dueDate: '',
      newTag: '',
    });
    this.tagsArray.clear();
    this.showAdvancedForm.set(false);
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

  updateTodoField(id: string, field: keyof UpdateTodoRequest, value: unknown): void {
    this.todoService.updateTodo(id, { [field]: value });
  }

  addTag(): void {
    const tagValue = this.newTagControl.value.trim();
    if (!tagValue) return;

    // Check if tag already exists
    const existingTags = this.tagsArray.controls.map((control) => control.value.trim().toLowerCase());
    if (existingTags.includes(tagValue.toLowerCase())) {
      this.newTagControl.setValue('');
      return;
    }

    this.tagsArray.push(this.formBuilder.control(tagValue, { nonNullable: true }));
    this.newTagControl.setValue('');
  }

  removeTag(index: number): void {
    this.tagsArray.removeAt(index);
  }

  onTagKeyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      this.addTag();
    }
  }

  toggleAdvancedForm(): void {
    this.showAdvancedForm.update((v) => !v);
  }

  clearFilters(): void {
    this.filterPriority.set('all');
    this.filterStatus.set('all');
    this.filterTag.set('all');
    this.searchQuery.set('');
  }

  toggleSortDirection(): void {
    this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
  }

  getCompletedCount(): number {
    return this.todos().filter((todo) => todo.completed).length;
  }

  getTotalCount(): number {
    return this.todos().length;
  }

  getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriorityEnum.HIGH:
        return 'danger';
      case TaskPriorityEnum.MEDIUM:
        return 'warning';
      case TaskPriorityEnum.LOW:
        return 'primary';
      default:
        return 'neutral';
    }
  }

  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatusEnum.COMPLETED:
        return 'success';
      case TaskStatusEnum.IN_PROGRESS:
        return 'primary';
      case TaskStatusEnum.BLOCKED:
        return 'danger';
      case TaskStatusEnum.NOT_STARTED:
        return 'neutral';
      default:
        return 'neutral';
    }
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !this.todos().find((t) => t.dueDate === dueDate)?.completed;
  }


  getPriorityLabel(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriorityEnum.HIGH:
        return $localize`High Priority`;
      case TaskPriorityEnum.MEDIUM:
        return $localize`Medium Priority`;
      case TaskPriorityEnum.LOW:
        return $localize`Low Priority`;
    }
  }

  getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatusEnum.NOT_STARTED:
        return $localize`Not Started`;
      case TaskStatusEnum.IN_PROGRESS:
        return $localize`In Progress`;
      case TaskStatusEnum.COMPLETED:
        return $localize`Completed`;
      case TaskStatusEnum.BLOCKED:
        return $localize`Blocked`;
    }
  }
}

