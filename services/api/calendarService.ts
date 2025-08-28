import { Event, CreateEventRequest, UpdateEventRequest, EventSearchParams, Employee } from '../../types';
import { get, post, put, del } from './httpClient';
import { API_ENDPOINTS, ApiResponse } from './config';

export class CalendarService {
  /**
   * Get all events for authenticated user
   */
  static async getAllEvents(): Promise<Event[]> {
    try {
      const response = await get<Event[]>(API_ENDPOINTS.EVENTS.ALL);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw error;
    }
  }

  /**
   * Get specific event by ID
   */
  static async getEventById(id: string | number): Promise<Event> {
    try {
      const response = await get<Event>(API_ENDPOINTS.EVENTS.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new event
   */
  static async createEvent(eventData: CreateEventRequest): Promise<Event> {
    try {
      const response = await post<Event>(API_ENDPOINTS.EVENTS.CREATE, eventData);
      return response.data;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Update existing event
   */
  static async updateEvent(id: string | number, eventData: UpdateEventRequest): Promise<Event> {
    try {
      const response = await put<Event>(API_ENDPOINTS.EVENTS.UPDATE(id), eventData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete event
   */
  static async deleteEvent(id: string | number): Promise<boolean> {
    try {
      await del(API_ENDPOINTS.EVENTS.DELETE(id));
      return true;
    } catch (error) {
      console.error(`Failed to delete event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get events for specific month
   */
  static async getMonthEvents(year: number, month: number): Promise<Event[]> {
    try {
      const response = await get<Event[]>(API_ENDPOINTS.EVENTS.MONTH(year, month));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch events for ${year}-${month}:`, error);
      throw error;
    }
  }

  /**
   * Add attendees to event
   */
  static async addEventAttendees(eventId: string | number, attendeeIds: string[]): Promise<Event> {
    try {
      const response = await post<Event>(API_ENDPOINTS.EVENTS.ADD_ATTENDEES(eventId), { attendeeIds });
      return response.data;
    } catch (error) {
      console.error(`Failed to add attendees to event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Search events with filters
   */
  static async searchEvents(searchParams: EventSearchParams): Promise<Event[]> {
    try {
      const params = new URLSearchParams();
      
      if (searchParams.query) params.append('query', searchParams.query);
      if (searchParams.year) params.append('year', searchParams.year.toString());
      if (searchParams.month) params.append('month', searchParams.month.toString());
      if (searchParams.dateFrom) params.append('dateFrom', searchParams.dateFrom);
      if (searchParams.dateTo) params.append('dateTo', searchParams.dateTo);
      if (searchParams.type) params.append('type', searchParams.type);

      const response = await get<Event[]>(`${API_ENDPOINTS.EVENTS.ALL}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search events:', error);
      throw error;
    }
  }
}