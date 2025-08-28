import { apiClient } from './apiClient';
import { Reminder } from '../../types';
import { ActivityItem } from './config';

// Calendar API endpoints
const CALENDAR_ENDPOINTS = {
  DAILY_ACTIVITIES: '/api/calendar/daily-activities',
  REMINDERS: '/api/calendar/reminders',
  CREATE_REMINDER: '/api/calendar/reminders',
  UPDATE_REMINDER: (id: string | number) => `/api/calendar/reminders/${id}`,
  DELETE_REMINDER: (id: string | number) => `/api/calendar/reminders/${id}`,
  ACTIVITIES_BY_DATE: '/api/calendar/activities-by-date',
};

export interface DayActivity {
  date: string;
  sales: number;
  orders: number;
  customers: number;
  activities: ActivityItem[];
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface CalendarActivitiesResponse {
  activities: Record<string, DayActivity>;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface CreateReminderRequest {
  title: string;
  date: string;
  type: 'order' | 'meeting' | 'maintenance';
  time: string;
  description: string;
}

/**
 * Calendar API Client - Simple HTTP client for calendar operations
 */
export class CalendarService {
  /**
   * Get daily activities for a date range
   */
  static async getDailyActivities(startDate: string, endDate: string): Promise<Record<string, DayActivity>> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);

    const url = `${CALENDAR_ENDPOINTS.DAILY_ACTIVITIES}?${params.toString()}`;
    const response = await apiClient.get<CalendarActivitiesResponse>(url);
    return response.activities;
  }

  /**
   * Get all reminders
   */
  static async getReminders(): Promise<Reminder[]> {
    return await apiClient.get<Reminder[]>(CALENDAR_ENDPOINTS.REMINDERS);
  }

  /**
   * Create a new reminder
   */
  static async createReminder(reminderData: CreateReminderRequest): Promise<Reminder> {
    return await apiClient.post<Reminder>(CALENDAR_ENDPOINTS.CREATE_REMINDER, reminderData);
  }

  /**
   * Get activities for a specific date
   */
  static async getActivitiesByDate(date: string): Promise<DayActivity> {
    const params = new URLSearchParams();
    params.append('date', date);

    const url = `${CALENDAR_ENDPOINTS.ACTIVITIES_BY_DATE}?${params.toString()}`;
    return await apiClient.get<DayActivity>(url);
  }
}

export default CalendarService;