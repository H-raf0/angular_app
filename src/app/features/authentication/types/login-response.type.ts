import type { User } from '~features/authentication/types/user.type';

export type LoginResponseData = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type LoginResponse = LoginResponseData;
