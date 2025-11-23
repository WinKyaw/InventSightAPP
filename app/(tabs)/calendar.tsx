import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCalendar } from '../../context/CalendarContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/shared/Header';
import { CalendarView } from '../../components/calendar/CalendarView';
import { AddReminderModal } from '../../components/modals/AddReminderModal';
import { DayDetailsModal } from '../../components/modals/DayDetailsModal';
import { styles } from '../../constants/Styles';

export default function CalendarScreen() {
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Calendar: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const { 
    reminders, 
    loading, 
    error, 
    refreshCalendarData,
    useApiIntegration,
    setUseApiIntegration 
  } = useCalendar();
  const [showAddReminder, setShowAddReminder] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F59E0B" barStyle="light-content" />
      
      <Header 
        title="Calendar & Activity"
        subtitle="Track daily activities and performance"
        backgroundColor="#F59E0B"
        rightComponent={
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowAddReminder(true)}
          >
            <Text style={styles.headerButtonText}>Add Reminder</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading calendar data...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={refreshCalendarData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* API Integration Toggle for Development */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.apiToggleButton}
            onPress={() => setUseApiIntegration(!useApiIntegration)}
          >
            <Text style={styles.apiToggleText}>
              API Integration: {useApiIntegration ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        )}

        <CalendarView />

        <View style={styles.calendarCard}>
          <Text style={styles.upcomingTitle}>Upcoming Reminders</Text>
          {reminders.length === 0 ? (
            <View style={styles.emptyRemindersContainer}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyRemindersTitle}>No Upcoming Reminders</Text>
              <Text style={styles.emptyRemindersText}>
                Tap "Add Reminder" to create your first reminder
              </Text>
            </View>
          ) : (
            reminders
              .filter(reminder => reminder.date >= new Date().toISOString().split('T')[0])
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 10)
              .map(reminder => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={styles.reminderHeader}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <View style={[styles.reminderType, { 
                    backgroundColor: reminder.type === 'order' ? '#DCFCE7' : 
                                    reminder.type === 'meeting' ? '#DBEAFE' : '#FEF3C7',
                    borderColor: reminder.type === 'order' ? '#BBF7D0' : 
                                 reminder.type === 'meeting' ? '#BFDBFE' : '#FDE68A'
                  }]}>
                    <Text style={[styles.reminderTypeText, {
                      color: reminder.type === 'order' ? '#166534' : 
                             reminder.type === 'meeting' ? '#1E40AF' : '#92400E'
                    }]}>{reminder.type}</Text>
                  </View>
                </View>
                <Text style={styles.reminderDate}>
                  📅 {new Date(reminder.date).toLocaleDateString()} at {reminder.time}
                </Text>
                {reminder.description && (
                  <Text style={styles.reminderDescription}>{reminder.description}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AddReminderModal 
        visible={showAddReminder}
        onClose={() => setShowAddReminder(false)}
      />
      
      <DayDetailsModal />
    </SafeAreaView>
  );
}