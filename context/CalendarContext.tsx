import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Reminder } from '../types';
import { initialReminders } from '../constants/Data';
import { getSeasonalMultiplier, generateDailyActivities, generateTopItemsForDay } from '../utils/calendarHelpers';
import { CalendarService } from '../services';
import { useAuthenticatedAPI, useApiReadiness } from '../hooks';
import { ActivityItem } from '../services/api/config';

interface DayActivity {
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

interface CalendarContextType {
  reminders: Reminder[];
  dailyActivities: Record<string, DayActivity>;
  currentCalendarDate: Date;
  selectedDayData: DayActivity | null;
  showDayModal: boolean;
  loading: boolean;
  error: string | null;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setCurrentCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDayData: React.Dispatch<React.SetStateAction<DayActivity | null>>;
  setShowDayModal: React.Dispatch<React.SetStateAction<boolean>>;
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  navigateCalendar: (direction: number) => void;
  handleDayPress: (day: number) => void;
  refreshCalendarData: () => Promise<void>;
  useApiIntegration: boolean;
  setUseApiIntegration: (use: boolean) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<DayActivity | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [useApiIntegration, setUseApiIntegration] = useState<boolean>(false);

  // Authentication readiness check
  const { canMakeApiCalls } = useApiReadiness();

  // API integration for reminders
  const {
    data: apiReminders,
    loading: remindersLoading,
    error: remindersError,
    execute: fetchReminders,
  } = useAuthenticatedAPI(CalendarService.getReminders, { immediate: false });

  // API integration for daily activities
  const {
    data: apiActivities,
    loading: activitiesLoading,
    error: activitiesError,
    execute: fetchActivities,
  } = useAuthenticatedAPI(() => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // Get last month
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Get next month
    
    return CalendarService.getDailyActivities(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }, { immediate: false });

  const loading = remindersLoading || activitiesLoading;
  const error = remindersError || activitiesError;

  // Generate fallback daily activities data
  const [fallbackDailyActivities] = useState(() => {
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

  // Use API data when available, otherwise fallback
  const dailyActivities = (useApiIntegration && apiActivities) ? apiActivities : fallbackDailyActivities;

  // Effect to sync API data with local state when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && apiReminders && Array.isArray(apiReminders)) {
      setReminders(apiReminders);
    } else if (!useApiIntegration) {
      setReminders(initialReminders);
    }
  }, [useApiIntegration, apiReminders]);

  // Auto-fetch data when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && canMakeApiCalls) {
      fetchReminders();
      fetchActivities();
    }
  }, [useApiIntegration, canMakeApiCalls]);

  const addReminder = useCallback(async (newReminder: Omit<Reminder, 'id'>): Promise<void> => {
    try {
      if (useApiIntegration && canMakeApiCalls) {
        const reminder = await CalendarService.createReminder({
          ...newReminder,
        });
        setReminders(prev => [...prev, reminder]);
      } else {
        const reminder: Reminder = {
          ...newReminder,
          id: Date.now(),
        };
        setReminders(prev => [...prev, reminder]);
      }
    } catch (error) {
      console.error('Failed to create reminder:', error);
      // Fallback to local creation
      const reminder: Reminder = {
        ...newReminder,
        id: Date.now(),
      };
      setReminders(prev => [...prev, reminder]);
    }
  }, [useApiIntegration, canMakeApiCalls]);

  const refreshCalendarData = useCallback(async (): Promise<void> => {
    if (useApiIntegration && canMakeApiCalls) {
      await Promise.all([fetchReminders(), fetchActivities()]);
    }
  }, [useApiIntegration, canMakeApiCalls, fetchReminders, fetchActivities]);

  const navigateCalendar = useCallback((direction: number) => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentCalendarDate(newDate);
  }, [currentCalendarDate]);

  const formatDate = useCallback((year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, []);

  const handleDayPress = useCallback((day: number) => {
    const dateKey = formatDate(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
    const dayData = dailyActivities[dateKey];
    
    if (dayData) {
      setSelectedDayData(dayData);
      setShowDayModal(true);
    }
  }, [currentCalendarDate, dailyActivities, formatDate]);

  return (
    <CalendarContext.Provider value={{
      reminders,
      dailyActivities,
      currentCalendarDate,
      selectedDayData,
      showDayModal,
      loading,
      error,
      setReminders,
      setCurrentCalendarDate,
      setSelectedDayData,
      setShowDayModal,
      addReminder,
      navigateCalendar,
      handleDayPress,
      refreshCalendarData,
      useApiIntegration,
      setUseApiIntegration,
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