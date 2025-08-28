import { get } from './httpClient';
import { 
  API_ENDPOINTS, 
  RecentActivitiesResponse,
  ActivityItem
} from './config';

export class ActivityService {
  /**
   * Get recent inventory activities
   */
  static async getRecentActivities(limit: number = 10): Promise<ActivityItem[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      
      const url = `${API_ENDPOINTS.ACTIVITIES.RECENT}?${params.toString()}`;
      const response = await get<RecentActivitiesResponse>(url);
      return response.data.activities;
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      // Return empty array for error scenarios
      return [];
    }
  }

  /**
   * Get all activities
   */
  static async getAllActivities(limit?: number, offset?: number): Promise<ActivityItem[]> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      
      const queryString = params.toString();
      const url = queryString ? `${API_ENDPOINTS.ACTIVITIES.ALL}?${queryString}` : API_ENDPOINTS.ACTIVITIES.ALL;
      
      const response = await get<RecentActivitiesResponse>(url);
      return response.data.activities;
    } catch (error) {
      console.error('Failed to fetch all activities:', error);
      return [];
    }
  }
}

export default ActivityService;