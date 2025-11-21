import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// Define role hierarchy
export enum Role {
  STAFF = 'staff',
  CASHIER = 'cashier',
  SHIFT_MANAGER = 'shift_manager',
  ASSISTANT_MANAGER = 'assistant_manager',
  GENERAL_MANAGER = 'general_manager',
  ADMIN = 'admin',
}

// Define permissions
export enum Permission {
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_INVENTORY = 'view_inventory',
  ADD_ITEM = 'add_item',
  EDIT_ITEM = 'edit_item',
  DELETE_ITEM = 'delete_item',
  VIEW_RECEIPTS = 'view_receipts',
  CREATE_RECEIPT = 'create_receipt',
  VIEW_EMPLOYEES = 'view_employees',
  ADD_EMPLOYEE = 'add_employee',
  EDIT_EMPLOYEE = 'edit_employee',
  DELETE_EMPLOYEE = 'delete_employee',
  MANAGE_PERMISSIONS = 'manage_permissions',
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',
}

// Role hierarchy levels (higher number = more privileges)
const roleHierarchy: Record<string, number> = {
  [Role.STAFF]: 1,
  [Role.CASHIER]: 2,
  [Role.SHIFT_MANAGER]: 3,
  [Role.ASSISTANT_MANAGER]: 4,
  [Role.GENERAL_MANAGER]: 5,
  [Role.ADMIN]: 6,
};

// Permission mappings for each role
const rolePermissions: Record<string, Permission[]> = {
  [Role.STAFF]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_RECEIPTS,
    Permission.CREATE_RECEIPT,
  ],
  [Role.CASHIER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_RECEIPTS,
    Permission.CREATE_RECEIPT,
  ],
  [Role.SHIFT_MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_INVENTORY,
    Permission.EDIT_ITEM,
    Permission.VIEW_RECEIPTS,
    Permission.CREATE_RECEIPT,
    Permission.VIEW_EMPLOYEES,
    Permission.VIEW_REPORTS,
  ],
  [Role.ASSISTANT_MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_INVENTORY,
    Permission.ADD_ITEM,
    Permission.EDIT_ITEM,
    Permission.DELETE_ITEM,
    Permission.VIEW_RECEIPTS,
    Permission.CREATE_RECEIPT,
    Permission.VIEW_EMPLOYEES,
    Permission.EDIT_EMPLOYEE,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],
  [Role.GENERAL_MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_INVENTORY,
    Permission.ADD_ITEM,
    Permission.EDIT_ITEM,
    Permission.DELETE_ITEM,
    Permission.VIEW_RECEIPTS,
    Permission.CREATE_RECEIPT,
    Permission.VIEW_EMPLOYEES,
    Permission.ADD_EMPLOYEE,
    Permission.EDIT_EMPLOYEE,
    Permission.DELETE_EMPLOYEE,
    Permission.MANAGE_PERMISSIONS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],
  [Role.ADMIN]: Object.values(Permission), // Admin has all permissions
};

/**
 * Custom hook for role-based access control
 * Provides utilities to check user permissions and role hierarchy
 */
export function usePermissions() {
  const { user } = useAuth();

  const userRole = useMemo(() => {
    if (!user || !user.role) return null;
    return user.role.toLowerCase();
  }, [user]);

  const userRoleLevel = useMemo(() => {
    if (!userRole) return 0;
    return roleHierarchy[userRole] || 0;
  }, [userRole]);

  const userPermissions = useMemo(() => {
    if (!userRole) return [];
    return rolePermissions[userRole] || [];
  }, [userRole]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if user's role is at or above the specified minimum role
   */
  const hasMinimumRole = (minimumRole: Role): boolean => {
    const minimumLevel = roleHierarchy[minimumRole] || 0;
    return userRoleLevel >= minimumLevel;
  };

  /**
   * Check if user is General Manager or above (GM+)
   */
  const isGMOrAbove = (): boolean => {
    return hasMinimumRole(Role.GENERAL_MANAGER);
  };

  /**
   * Check if user is Assistant Manager or above (AM+)
   */
  const isAMOrAbove = (): boolean => {
    return hasMinimumRole(Role.ASSISTANT_MANAGER);
  };

  /**
   * Check if user is Admin
   */
  const isAdmin = (): boolean => {
    return userRole === Role.ADMIN;
  };

  /**
   * Check if user can manage another user based on role hierarchy
   */
  const canManageUser = (targetUserRole: string): boolean => {
    const targetRoleLevel = roleHierarchy[targetUserRole.toLowerCase()] || 0;
    return userRoleLevel > targetRoleLevel;
  };

  /**
   * Get human-readable role name
   */
  const getRoleName = (role?: string): string => {
    const roleToFormat = role || userRole;
    if (!roleToFormat) return 'Unknown';

    return roleToFormat
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return {
    user,
    userRole,
    userRoleLevel,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumRole,
    isGMOrAbove,
    isAMOrAbove,
    isAdmin,
    canManageUser,
    getRoleName,
  };
}
