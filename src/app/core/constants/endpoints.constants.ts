import { inject } from '@angular/core';
import type { Environment } from '~core/tokens/environment.token';
import { ENVIRONMENT } from '~core/tokens/environment.token';

const getAuthEndpoints = (baseUrl: string) => ({
  v1: {
    register: `${baseUrl}/api/User/Register`,
    login: `${baseUrl}/api/User/Login`,
    refreshToken: `${baseUrl}/api/User/RefreshToken`,
  },
});

const getUserEndpoints = (baseUrl: string) => ({
  v1: {
    all: `${baseUrl}/api/User/All`,
    byId: (id: string | number) => `${baseUrl}/api/User/${id}`,
    search: (username: string) => `${baseUrl}/api/User/Search/${encodeURIComponent(username)}`,
  },
});

export const getEndpoints = () => {
  const environment = inject<Environment>(ENVIRONMENT);
  return {
    auth: getAuthEndpoints(environment.apiBaseUrl),
    user: getUserEndpoints(environment.apiBaseUrl),
  } as const;
};
