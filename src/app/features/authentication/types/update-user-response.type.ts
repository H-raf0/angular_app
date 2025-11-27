import type { User } from '~features/authentication/types/user.type';

export type UpdateUserResponseData = {
  user: User;
};

export type UpdateUserResponse = UpdateUserResponseData;
