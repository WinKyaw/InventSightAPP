export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  SHIFT_MANAGER = 'SHIFT_MANAGER',
  ASSISTANT_MANAGER = 'ASSISTANT_MANAGER',
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  OWNER = 'OWNER',
}

const ROLE_HIERARCHY = {
  EMPLOYEE: 1,
  SHIFT_MANAGER: 2,
  ASSISTANT_MANAGER: 3,
  GENERAL_MANAGER: 4,
  OWNER: 5,
};

export function canCreateItems(userRole?: string): boolean {
  const level = ROLE_HIERARCHY[userRole as UserRole] || 0;
  return level >= ROLE_HIERARCHY.GENERAL_MANAGER;
}

export function canManageEmployees(userRole?: string): boolean {
  const level = ROLE_HIERARCHY[userRole as UserRole] || 0;
  return level >= ROLE_HIERARCHY.GENERAL_MANAGER;
}

export function canManageWarehouses(userRole?: string): boolean {
  const level = ROLE_HIERARCHY[userRole as UserRole] || 0;
  return level >= ROLE_HIERARCHY.GENERAL_MANAGER;
}
