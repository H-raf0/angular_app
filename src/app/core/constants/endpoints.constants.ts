import { inject } from '@angular/core';
import type { Environment } from '~core/tokens/environment.token';
import { ENVIRONMENT } from '~core/tokens/environment.token';

const getAuthEndpoints = (baseUrl: string) => ({
  v1: {
    authentication: `${baseUrl}/v1/authentication`,
    login: `${baseUrl}/v1/authentication/login`,
    refreshToken: `${baseUrl}/v1/authentication/token/refresh`,
  },
});

const getUserEndpoints = (baseUrl: string) => ({
  v1: {
    user: `${baseUrl}/v1/user`,
  },
});

export const getEndpoints = () => {
  const environment = inject<Environment>(ENVIRONMENT);
  return {
    auth: getAuthEndpoints(environment.apiBaseUrl),
    user: getUserEndpoints(environment.apiBaseUrl),
  } as const;
};
