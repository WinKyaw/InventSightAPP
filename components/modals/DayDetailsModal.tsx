import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalendar } from '../../context/CalendarContext';
import { Modal } from '../ui/Modal';
import { styles } from '../../constants/Styles';

export function DayDetailsModal() {
  const { selectedDayData, showDayModal, setShowDayModal } = useCalendar();

  if (!selectedDayData) return null;

  const date = new Date(selectedDayData.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Modal 
      visible={showDayModal} 
      onClose={() => setShowDayModal(false)} 
      title={formattedDate}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Sales Summary */}
        <View style={styles.daySummaryCard}>
          <Text style={styles.daySummaryTitle}>📊 Daily Summary</Text>
          <View style={styles.daySummaryGrid}>
            <View style={styles.daySummaryItem}>
              <Text style={styles.daySummaryLabel}>Sales</Text>
              <Text style={styles.daySummaryValue}>${selectedDayData.sales}</Text>
            </View>
            <View style={styles.daySummaryItem}>
              <Text style={styles.daySummaryLabel}>Orders</Text>
              <Text style={styles.daySummaryValue}>{selectedDayData.orders}</Text>
            </View>
            <View style={styles.daySummaryItem}>
              <Text style={styles.daySummaryLabel}>Customers</Text>
              <Text style={styles.daySummaryValue}>{selectedDayData.customers}</Text>
            </View>
            <View style={styles.daySummaryItem}>
              <Text style={styles.daySummaryLabel}>Avg Order</Text>
              <Text style={styles.daySummaryValue}>
                ${(selectedDayData.sales / selectedDayData.orders).toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Items */}
        <View style={styles.dayTopItemsCard}>
          <Text style={styles.dayTopItemsTitle}>🏆 Top Items</Text>
          {selectedDayData.topItems.map((item, index) => (
            <View key={index} style={styles.dayTopItem}>
              <View style={styles.dayTopItemLeft}>
                <Text style={styles.dayTopItemRank}>#{index + 1}</Text>
                <Text style={styles.dayTopItemName}>{item.name}</Text>
              </View>
              <View style={styles.dayTopItemRight}>
                <Text style={styles.dayTopItemSales}>${item.sales}</Text>
                <Text style={styles.dayTopItemQuantity}>{item.quantity} sold</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Activities */}
        <View style={styles.dayActivitiesCard}>
          <Text style={styles.dayActivitiesTitle}>📝 Daily Activities</Text>
          {selectedDayData.activities.map((activity, index) => (
            <View key={index} style={styles.dayActivity}>
              <View style={styles.dayActivityLeft}>
                <Ionicons name={activity.icon} size={20} color="#F59E0B" />
                <View style={styles.dayActivityInfo}>
                  <Text style={styles.dayActivityTime}>{activity.time}</Text>
                  <Text style={styles.dayActivityDescription}>{activity.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Modal>
  );
}