export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  status: TaskStatus;
  description?: string;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTodoRequest = {
  title: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  description?: string;
  dueDate?: string;
  tags?: string[];
};

export type UpdateTodoRequest = {
  title?: string;
  completed?: boolean;
  priority?: TaskPriority;
  status?: TaskStatus;
  description?: string;
  dueDate?: string;
  tags?: string[];
};

