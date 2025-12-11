import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useReports } from '../../context/ReportsContext';
import { useEmployees } from '../../context/EmployeesContext';
import { useApiReadiness } from '../../hooks/useAuthenticatedAPI';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/shared/Header';
import { styles } from '../../constants/Styles';

export default function DashboardScreen() {
  const { t } = useTranslation();
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Dashboard: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Add null check for useApiReadiness result
  const apiReadinessResult = useApiReadiness();
  const { isReady: apiReady, isAuthenticating, canMakeApiCalls } = apiReadinessResult || {
    isReady: false,
    isAuthenticating: true,
    canMakeApiCalls: false
  };
  
  const { 
    dashboardData, 
    loading: reportsLoading, 
    error: reportsError, 
    refreshDashboardData
  } = useReports();
  const { 
    employees, 
    loading: employeesLoading 
  } = useEmployees();

  const [refreshing, setRefreshing] = useState(false);

  // ✅ LAZY LOADING: Load data only when Dashboard screen is focused
  useFocusEffect(
    useCallback(() => {
      if (canMakeApiCalls) {
        console.log('📊 Dashboard screen focused - loading dashboard data');
        refreshDashboardData().catch((error) => {
          console.error('Failed to load dashboard data:', error);
          // Don't show alert on automatic load, only on manual refresh
        });
      }
    }, [canMakeApiCalls, refreshDashboardData])
  );

  const handleRefresh = useCallback(async () => {
    // Check authentication before allowing refresh
    if (!canMakeApiCalls) {
      Alert.alert(t('errors.authenticationRequired'), t('errors.loginToRefresh'));
      return;
    }

    setRefreshing(true);
    try {
      await refreshDashboardData();
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      Alert.alert(t('errors.networkError'), t('errors.checkNetworkConnection'));
    } finally {
      setRefreshing(false);
    }
  }, [canMakeApiCalls, refreshDashboardData, t]);

  // Helper functions for displaying data with empty state handling
  const getDisplayValue = useCallback((value: number | undefined, defaultValue: number = 0): string => {
    return (value ?? defaultValue).toLocaleString();
  }, []);

  const getRevenueGrowth = useCallback((): string => {
    if (!dashboardData) return '0.0';
    if (!dashboardData.revenueGrowth || typeof dashboardData.revenueGrowth !== 'number') return '0.0';
    return dashboardData.revenueGrowth.toFixed(1);
  }, [dashboardData]);

  const getOrderGrowth = useCallback((): string => {
    if (!dashboardData) return '0.0';
    if (!dashboardData.orderGrowth || typeof dashboardData.orderGrowth !== 'number') return '0.0';
    return dashboardData.orderGrowth.toFixed(1);
  }, [dashboardData]);

  // Memoize expensive calculations to prevent re-computation on every render
  const getBestPerformer = useMemo(() => {
    // Use available dashboard data to show meaningful information
    if (!dashboardData || dashboardData.isEmpty) {
      return {
        name: 'No Data Available',
        quantity: 0,
        sales: 0
      };
    }

    // Find the activity with the highest quantity for "best performer"
    if (dashboardData.recentActivities && dashboardData.recentActivities.length > 0) {
      const sortedActivities = [...dashboardData.recentActivities]
        .filter(activity => activity.type === 'sale')
        .sort((a, b) => b.quantity - a.quantity);
      
      if (sortedActivities.length > 0) {
        const topActivity = sortedActivities[0];
        return {
          name: topActivity.productName,
          quantity: topActivity.quantity,
          // Use totalValue if available, otherwise estimate
          sales: topActivity.totalValue || 
                 (dashboardData.avgOrderValue > 0 ? 
                  Math.round(topActivity.quantity * dashboardData.avgOrderValue / Math.max(dashboardData.totalOrders, 1)) : 0)
        };
      }
    }

    return {
      name: 'No Sales Data Available',
      quantity: 0,
      sales: 0
    };
  }, [dashboardData]);

  const getTopPerformers = useMemo(() => {
    if (!dashboardData || dashboardData.isEmpty || !dashboardData.recentActivities) {
      return [];
    }

    // Convert recent activities to top performers format for display
    // Filter for sale activities and use real data
    return dashboardData.recentActivities
      .filter(activity => activity.type === 'sale')
      .slice(0, 4)
      .map((activity) => ({
        name: activity.productName,
        quantity: activity.quantity,
        // Use totalValue if available, otherwise estimate
        sales: activity.totalValue || 
               (dashboardData.avgOrderValue > 0 ? 
                Math.round(activity.quantity * dashboardData.avgOrderValue / Math.max(dashboardData.totalOrders, 1)) : 0)
      }));
  }, [dashboardData]);

  // Use memoized values instead of calling functions
  const bestItem = getBestPerformer;
  const topItems = getTopPerformers;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      <Header 
        title={t('dashboard.title')} 
        subtitle="Live Data from InventSight API"
        backgroundColor="#3B82F6"
        showProfileButton={true}
      />
      
      <ScrollView 
        style={styles.dashboardContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Authentication Loading Indicator */}
        {isAuthenticating && (
          <View style={[styles.kpiCard, { alignItems: 'center', paddingVertical: 20 }]}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.kpiLabel, { marginTop: 8 }]}>{t('dashboard.verifyingAuth')}</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {(reportsLoading || employeesLoading) && canMakeApiCalls && (
          <View style={[styles.kpiCard, { alignItems: 'center', paddingVertical: 20 }]}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.kpiLabel, { marginTop: 8 }]}>{t('dashboard.loading')}</Text>
          </View>
        )}

        {/* Error Display */}
        {reportsError && canMakeApiCalls && (
          <View style={[styles.kpiCard, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
            <Text style={[styles.kpiLabel, { color: '#EF4444' }]}>⚠️ API Error</Text>
            <Text style={[styles.kpiLabelSmall, { color: '#EF4444' }]}>{reportsError}</Text>
            <TouchableOpacity 
              onPress={() => {
                refreshDashboardData().catch((error) => {
                  console.error('Failed to retry dashboard data:', error);
                  Alert.alert(t('errors.networkError'), t('errors.checkNetworkConnection'));
                });
              }} 
              style={{ marginTop: 8 }}
            >
              <Text style={[styles.kpiLabel, { color: '#3B82F6', fontSize: 14 }]}>{t('common.refresh')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State Display */}
        {dashboardData?.isEmpty && !reportsLoading && canMakeApiCalls && (
          <View style={[styles.kpiCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <Text style={[styles.kpiLabel, { color: '#D97706' }]}>📊 Empty Database</Text>
            <Text style={[styles.kpiLabelSmall, { color: '#D97706' }]}>
              No data available. Add some products and transactions to see dashboard metrics.
            </Text>
          </View>
        )}

        {/* Main Dashboard Content - Only show when authenticated and not in loading states */}
        {canMakeApiCalls && !isAuthenticating && (
          <View style={styles.kpiContainer}>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{t('dashboard.revenue')}</Text>
                <Text style={styles.kpiValue}>${getDisplayValue(dashboardData?.totalRevenue)}</Text>
                <Text style={[styles.kpiTrend, { color: parseFloat(getRevenueGrowth()) >= 0 ? '#10B981' : '#EF4444' }]}>
                  {parseFloat(getRevenueGrowth()) >= 0 ? '↗' : '↘'} {Math.abs(parseFloat(getRevenueGrowth()))}%
                </Text>
              </View>
              
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{t('dashboard.orders')}</Text>
                <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>{getDisplayValue(dashboardData?.totalOrders)}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(85, 100)}%` }]} />
                </View>
              </View>
            </View>

            <View style={styles.kpiRowSmall}>
              <View style={styles.kpiCardSmall}>
                <Text style={styles.kpiLabelSmall}>{t('dashboard.products')}</Text>
                <Text style={[styles.kpiValueSmall, { color: '#10B981' }]}>
                  {getDisplayValue(dashboardData?.totalProducts)}
                </Text>
              </View>
            
            <View style={styles.kpiCardSmall}>
              <Text style={styles.kpiLabelSmall}>{t('dashboard.lowStock')}</Text>
              <Text style={[styles.kpiValueSmall, { color: '#F59E0B' }]}>
                {getDisplayValue(dashboardData?.lowStockCount)}
              </Text>
            </View>
            
            <View style={styles.kpiCardSmall}>
              <Text style={styles.kpiLabelSmall}>{t('inventory.category')}</Text>
              <Text style={[styles.kpiValueSmall, { color: '#8B5CF6' }]}>
                {getDisplayValue(dashboardData?.totalCategories)}
              </Text>
            </View>
          </View>

          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>📈 {t('dashboard.bestPerformer')}</Text>
            <View style={styles.performanceRow}>
              <View>
                <Text style={[styles.performanceName, { color: '#10B981' }]}>{bestItem.name}</Text>
                <Text style={styles.performanceUnits}>
                  {bestItem.quantity} {t('common.units')} sold
                </Text>
              </View>
              <View style={styles.performanceRight}>
                <Text style={styles.performanceValue}>
                  ${bestItem.sales.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.topItemsCard}>
            <Text style={styles.topItemsTitle}>
              🏆 {t('dashboard.recentOrders')}
            </Text>
            {topItems.length > 0 ? (
              topItems.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.topItemRow}>
                  <View style={styles.topItemLeft}>
                    <Text style={styles.topItemRank}>#{index + 1}</Text>
                    <View>
                      <Text style={styles.topItemName}>{item.name}</Text>
                      <Text style={styles.topItemUnits}>{item.quantity} {t('common.units')}</Text>
                    </View>
                  </View>
                  <View style={styles.topItemRight}>
                    <Text style={styles.topItemValue}>
                      ${item.sales.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={[styles.kpiLabelSmall, { color: '#9CA3AF' }]}>
                  {t('reports.noData')}
                </Text>
              </View>
            )}
          </View>

          {/* Additional Metrics */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Avg Order Value</Text>
              <Text style={[styles.kpiValue, { color: '#8B5CF6' }]}>
                ${getDisplayValue(dashboardData?.avgOrderValue)}
              </Text>
            </View>
            
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Inventory Value</Text>
              <Text style={[styles.kpiValue, { color: '#10B981' }]}>
                ${getDisplayValue(dashboardData?.inventoryValue)}
              </Text>
            </View>
          </View>

          {/* Data Source Info */}
          <View style={[styles.kpiCard, { marginTop: 16, backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.kpiLabel, { color: '#374151', textAlign: 'center' }]}>
              📊 Data Source
            </Text>
            <Text style={[styles.kpiLabelSmall, { color: '#6B7280', textAlign: 'center' }]}>
              Connected to InventSight Backend API
            </Text>
            {dashboardData && (
              <Text style={[styles.kpiLabelSmall, { color: '#10B981', textAlign: 'center', marginTop: 4 }]}>
                ✅ Last updated: {new Date(dashboardData.lastUpdated).toLocaleTimeString()}
              </Text>
            )}
            <Text style={[styles.kpiLabelSmall, { color: '#6B7280', textAlign: 'center', marginTop: 4 }]}>
              Pull down to refresh
            </Text>
          </View>
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}