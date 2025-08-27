import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useItems } from '../../context/ItemsContext';
import { useReports } from '../../context/ReportsContext';
import { useEmployees } from '../../context/EmployeesContext';
import { Header } from '../../components/shared/Header';
import { styles } from '../../constants/Styles';

export default function DashboardScreen() {
  const { items, calculateDynamicSalesData } = useItems();
  const { 
    dashboardData, 
    loading: reportsLoading, 
    error: reportsError, 
    refreshDashboardData,
    getKPIs 
  } = useReports();
  const { 
    employees, 
    useApiIntegration, 
    setUseApiIntegration, 
    loading: employeesLoading 
  } = useEmployees();

  const [apiKPIs, setApiKPIs] = useState<any>(null);
  const [loadingKPIs, setLoadingKPIs] = useState(false);

  // Fallback to existing calculated sales data
  const salesData = calculateDynamicSalesData();

  const getRevenueGrowth = () => {
    if (apiKPIs) {
      return apiKPIs.revenueGrowth?.toFixed(1) || '0.0';
    }
    const growth = ((salesData.monthly.current - salesData.monthly.previous) / salesData.monthly.previous) * 100;
    return growth.toFixed(1);
  };

  const getCurrentKPIs = () => {
    if (apiKPIs) {
      return {
        totalRevenue: apiKPIs.totalRevenue || 0,
        totalOrders: apiKPIs.totalOrders || 0,
        avgOrderValue: apiKPIs.avgOrderValue || 0,
      };
    }
    return salesData.kpis;
  };

  const getTopPerformers = () => {
    if (dashboardData.businessIntelligence?.topPerformers) {
      return dashboardData.businessIntelligence.topPerformers.slice(0, 4);
    }
    return salesData.topItems;
  };

  const getBestPerformer = () => {
    const topPerformers = getTopPerformers();
    return topPerformers[0] || salesData.topItems[0];
  };

  const getActiveEmployeesCount = () => {
    return employees.filter(emp => emp.status === 'Active').length;
  };

  const getCheckedInEmployeesCount = () => {
    return employees.filter(emp => emp.checkInTime !== 'Not checked in').length;
  };

  const handleToggleApiIntegration = () => {
    Alert.alert(
      'API Integration',
      `${useApiIntegration ? 'Disable' : 'Enable'} API integration with InventSight backend?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: useApiIntegration ? 'Disable' : 'Enable',
          onPress: () => {
            setUseApiIntegration(!useApiIntegration);
            if (!useApiIntegration) {
              // Enable API integration and fetch data
              loadDashboardData();
            }
          },
        },
      ]
    );
  };

  const loadDashboardData = async () => {
    try {
      setLoadingKPIs(true);
      await refreshDashboardData();
      const kpis = await getKPIs();
      setApiKPIs(kpis);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load data from API. Using local data instead.');
    } finally {
      setLoadingKPIs(false);
    }
  };

  useEffect(() => {
    if (useApiIntegration) {
      loadDashboardData();
    }
  }, [useApiIntegration]);

  const kpis = getCurrentKPIs();
  const bestItem = getBestPerformer();
  const topItems = getTopPerformers();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      <Header 
        title="Sales Dashboard" 
        subtitle={useApiIntegration ? "Live Data from InventSight API" : "Live Data from Inventory"}
        backgroundColor="#3B82F6"
        showProfileButton={true}
      />
      
      <ScrollView style={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
        {/* API Integration Toggle */}
        <View style={[styles.kpiCard, { marginBottom: 16, backgroundColor: useApiIntegration ? '#10B981' : '#F59E0B' }]}>
          <TouchableOpacity onPress={handleToggleApiIntegration} style={{ padding: 8 }}>
            <Text style={[styles.kpiLabel, { color: 'white', textAlign: 'center' }]}>
              🔄 API Integration: {useApiIntegration ? 'ON' : 'OFF'}
            </Text>
            <Text style={[styles.kpiLabelSmall, { color: 'white', textAlign: 'center' }]}>
              Tap to {useApiIntegration ? 'disable' : 'enable'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {(reportsLoading || employeesLoading || loadingKPIs) && (
          <View style={[styles.kpiCard, { alignItems: 'center', paddingVertical: 20 }]}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.kpiLabel, { marginTop: 8 }]}>Loading dashboard data...</Text>
          </View>
        )}

        {/* Error Display */}
        {reportsError && (
          <View style={[styles.kpiCard, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
            <Text style={[styles.kpiLabel, { color: '#EF4444' }]}>⚠️ API Error</Text>
            <Text style={[styles.kpiLabelSmall, { color: '#EF4444' }]}>{reportsError}</Text>
            <TouchableOpacity onPress={loadDashboardData} style={{ marginTop: 8 }}>
              <Text style={[styles.kpiLabel, { color: '#3B82F6', fontSize: 14 }]}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.kpiContainer}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Monthly Revenue</Text>
              <Text style={styles.kpiValue}>${kpis.totalRevenue.toLocaleString()}</Text>
              <Text style={[styles.kpiTrend, { color: parseFloat(getRevenueGrowth()) >= 0 ? '#10B981' : '#EF4444' }]}>
                {parseFloat(getRevenueGrowth()) >= 0 ? '↗' : '↘'} {Math.abs(parseFloat(getRevenueGrowth()))}%
              </Text>
            </View>
            
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Orders</Text>
              <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>{kpis.totalOrders.toLocaleString()}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(85, 100)}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.kpiRowSmall}>
            <View style={styles.kpiCardSmall}>
              <Text style={styles.kpiLabelSmall}>
                {useApiIntegration ? 'Active Employees' : 'Active Items'}
              </Text>
              <Text style={[styles.kpiValueSmall, { color: '#10B981' }]}>
                {useApiIntegration 
                  ? getActiveEmployeesCount()
                  : items.filter(item => item.quantity > 0).length
                }
              </Text>
            </View>
            
            <View style={styles.kpiCardSmall}>
              <Text style={styles.kpiLabelSmall}>
                {useApiIntegration ? 'Checked In' : 'Low Stock'}
              </Text>
              <Text style={[styles.kpiValueSmall, { color: '#F59E0B' }]}>
                {useApiIntegration 
                  ? getCheckedInEmployeesCount()
                  : items.filter(item => item.quantity <= 10 && item.quantity > 0).length
                }
              </Text>
            </View>
          </View>

          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>📈 Best Performer This Month</Text>
            <View style={styles.performanceRow}>
              <View>
                <Text style={[styles.performanceName, { color: '#10B981' }]}>{bestItem.name}</Text>
                <Text style={styles.performanceUnits}>
                  {bestItem.quantity} {useApiIntegration ? 'units' : 'units sold'}
                </Text>
              </View>
              <View style={styles.performanceRight}>
                <Text style={styles.performanceValue}>
                  ${(bestItem.sales || bestItem.totalRevenue || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.topItemsCard}>
            <Text style={styles.topItemsTitle}>
              🏆 {useApiIntegration ? 'Live API Performance' : 'Live Inventory Performance'}
            </Text>
            {topItems.map((item, index) => (
              <View key={item.name || index} style={styles.topItemRow}>
                <View style={styles.topItemLeft}>
                  <Text style={styles.topItemRank}>#{index + 1}</Text>
                  <View>
                    <Text style={styles.topItemName}>{item.name}</Text>
                    <Text style={styles.topItemUnits}>
                      {item.quantity} {useApiIntegration ? 'units' : 'units sold'}
                    </Text>
                  </View>
                </View>
                <View style={styles.topItemRight}>
                  <Text style={styles.topItemValue}>
                    ${(item.sales || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* API Integration Status */}
          <View style={[styles.kpiCard, { marginTop: 16, backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.kpiLabel, { color: '#374151', textAlign: 'center' }]}>
              📊 Data Source
            </Text>
            <Text style={[styles.kpiLabelSmall, { color: '#6B7280', textAlign: 'center' }]}>
              {useApiIntegration 
                ? 'Connected to InventSight Backend API'
                : 'Using Local Mock Data'
              }
            </Text>
            {useApiIntegration && dashboardData.businessIntelligence && (
              <Text style={[styles.kpiLabelSmall, { color: '#10B981', textAlign: 'center', marginTop: 4 }]}>
                ✅ Last updated: {new Date().toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}