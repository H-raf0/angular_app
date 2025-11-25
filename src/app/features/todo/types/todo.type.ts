export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTodoRequest = {
  title: string;
};

export type UpdateTodoRequest = {
  title?: string;
  completed?: boolean;
};

