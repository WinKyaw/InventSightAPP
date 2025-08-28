import { get, post } from './httpClient';
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

export class CalendarService {
  /**
   * Get daily activities for a date range
   */
  static async getDailyActivities(startDate: string, endDate: string): Promise<Record<string, DayActivity>> {
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);

      const url = `${CALENDAR_ENDPOINTS.DAILY_ACTIVITIES}?${params.toString()}`;
      const response = await get<CalendarActivitiesResponse>(url);
      return response.data.activities;
    } catch (error) {
      console.error('Failed to fetch daily activities:', error);
      // Return empty object for fallback
      return {};
    }
  }

  /**
   * Get all reminders
   */
  static async getReminders(): Promise<Reminder[]> {
    try {
      const response = await get<Reminder[]>(CALENDAR_ENDPOINTS.REMINDERS);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      // Return empty array for fallback
      return [];
    }
  }

  /**
   * Create a new reminder
   */
  static async createReminder(reminderData: CreateReminderRequest): Promise<Reminder> {
    try {
      const newReminderData = {
        ...reminderData,
        id: Date.now(), // Will be replaced by server
      };

      const response = await post<Reminder>(CALENDAR_ENDPOINTS.CREATE_REMINDER, newReminderData);
      return response.data;
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw error;
    }
  }

  /**
   * Get activities for a specific date
   */
  static async getActivitiesByDate(date: string): Promise<DayActivity | null> {
    try {
      const params = new URLSearchParams();
      params.append('date', date);

      const url = `${CALENDAR_ENDPOINTS.ACTIVITIES_BY_DATE}?${params.toString()}`;
      const response = await get<DayActivity>(url);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch activities for date ${date}:`, error);
      return null;
    }
  }

  /**
   * Generate sample daily activities for fallback (when API is not available)
   */
  static generateSampleDailyActivities(startDate: string, endDate: string): Record<string, DayActivity> {
    const activities: Record<string, DayActivity> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Generate realistic data based on day of week and season
      const baseMultiplier = isWeekend ? 1.3 : 1.0;
      const seasonalMultiplier = this.getSeasonalMultiplier(date.getMonth());
      
      const sales = Math.floor((800 + Math.random() * 1500) * baseMultiplier * seasonalMultiplier);
      const orders = Math.floor(sales / (15 + Math.random() * 20));
      const customers = Math.floor(orders * (0.8 + Math.random() * 0.4));
      
      activities[dateKey] = {
        date: dateKey,
        sales,
        orders,
        customers,
        activities: this.generateDailyActivitiesForDay(date, sales, orders),
        topItems: this.generateTopItemsForDay(sales)
      };
    }

    return activities;
  }

  /**
   * Get seasonal multiplier for sales data
   */
  private static getSeasonalMultiplier(month: number): number {
    // Higher sales in November-December (holiday season)
    if (month >= 10) return 1.4;
    // Lower sales in January-February (post-holiday)
    if (month <= 1) return 0.8;
    // Spring/Summer average
    return 1.0;
  }

  /**
   * Generate daily activities for a specific day
   */
  private static generateDailyActivitiesForDay(date: Date, sales: number, orders: number): ActivityItem[] {
    const activities: ActivityItem[] = [];
    const activityTypes: Array<'sale' | 'restock' | 'adjustment' | 'return'> = ['sale', 'restock', 'adjustment', 'return'];
    
    // Generate 3-8 activities per day
    const activityCount = Math.floor(3 + Math.random() * 6);
    
    for (let i = 0; i < activityCount; i++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const hour = Math.floor(9 + Math.random() * 10); // Business hours 9am-7pm
      const minute = Math.floor(Math.random() * 60);
      
      activities.push({
        id: Date.now() + i,
        type,
        productName: this.getRandomProductName(),
        quantity: Math.floor(1 + Math.random() * 10),
        timestamp: `${date.toISOString().split('T')[0]} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
        userId: 'system',
        notes: this.getActivityNote(type)
      });
    }

    return activities.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Generate top items for a day
   */
  private static generateTopItemsForDay(salesAmount: number): Array<{ name: string; quantity: number; revenue: number }> {
    const products = [
      'Premium Coffee', 'Organic Tea', 'Fresh Pastry', 'Sandwich Combo', 'Energy Drink',
      'Protein Bar', 'Smoothie', 'Salad Bowl', 'Hot Soup', 'Iced Coffee'
    ];

    return products
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map(name => ({
        name,
        quantity: Math.floor(5 + Math.random() * 20),
        revenue: Math.floor(salesAmount * (0.1 + Math.random() * 0.2))
      }));
  }

  /**
   * Get random product name
   */
  private static getRandomProductName(): string {
    const products = [
      'Premium Coffee', 'Organic Tea', 'Fresh Pastry', 'Sandwich Combo', 'Energy Drink',
      'Protein Bar', 'Smoothie', 'Salad Bowl', 'Hot Soup', 'Iced Coffee', 'Bottled Water',
      'Granola Bar', 'Fruit Cup', 'Yogurt', 'Muffin', 'Bagel', 'Chips', 'Candy Bar'
    ];
    return products[Math.floor(Math.random() * products.length)];
  }

  /**
   * Get activity note based on type
   */
  private static getActivityNote(type: 'sale' | 'restock' | 'adjustment' | 'return'): string {
    const notes = {
      sale: 'Point of sale transaction',
      restock: 'Inventory replenishment',
      adjustment: 'Stock level adjustment',
      return: 'Customer return processed'
    };
    return notes[type];
  }
}

export default CalendarService;