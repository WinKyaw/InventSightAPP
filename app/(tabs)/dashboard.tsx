import React from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useItems } from '../../context/ItemsContext';
import { Header } from '../../components/shared/Header';
import { styles } from '../../constants/Styles';

export default function DashboardScreen() {
  const { items, calculateDynamicSalesData } = useItems();
  const salesData = calculateDynamicSalesData();

  const getRevenueGrowth = () => {
    const growth = ((salesData.monthly.current - salesData.monthly.previous) / salesData.monthly.previous) * 100;
    return growth.toFixed(1);
  };

  const bestItem = salesData.topItems[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      <Header 
        title="Sales Dashboard" 
        subtitle="Live Data from Inventory"
        backgroundColor="#3B82F6"
        showProfileButton={true}
      />
      
      <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Monthly Revenue</Text>
              <Text style={styles.kpiValue}>${salesData.kpis.totalRevenue.toLocaleString()}</Text>
              <Text style={[styles.kpiTrend, { color: getRevenueGrowth() >= 0 ? '#10B981' : '#EF4444' }]}>
                {getRevenueGrowth() >= 0 ? '↗' : '↘'} {Math.abs(getRevenueGrowth())}%
              </Text>
            </View>
            
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Orders</Text>
              <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>{salesData.kpis.totalOrders}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(85, 100)}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.kpiRowSmall}>
            <View style={styles.kpiCardSmall}>
              <Text style={styles.kpiLabelSmall}>Active Items</Text>
              <Text style={[styles.kpiValueSmall, { color: '#10B981' }]}>
                {items.filter(item => item.quantity > 0).length}
              </Text>
            </View>
            
            <View style={styles.kpiCardSmall}>
              <Text style={styles.kpiLabelSmall}>Low Stock</Text>
              <Text style={[styles.kpiValueSmall, { color: '#F59E0B' }]}>
                {items.filter(item => item.quantity <= 10 && item.quantity > 0).length}
              </Text>
            </View>
          </View>

          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>📈 Best Performer This Month</Text>
            <View style={styles.performanceRow}>
              <View>
                <Text style={[styles.performanceName, { color: '#10B981' }]}>{bestItem.name}</Text>
                <Text style={styles.performanceUnits}>{bestItem.quantity} units sold</Text>
              </View>
              <View style={styles.performanceRight}>
                <Text style={styles.performanceValue}>${bestItem.sales.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.topItemsCard}>
            <Text style={styles.topItemsTitle}>🏆 Live Inventory Performance</Text>
            {salesData.topItems.map((item, index) => (
              <View key={item.name} style={styles.topItemRow}>
                <View style={styles.topItemLeft}>
                  <Text style={styles.topItemRank}>#{index + 1}</Text>
                  <View>
                    <Text style={styles.topItemName}>{item.name}</Text>
                    <Text style={styles.topItemUnits}>{item.quantity} units sold</Text>
                  </View>
                </View>
                <View style={styles.topItemRight}>
                  <Text style={styles.topItemValue}>${item.sales.toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}