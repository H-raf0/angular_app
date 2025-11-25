import type { Route } from '@angular/router';
import { TodoListComponent } from '~features/todo/pages/todo-list/todo-list.component';

export const TODO_ROUTES: Route[] = [
  {
    path: '', // Empty because parent route already has 'todo'
    component: TodoListComponent,
  },
];

