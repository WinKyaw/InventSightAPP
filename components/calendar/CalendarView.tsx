import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalendar } from '../../context/CalendarContext';

export function CalendarView() {
  const { currentCalendarDate, dailyActivities, navigateCalendar, handleDayPress } = useCalendar();
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }
  
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  return (
    <View style={styles.calendarView}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => navigateCalendar(-1)}>
          <Ionicons name="chevron-back" size={24} color="#F59E0B" />
        </TouchableOpacity>
        
        <Text style={styles.calendarMonthYear}>
          {monthNames[month]} {year}
        </Text>
        
        <TouchableOpacity onPress={() => navigateCalendar(1)}>
          <Ionicons name="chevron-forward" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.calendarDayNames}>
        {dayNames.map(day => (
          <Text key={day} style={styles.calendarDayName}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.calendarEmptyDay} />;
          }

          const dateKey = formatDate(year, month, day);
          const hasData = dailyActivities[dateKey] !== undefined;
          const isToday = isCurrentMonth && day === todayDate;
          const isPastDate = new Date(dateKey) < today;

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.calendarDay,
                hasData && styles.calendarDayWithData,
                isToday && styles.calendarToday
              ]}
              onPress={() => handleDayPress(day)}
              disabled={!hasData}
            >
              <Text style={[
                styles.calendarDayText,
                hasData && styles.calendarDayTextWithData,
                isToday && styles.calendarTodayText,
                !isPastDate && !isToday && styles.calendarFutureText
              ]}>
                {day}
              </Text>
              {hasData && <View style={styles.calendarDayIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarView: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarMonthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarDayNames: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendarDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarEmptyDay: {
    width: `${100/7}%`,
    height: 40,
  },
  calendarDay: {
    width: `${100/7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayWithData: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  calendarToday: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  calendarDayTextWithData: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  calendarTodayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarFutureText: {
    color: '#D1D5DB',
  },
  calendarDayIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
  },
});