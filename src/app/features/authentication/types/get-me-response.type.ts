import type { User } from '~features/authentication/types/user.type';

export type GetMeResponseData = {
  user: User;
};

export type GetMeResponse = GetMeResponseData;
