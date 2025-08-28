import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { Reminder, Event, CreateEventRequest, UpdateEventRequest, Employee } from '../types';
import { initialReminders } from '../constants/Data';
import { getSeasonalMultiplier, generateDailyActivities, generateTopItemsForDay } from '../utils/calendarHelpers';
import { CalendarService } from '../services/api/calendarService';
import { useApi, useApiWithParams } from '../hooks/useApi';

interface DayActivity {
  date: string;
  sales: number;
  orders: number;
  customers: number;
  activities: any[];
  topItems: any[];
}

interface CalendarContextType {
  reminders: Reminder[];
  events: Event[];
  dailyActivities: Record<string, DayActivity>;
  currentCalendarDate: Date;
  selectedDayData: DayActivity | null;
  showDayModal: boolean;
  loading: boolean;
  error: string | null;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  setCurrentCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDayData: React.Dispatch<React.SetStateAction<DayActivity | null>>;
  setShowDayModal: React.Dispatch<React.SetStateAction<boolean>>;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  createEvent: (eventData: CreateEventRequest) => Promise<void>;
  updateEvent: (eventId: string, eventData: UpdateEventRequest) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  fetchAllEvents: () => Promise<void>;
  fetchMonthEvents: (year: number, month: number) => Promise<void>;
  addEventAttendees: (eventId: string, attendeeIds: string[]) => Promise<void>;
  navigateCalendar: (direction: number) => void;
  handleDayPress: (day: number) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<DayActivity | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // API hooks for calendar operations
  const {
    data: eventsData,
    loading: fetchingEvents,
    error: eventsError,
    execute: executeFetchEvents,
  } = useApi(() => CalendarService.getAllEvents());

  const {
    loading: creatingEvent,
    error: createEventError,
    execute: executeCreateEvent,
  } = useApiWithParams((eventData: CreateEventRequest) => CalendarService.createEvent(eventData));

  const {
    loading: updatingEvent,
    error: updateEventError,
    execute: executeUpdateEvent,
  } = useApiWithParams(({ eventId, eventData }: { eventId: string; eventData: UpdateEventRequest }) => 
    CalendarService.updateEvent(eventId, eventData));

  const {
    loading: deletingEvent,
    error: deleteEventError,
    execute: executeDeleteEvent,
  } = useApiWithParams((eventId: string) => CalendarService.deleteEvent(eventId));

  const {
    data: monthEventsData,
    loading: fetchingMonthEvents,
    error: monthEventsError,
    execute: executeFetchMonthEvents,
  } = useApiWithParams(({ year, month }: { year: number; month: number }) => 
    CalendarService.getMonthEvents(year, month));

  const {
    loading: addingAttendees,
    error: attendeesError,
    execute: executeAddAttendees,
  } = useApiWithParams(({ eventId, attendeeIds }: { eventId: string; attendeeIds: string[] }) => 
    CalendarService.addEventAttendees(eventId, attendeeIds));

  // Combine all loading states
  const loading = fetchingEvents || creatingEvent || updatingEvent || deletingEvent || fetchingMonthEvents || addingAttendees;
  
  // Combine all error states
  const error = eventsError || createEventError || updateEventError || deleteEventError || monthEventsError || attendeesError;

  // Update local state when API data is fetched
  useEffect(() => {
    if (eventsData) {
      setEvents(eventsData);
    }
  }, [eventsData]);

  useEffect(() => {
    if (monthEventsData) {
      setEvents(monthEventsData);
    }
  }, [monthEventsData]);

  // Generate daily activities data
  const [dailyActivities] = useState(() => {
    const activities: Record<string, DayActivity> = {};
    const startDate = new Date('2023-08-25');
    const endDate = new Date('2025-08-25');
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseMultiplier = isWeekend ? 1.3 : 1.0;
      const seasonalMultiplier = getSeasonalMultiplier(date.getMonth());
      
      const sales = Math.floor((800 + Math.random() * 1500) * baseMultiplier * seasonalMultiplier);
      const orders = Math.floor(sales / (15 + Math.random() * 20));
      const customers = Math.floor(orders * (0.8 + Math.random() * 0.4));
      
      activities[dateKey] = {
        date: dateKey,
        sales,
        orders,
        customers,
        activities: generateDailyActivities(date, sales, orders),
        topItems: generateTopItemsForDay(sales)
      };
    }
    return activities;
  });

  const addReminder = (newReminder: Omit<Reminder, 'id'>) => {
    const reminder: Reminder = {
      ...newReminder,
      id: Date.now(),
    };
    setReminders(prev => [...prev, reminder]);
  };

  const createEvent = async (eventData: CreateEventRequest): Promise<void> => {
    try {
      const createdEvent = await executeCreateEvent(eventData);
      if (createdEvent) {
        setEvents(prev => [...prev, createdEvent]);
        Alert.alert('Success', 'Event created successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event');
    }
  };

  const updateEvent = async (eventId: string, eventData: UpdateEventRequest): Promise<void> => {
    try {
      const updatedEvent = await executeUpdateEvent({ eventId, eventData });
      if (updatedEvent) {
        setEvents(prev => prev.map(event => event.id === eventId ? updatedEvent : event));
        Alert.alert('Success', 'Event updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update event');
    }
  };

  const deleteEvent = async (eventId: string): Promise<void> => {
    try {
      await executeDeleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      Alert.alert('Success', 'Event deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete event');
    }
  };

  const fetchAllEvents = async (): Promise<void> => {
    try {
      const fetchedEvents = await executeFetchEvents();
      if (fetchedEvents) {
        setEvents(fetchedEvents);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch events');
    }
  };

  const fetchMonthEvents = async (year: number, month: number): Promise<void> => {
    try {
      const monthEvents = await executeFetchMonthEvents({ year, month });
      if (monthEvents) {
        setEvents(monthEvents);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch month events');
    }
  };

  const addEventAttendees = async (eventId: string, attendeeIds: string[]): Promise<void> => {
    try {
      const updatedEvent = await executeAddAttendees({ eventId, attendeeIds });
      if (updatedEvent) {
        setEvents(prev => prev.map(event => event.id === eventId ? updatedEvent : event));
        Alert.alert('Success', 'Attendees added successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add attendees');
    }
  };

  const navigateCalendar = (direction: number) => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentCalendarDate(newDate);
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDayPress = (day: number) => {
    const dateKey = formatDate(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
    const dayData = dailyActivities[dateKey];
    
    if (dayData) {
      setSelectedDayData(dayData);
      setShowDayModal(true);
    }
  };

  return (
    <CalendarContext.Provider value={{
      reminders,
      events,
      dailyActivities,
      currentCalendarDate,
      selectedDayData,
      showDayModal,
      loading,
      error,
      setReminders,
      setEvents,
      setCurrentCalendarDate,
      setSelectedDayData,
      setShowDayModal,
      addReminder,
      createEvent,
      updateEvent,
      deleteEvent,
      fetchAllEvents,
      fetchMonthEvents,
      addEventAttendees,
      navigateCalendar,
      handleDayPress
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}