import { Reminder } from '../../types';
import { get, post, put, del } from './httpClient';
import { 
  API_ENDPOINTS, 
  CalendarEvent, 
  CreateEventRequest, 
  UpdateEventRequest, 
  EventsListResponse, 
  DateRangeParams,
  DailyActivity,
  ApiResponse 
} from './config';

export class CalendarService {
  /**
   * Get all events with pagination
   */
  static async getAllEvents(page: number = 1, limit: number = 50): Promise<EventsListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await get<EventsListResponse>(`${API_ENDPOINTS.CALENDAR.EVENTS}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw error;
    }
  }

  /**
   * Get all reminders
   */
  static async getAllReminders(page: number = 1, limit: number = 50): Promise<Reminder[]> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await get<{ reminders: Reminder[]; totalCount: number }>(`${API_ENDPOINTS.CALENDAR.REMINDERS}?${params}`);
      return response.data.reminders;
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  static async getEventById(id: string | number): Promise<CalendarEvent> {
    try {
      const response = await get<CalendarEvent>(API_ENDPOINTS.CALENDAR.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get reminder by ID
   */
  static async getReminderById(id: string | number): Promise<Reminder> {
    try {
      const response = await get<Reminder>(API_ENDPOINTS.CALENDAR.REMINDER_BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch reminder ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(eventData: CreateEventRequest): Promise<CalendarEvent> {
    try {
      const response = await post<CalendarEvent>(API_ENDPOINTS.CALENDAR.CREATE_EVENT, eventData);
      return response.data;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Create a new reminder
   */
  static async createReminder(reminderData: Omit<Reminder, 'id'>): Promise<Reminder> {
    try {
      const response = await post<Reminder>(API_ENDPOINTS.CALENDAR.CREATE_REMINDER, reminderData);
      return response.data;
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  static async updateEvent(id: number, updates: UpdateEventRequest): Promise<CalendarEvent> {
    try {
      const response = await put<CalendarEvent>(API_ENDPOINTS.CALENDAR.UPDATE_EVENT(id), updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing reminder
   */
  static async updateReminder(id: number, updates: Partial<Reminder>): Promise<Reminder> {
    try {
      const response = await put<Reminder>(API_ENDPOINTS.CALENDAR.UPDATE_REMINDER(id), updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update reminder ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(id: number): Promise<void> {
    try {
      await del(API_ENDPOINTS.CALENDAR.DELETE_EVENT(id));
    } catch (error) {
      console.error(`Failed to delete event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   */
  static async deleteReminder(id: number): Promise<void> {
    try {
      await del(API_ENDPOINTS.CALENDAR.DELETE_REMINDER(id));
    } catch (error) {
      console.error(`Failed to delete reminder ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get events by date range
   */
  static async getEventsByDateRange(params: DateRangeParams): Promise<CalendarEvent[]> {
    try {
      const searchParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate
      });
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const response = await get<{ events: CalendarEvent[] }>(`${API_ENDPOINTS.CALENDAR.BY_DATE_RANGE}?${searchParams}`);
      return response.data.events;
    } catch (error) {
      console.error('Failed to fetch events by date range:', error);
      return [];
    }
  }

  /**
   * Get daily activity summary for a specific date
   */
  static async getDailySummary(date: string): Promise<DailyActivity> {
    try {
      const response = await get<DailyActivity>(API_ENDPOINTS.CALENDAR.DAILY_SUMMARY(date));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch daily summary for ${date}:`, error);
      
      // Return default empty data if API fails
      return {
        date,
        sales: 0,
        orders: 0,
        customers: 0,
        events: [],
        activities: [],
        topItems: []
      };
    }
  }

  /**
   * Get activities for multiple dates (for calendar view)
   */
  static async getActivitiesByDateRange(startDate: string, endDate: string): Promise<Record<string, DailyActivity>> {
    try {
      const searchParams = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await get<{ activities: Record<string, DailyActivity> }>(`${API_ENDPOINTS.CALENDAR.ACTIVITIES}?${searchParams}`);
      return response.data.activities;
    } catch (error) {
      console.error('Failed to fetch activities by date range:', error);
      return {};
    }
  }

  /**
   * Get upcoming reminders (next 7 days)
   */
  static async getUpcomingReminders(days: number = 7): Promise<Reminder[]> {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const allReminders = await this.getAllReminders(1, 100);
      
      // Filter reminders within the date range
      return allReminders.filter(reminder => {
        return reminder.date >= startDate && reminder.date <= endDate;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Failed to fetch upcoming reminders:', error);
      return [];
    }
  }

  /**
   * Get today's events
   */
  static async getTodaysEvents(): Promise<CalendarEvent[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await this.getEventsByDateRange({
        startDate: today,
        endDate: today,
        limit: 100
      });
    } catch (error) {
      console.error('Failed to fetch today\'s events:', error);
      return [];
    }
  }

  /**
   * Get events count for a date range
   */
  static async getEventsCount(startDate?: string, endDate?: string): Promise<number> {
    try {
      if (startDate && endDate) {
        const events = await this.getEventsByDateRange({ startDate, endDate, limit: 1000 });
        return events.length;
      } else {
        const response = await this.getAllEvents(1, 1);
        return response.totalCount;
      }
    } catch (error) {
      console.error('Failed to get events count:', error);
      return 0;
    }
  }

  /**
   * Generate calendar data for a month (fallback for offline use)
   */
  static generateMonthData(year: number, month: number): Record<string, DailyActivity> {
    const activities: Record<string, DailyActivity> = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseMultiplier = isWeekend ? 1.3 : 1.0;
      
      const sales = Math.floor((800 + Math.random() * 1500) * baseMultiplier);
      const orders = Math.floor(sales / (15 + Math.random() * 20));
      const customers = Math.floor(orders * (0.8 + Math.random() * 0.4));
      
      activities[dateKey] = {
        date: dateKey,
        sales,
        orders,
        customers,
        events: [],
        activities: [],
        topItems: []
      };
    }
    
    return activities;
  }
}

export default CalendarService;