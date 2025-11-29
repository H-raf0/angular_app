import type { Language } from '~core/enums/language.enum';

export type UpdateUserRequest = {
  // Backend expects `Username` / `username` field. Use `username` here so
  // the API receives the expected property.
  username?: string;
  language?: Language;
  email?: string;
  password: string;
};
