import {
  AUTHENTICATION_PATHS,
  ERROR_PATHS,
  ROOT_PATHS,
  TODO_PATHS,
  USER_PATHS,
} from '~core/constants/paths.constants';

export const ROOT_URLS = {
  home: `/${ROOT_PATHS.home}`,
};

export const AUTH_URLS = {
  logIn: `/${AUTHENTICATION_PATHS.base}/${AUTHENTICATION_PATHS.logIn}`,
  register: `/${AUTHENTICATION_PATHS.base}/${AUTHENTICATION_PATHS.register}`,
  myAccount: `/${AUTHENTICATION_PATHS.base}/${AUTHENTICATION_PATHS.myAccount}`,
};

export const TODO_URLS = {
  list: `/${TODO_PATHS.base}`,
};

export const USER_URLS = {
  todos: `/${USER_PATHS.base}/${USER_PATHS.todos}`,
};

export const ERROR_URLS = {
  notFound: `/${ERROR_PATHS.base}/${ERROR_PATHS.notFound}`,
};
