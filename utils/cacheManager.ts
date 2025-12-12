import { responseCache } from './responseCache';

/**
 * Centralized cache invalidation manager
 */
export class CacheManager {
  /**
   * Invalidate all product-related caches
   */
  static invalidateProducts(): void {
    responseCache.invalidatePattern(/^products:/);
    console.log('🗑️ Invalidated all product caches');
  }

  /**
   * Invalidate all category-related caches
   */
  static invalidateCategories(): void {
    responseCache.invalidatePattern(/^categories:/);
    console.log('🗑️ Invalidated all category caches');
  }

  /**
   * Invalidate all employee-related caches
   */
  static invalidateEmployees(): void {
    responseCache.invalidatePattern(/^employees:/);
    console.log('🗑️ Invalidated all employee caches');
  }

  /**
   * Invalidate all dashboard caches
   */
  static invalidateDashboard(): void {
    responseCache.invalidatePattern(/^dashboard:/);
    console.log('🗑️ Invalidated all dashboard caches');
  }

  /**
   * Invalidate all activity-related caches
   */
  static invalidateActivities(): void {
    responseCache.invalidatePattern(/^activities:/);
    console.log('🗑️ Invalidated all activity caches');
  }

  /**
   * Invalidate everything
   */
  static invalidateAll(): void {
    responseCache.clear();
    console.log('🗑️ Invalidated ALL caches');
  }
}
