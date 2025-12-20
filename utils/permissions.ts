export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  SHIFT_MANAGER = 'SHIFT_MANAGER',
  ASSISTANT_MANAGER = 'ASSISTANT_MANAGER',
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  CEO = 'CEO',
  FOUNDER = 'FOUNDER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

const ROLE_HIERARCHY = {
  EMPLOYEE: 1,
  SHIFT_MANAGER: 2,
  ASSISTANT_MANAGER: 3,
  GENERAL_MANAGER: 4,
  CEO: 4,
  FOUNDER: 5,
  ADMIN: 5,
  OWNER: 5,
};

/**
 * Check if a user has the minimum required role level
 */
function hasMinimumRole(userRole: string | undefined, minimumRole: UserRole): boolean {
  const level = ROLE_HIERARCHY[userRole as UserRole] || 0;
  return level >= ROLE_HIERARCHY[minimumRole];
}

export function canCreateItems(userRole?: string): boolean {
  return hasMinimumRole(userRole, UserRole.GENERAL_MANAGER);
}

export function canManageEmployees(userRole?: string): boolean {
  return hasMinimumRole(userRole, UserRole.GENERAL_MANAGER);
}

export function canManageWarehouses(userRole?: string): boolean {
  return hasMinimumRole(userRole, UserRole.GENERAL_MANAGER);
}
