import { apiClient } from './apiClient';
import { 
  API_ENDPOINTS, 
  RecentActivitiesResponse,
  ActivityItem
} from './config';

/**
 * Activity API Client - Simple HTTP client for activity operations
 */
export class ActivityService {
  /**
   * Get recent inventory activities
   */
  static async getRecentActivities(limit: number = 10): Promise<ActivityItem[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    
    const url = `${API_ENDPOINTS.ACTIVITIES.RECENT}?${params.toString()}`;
    const response = await apiClient.get<RecentActivitiesResponse>(url);
    return response.activities;
  }

  /**
   * Get all activities
   */
  static async getAllActivities(limit?: number, offset?: number): Promise<ActivityItem[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${API_ENDPOINTS.ACTIVITIES.ALL}?${queryString}` : API_ENDPOINTS.ACTIVITIES.ALL;
    
    const response = await apiClient.get<RecentActivitiesResponse>(url);
    return response.activities;
  }
}

export default ActivityService;