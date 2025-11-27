import type { User } from '~features/authentication/types/user.type';

export type RegisterResponseData = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type RegisterResponse = RegisterResponseData;
