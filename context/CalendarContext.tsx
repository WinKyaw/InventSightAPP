import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Reminder } from '../types';
import { CalendarService, DailyActivity } from '../services';
import { useApi } from '../hooks';

// Use DailyActivity from services instead of local interface

interface CalendarContextType {
  reminders: Reminder[];
  dailyActivities: Record<string, DailyActivity>;
  currentCalendarDate: Date;
  selectedDayData: DailyActivity | null;
  showDayModal: boolean;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setCurrentCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDayData: React.Dispatch<React.SetStateAction<DailyActivity | null>>;
  setShowDayModal: React.Dispatch<React.SetStateAction<boolean>>;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  navigateCalendar: (direction: number) => void;
  handleDayPress: (day: number) => void;
  // New API-related properties
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  deleteReminder: (id: number) => Promise<void>;
  updateReminder: (id: number, updates: Partial<Reminder>) => Promise<void>;
  useApiIntegration: boolean;
  setUseApiIntegration: (use: boolean) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<DailyActivity | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [useApiIntegration, setUseApiIntegration] = useState<boolean>(true);

  // API integration using useApi hook
  const {
    data: apiReminders,
    loading: loadingReminders,
    error,
    execute: fetchReminders,
    reset,
  } = useApi(() => CalendarService.getAllReminders(1, 100), { immediate: true });

  // API for activities by date range
  const {
    data: apiActivities,
    loading: loadingActivities,
    execute: fetchActivities,
  } = useApi(async () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Get activities for current month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    if (useApiIntegration) {
      return await CalendarService.getActivitiesByDateRange(startDate, endDate);
    } else {
      // Fallback to generated data
      return CalendarService.generateMonthData(year, month);
    }
  });

  // Effect to sync API data with local state
  useEffect(() => {
    if (useApiIntegration && apiReminders) {
      setReminders(apiReminders);
    } else if (!useApiIntegration) {
      setReminders([]); // Would load from local data if needed
    }
  }, [useApiIntegration, apiReminders]);

  // Fetch activities when calendar date changes
  useEffect(() => {
    fetchActivities().catch(console.error);
  }, [currentCalendarDate, useApiIntegration, fetchActivities]);

  // Generate fallback daily activities data for offline use
  const [fallbackDailyActivities] = useState(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    return CalendarService.generateMonthData(year, month);
  });

  // Use API activities if available, otherwise fallback
  const dailyActivities: Record<string, DailyActivity> = apiActivities || fallbackDailyActivities;

  const addReminder = async (newReminder: Omit<Reminder, 'id'>) => {
    if (useApiIntegration) {
      try {
        const createdReminder = await CalendarService.createReminder(newReminder);
        setReminders(prev => [...prev, createdReminder]);
      } catch (error) {
        console.error('Failed to create reminder:', error);
        // Fallback to local creation
        const reminder: Reminder = {
          ...newReminder,
          id: Date.now(),
        };
        setReminders(prev => [...prev, reminder]);
      }
    } else {
      const reminder: Reminder = {
        ...newReminder,
        id: Date.now(),
      };
      setReminders(prev => [...prev, reminder]);
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

  // New API-related functions
  const refreshData = async () => {
    await Promise.all([
      fetchReminders(),
      fetchActivities()
    ]);
  };

  const deleteReminderFunction = async (id: number) => {
    if (useApiIntegration) {
      try {
        await CalendarService.deleteReminder(id);
        setReminders(prev => prev.filter(reminder => reminder.id !== id));
      } catch (error) {
        console.error('Failed to delete reminder:', error);
        throw error;
      }
    } else {
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
    }
  };

  const updateReminderFunction = async (id: number, updates: Partial<Reminder>) => {
    if (useApiIntegration) {
      try {
        const updatedReminder = await CalendarService.updateReminder(id, updates);
        setReminders(prev => prev.map(reminder => 
          reminder.id === id ? updatedReminder : reminder
        ));
      } catch (error) {
        console.error('Failed to update reminder:', error);
        // Fallback to local update
        setReminders(prev => prev.map(reminder => 
          reminder.id === id ? { ...reminder, ...updates } : reminder
        ));
      }
    } else {
      setReminders(prev => prev.map(reminder => 
        reminder.id === id ? { ...reminder, ...updates } : reminder
      ));
    }
  };

  return (
    <CalendarContext.Provider value={{
      reminders,
      dailyActivities,
      currentCalendarDate,
      selectedDayData,
      showDayModal,
      setReminders,
      setCurrentCalendarDate,
      setSelectedDayData,
      setShowDayModal,
      addReminder,
      navigateCalendar,
      handleDayPress,
      loading: loadingReminders || loadingActivities,
      error,
      refreshData,
      deleteReminder: deleteReminderFunction,
      updateReminder: updateReminderFunction,
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