import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Reminder } from '../types';
import { initialReminders } from '../constants/Data';
import { getSeasonalMultiplier, generateDailyActivities, generateTopItemsForDay } from '../utils/calendarHelpers';

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
  dailyActivities: Record<string, DayActivity>;
  currentCalendarDate: Date;
  selectedDayData: DayActivity | null;
  showDayModal: boolean;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setCurrentCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDayData: React.Dispatch<React.SetStateAction<DayActivity | null>>;
  setShowDayModal: React.Dispatch<React.SetStateAction<boolean>>;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  navigateCalendar: (direction: number) => void;
  handleDayPress: (day: number) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDayData, setSelectedDayData] = useState<DayActivity | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

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