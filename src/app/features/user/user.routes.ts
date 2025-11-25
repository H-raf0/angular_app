import type { Route } from '@angular/router';
import { TODO_URLS } from '~core/constants/urls.constants';

export const USER_ROUTES: Route[] = [
  { path: '', redirectTo: TODO_URLS.list, pathMatch: 'full' },
];
