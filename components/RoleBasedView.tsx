import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePermissions, Permission, Role } from '../hooks/usePermissions';
import { Colors } from '../constants/Colors';

interface RoleBasedViewProps {
  children: React.ReactNode;
  /** Required permission to view this component */
  permission?: Permission;
  /** Multiple permissions (any one required) */
  anyPermission?: Permission[];
  /** Multiple permissions (all required) */
  allPermissions?: Permission[];
  /** Minimum role required */
  minimumRole?: Role;
  /** Require General Manager or above */
  gmOnly?: boolean;
  /** Require Assistant Manager or above */
  amOnly?: boolean;
  /** Require Admin */
  adminOnly?: boolean;
  /** Show fallback message when access is denied */
  showDeniedMessage?: boolean;
  /** Custom denied message */
  deniedMessage?: string;
  /** Fallback component to show when access is denied */
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 * Useful for hiding/showing UI elements based on role
 */
export function RoleBasedView({
  children,
  permission,
  anyPermission,
  allPermissions,
  minimumRole,
  gmOnly,
  amOnly,
  adminOnly,
  showDeniedMessage = false,
  deniedMessage = 'You do not have permission to access this feature.',
  fallback,
}: RoleBasedViewProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMinimumRole,
    isGMOrAbove,
    isAMOrAbove,
    isAdmin,
  } = usePermissions();

  // Check all conditions
  let hasAccess = true;

  if (permission && !hasPermission(permission)) {
    hasAccess = false;
  }

  if (anyPermission && anyPermission.length > 0 && !hasAnyPermission(anyPermission)) {
    hasAccess = false;
  }

  if (allPermissions && allPermissions.length > 0 && !hasAllPermissions(allPermissions)) {
    hasAccess = false;
  }

  if (minimumRole && !hasMinimumRole(minimumRole)) {
    hasAccess = false;
  }

  if (gmOnly && !isGMOrAbove()) {
    hasAccess = false;
  }

  if (amOnly && !isAMOrAbove()) {
    hasAccess = false;
  }

  if (adminOnly && !isAdmin()) {
    hasAccess = false;
  }

  // If access is denied
  if (!hasAccess) {
    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show denied message if requested
    if (showDeniedMessage) {
      return (
        <View style={styles.deniedContainer}>
          <Text style={styles.deniedMessage}>{deniedMessage}</Text>
        </View>
      );
    }

    // Otherwise render nothing
    return null;
  }

  // User has access, render children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  deniedContainer: {
    padding: 16,
    backgroundColor: Colors.backgroundSecondary || '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedMessage: {
    color: Colors.textSecondary || '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
});
