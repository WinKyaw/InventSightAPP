import { apiClient } from './apiClient';
import { API_CONFIG } from './config';

/**
 * Permission Service
 * 
 * Checks permissions via backend API for granular access control.
 * Supports both permanent role-based permissions and temporary one-time permissions.
 * 
 * Backend Permission Types:
 * - ADD_ITEM: Can add products and employees
 * - EDIT_ITEM: Can edit products
 * - DELETE_ITEM: Can delete products
 * 
 * Temporary permissions expire after 1 use OR 1 hour (whichever comes first).
 */
export class PermissionService {
  private static permissionCache: Map<string, { result: boolean; timestamp: number }> = new Map();
  private static cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if user has a specific permission with caching
   * @param type Permission type (e.g., 'ADD_ITEM', 'EDIT_ITEM', 'DELETE_ITEM')
   * @returns Promise<boolean> - true if user has permission, false otherwise
   */
  static async checkPermission(type: string): Promise<boolean> {
    try {
      // Check cache first
      const cached = this.permissionCache.get(type);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < this.cacheDuration) {
        if (__DEV__) {
          console.log(`✅ Permission cache hit: ${type}`);
        }
        return cached.result;
      }
      
      if (__DEV__) {
        console.log(`🚀 Permission check: ${type}`);
      }
      
      const response = await apiClient.get<{ hasPermission: boolean }>(
        `${API_CONFIG.BASE_URL}/api/permissions/check?type=${type}`
      );
      
      const result = response.hasPermission;
      
      // Cache the result
      this.permissionCache.set(type, {
        result,
        timestamp: now,
      });
      
      return result;
    } catch (error: any) {
      // On rate limit or error, return cached value if available
      if (error.response?.status === 429) {
        console.warn(`⚠️ Rate limited - using cache for ${type}`);
        const cached = this.permissionCache.get(type);
        return cached?.result || false;
      }
      
      console.error(`❌ Permission check failed for ${type}:`, error);
      // Return false on error - fail closed for security
      return false;
    }
  }

  /**
   * Batch check multiple permissions at once
   * @param types Array of permission types to check
   * @returns Promise<Record<string, boolean>> - Map of permission types to results
   */
  static async checkPermissions(types: string[]): Promise<Record<string, boolean>> {
    try {
      const response = await apiClient.post<Record<string, boolean>>(
        `${API_CONFIG.BASE_URL}/api/permissions/check-batch`,
        { permissions: types }
      );
      
      const results = response;
      const now = Date.now();
      
      // Cache all results
      Object.entries(results).forEach(([type, hasPermission]) => {
        this.permissionCache.set(type, {
          result: hasPermission,
          timestamp: now,
        });
      });
      
      return results;
    } catch (error: any) {
      console.error('Batch permission check error:', error);
      
      // Return cached values or false
      const results: Record<string, boolean> = {};
      types.forEach(type => {
        const cached = this.permissionCache.get(type);
        results[type] = cached?.result || false;
      });
      
      return results;
    }
  }

  /**
   * Clear permission cache (call on logout)
   */
  static clearCache() {
    this.permissionCache.clear();
  }

  /**
   * Prefetch permissions for a screen
   * @param screen Screen name to prefetch permissions for
   */
  static async prefetchScreenPermissions(screen: string) {
    const permissionMap: Record<string, string[]> = {
      'items': ['ADD_ITEM', 'EDIT_ITEM', 'DELETE_ITEM', 'VIEW_ITEMS'],
      'employees': ['ADD_EMPLOYEE', 'EDIT_EMPLOYEE', 'DELETE_EMPLOYEE', 'VIEW_EMPLOYEES'],
      'receipt': ['CREATE_RECEIPT', 'VIEW_RECEIPTS', 'REFUND_RECEIPT'],
      'reports': ['VIEW_REPORTS', 'EXPORT_REPORTS'],
      'calendar': ['VIEW_SCHEDULE', 'EDIT_SCHEDULE'],
    };
    
    const permissions = permissionMap[screen] || [];
    
    if (permissions.length > 0) {
      await this.checkPermissions(permissions);
    }
  }

  /**
   * Check if user can add items
   * @returns Promise<boolean>
   */
  static async canAddItem(): Promise<boolean> {
    return this.checkPermission('ADD_ITEM');
  }

  /**
   * Check if user can edit items
   * @returns Promise<boolean>
   */
  static async canEditItem(): Promise<boolean> {
    return this.checkPermission('EDIT_ITEM');
  }

  /**
   * Check if user can delete items
   * @returns Promise<boolean>
   */
  static async canDeleteItem(): Promise<boolean> {
    return this.checkPermission('DELETE_ITEM');
  }

  /**
   * Check if user can manage supply/predefined items
   * @returns Promise<boolean>
   */
  static async canManageSupply(): Promise<boolean> {
    return this.checkPermission('MANAGE_SUPPLY');
  }
}
