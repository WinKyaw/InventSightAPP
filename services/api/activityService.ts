import { apiClient } from './apiClient';
import { 
  API_ENDPOINTS, 
  RecentActivitiesResponse,
  ActivityItem
} from './config';
import { requestDeduplicator } from '../../utils/requestDeduplicator';
import { responseCache } from '../../utils/responseCache';
import { retryWithBackoff } from '../../utils/retryWithBackoff';

const CACHE_TTL = 30000; // 30 seconds

/**
 * Activity API Client with caching and deduplication
 */
export class ActivityService {
  /**
   * Get recent inventory activities with caching
   */
  static async getRecentActivities(limit: number = 10): Promise<ActivityItem[]> {
    const cacheKey = `activities:recent:${limit}`;
    
    // Check cache first
    const cached = responseCache.get<ActivityItem[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        
        const url = `${API_ENDPOINTS.ACTIVITIES.RECENT}?${params.toString()}`;
        const response = await apiClient.get<RecentActivitiesResponse>(url);
        const activities = response.activities;
        
        // Cache successful response
        responseCache.set(cacheKey, activities, CACHE_TTL);
        
        return activities;
      });
    });
  }

  /**
   * Get all activities with caching
   */
  static async getAllActivities(limit?: number, offset?: number): Promise<ActivityItem[]> {
    const cacheKey = `activities:all:${limit || 'all'}:${offset || 0}`;
    
    // Check cache first
    const cached = responseCache.get<ActivityItem[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());
        
        const queryString = params.toString();
        const url = queryString ? `${API_ENDPOINTS.ACTIVITIES.ALL}?${queryString}` : API_ENDPOINTS.ACTIVITIES.ALL;
        
        const response = await apiClient.get<RecentActivitiesResponse>(url);
        const activities = response.activities;
        
        // Cache successful response
        responseCache.set(cacheKey, activities, CACHE_TTL);
        
        return activities;
      });
    });
  }
}

export default ActivityService;