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
  /**
   * Check if user has a specific permission
   * @param type Permission type (e.g., 'ADD_ITEM', 'EDIT_ITEM', 'DELETE_ITEM')
   * @returns Promise<boolean> - true if user has permission, false otherwise
   */
  static async checkPermission(type: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ hasPermission: boolean }>(
        `${API_CONFIG.BASE_URL}/api/permissions/check?type=${type}`
      );
      return response.hasPermission;
    } catch (error) {
      console.error(`❌ Permission check failed for ${type}:`, error);
      // Return false on error - fail closed for security
      return false;
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
}
