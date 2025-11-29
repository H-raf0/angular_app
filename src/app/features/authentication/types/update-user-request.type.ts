import type { Language } from '~core/enums/language.enum';

export type UpdateUserRequest = {
  name?: string;
  language?: Language;
  email?: string;
  password: string;
};
