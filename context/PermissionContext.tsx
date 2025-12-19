import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PermissionService } from '../services/api/permissionService';

interface PermissionContextType {
  permissions: Record<string, boolean>;
  hasPermission: (type: string) => boolean;
  loadPermissions: (types: string[]) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  clearPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  
  const loadPermissions = async (types: string[]) => {
    try {
      const results = await PermissionService.checkPermissions(types);
      setPermissions(prev => ({ ...prev, ...results }));
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };
  
  const refreshPermissions = async () => {
    const types = Object.keys(permissions);
    if (types.length > 0) {
      PermissionService.clearCache();
      await loadPermissions(types);
    }
  };
  
  const hasPermission = (type: string): boolean => {
    return permissions[type] || false;
  };
  
  const clearPermissions = () => {
    setPermissions({});
    PermissionService.clearCache();
  };
  
  return (
    <PermissionContext.Provider value={{
      permissions,
      hasPermission,
      loadPermissions,
      refreshPermissions,
      clearPermissions,
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};
