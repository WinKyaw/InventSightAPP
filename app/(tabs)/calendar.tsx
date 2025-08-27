import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useCalendar } from '../../context/CalendarContext';
import { Header } from '../../components/shared/Header';
import { CalendarView } from '../../components/calendar/CalendarView';
import { AddReminderModal } from '../../components/modals/AddReminderModal';
import { DayDetailsModal } from '../../components/modals/DayDetailsModal';
import { styles } from '../../constants/Styles';

export default function CalendarScreen() {
  const { reminders } = useCalendar();
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
        <CalendarView />

        <View style={styles.calendarCard}>
          <Text style={styles.upcomingTitle}>Upcoming Reminders</Text>
          {reminders
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
            ))}
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