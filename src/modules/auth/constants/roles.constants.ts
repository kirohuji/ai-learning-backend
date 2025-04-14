export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.USER, ROLES.GUEST],
  [ROLES.USER]: [ROLES.USER, ROLES.GUEST],
  [ROLES.GUEST]: [ROLES.GUEST],
} as const;

export const DEFAULT_ROLE = ROLES.USER;

export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: '系统管理员',
  [ROLES.USER]: '普通用户',
  [ROLES.GUEST]: '访客',
} as const;
