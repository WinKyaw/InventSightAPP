import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/shared/Header';
import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../constants/Styles';

export default function ReportsScreen() {
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Reports: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const { 
    dashboardData, 
    loading, 
    error, 
    refreshDashboardData,
    getKPIs
  } = useReports();
  
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      await refreshDashboardData();
      const kpis = await getKPIs();
      setKpiData(kpis);
    } catch (error) {
      console.error('Failed to load reports data:', error);
    }
  }, [refreshDashboardData, getKPIs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />
      <Header 
        title="Reports & Analytics"
        subtitle="Business Intelligence Dashboard"
        backgroundColor="#10B981"
        showProfileButton={true}
      />
      
      <ScrollView 
        style={styles.dashboardContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reports...</Text>
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
              onPress={loadData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KPI Cards */}
        {kpiData && (
          <View style={styles.kpiContainer}>
            <View style={styles.kpiCard}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
              <Text style={styles.kpiValue}>${kpiData.totalRevenue?.toLocaleString() || '0'}</Text>
              <Text style={styles.kpiLabel}>Total Revenue</Text>
            </View>
            
            <View style={styles.kpiCard}>
              <Ionicons name="receipt" size={24} color="#3B82F6" />
              <Text style={styles.kpiValue}>{kpiData.totalOrders?.toLocaleString() || '0'}</Text>
              <Text style={styles.kpiLabel}>Total Orders</Text>
            </View>

            <View style={styles.kpiCard}>
              <Ionicons name="calculator" size={24} color="#F59E0B" />
              <Text style={styles.kpiValue}>${kpiData.avgOrderValue?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.kpiLabel}>Avg Order Value</Text>
            </View>

            <View style={styles.kpiCard}>
              <Ionicons name="happy" size={24} color="#8B5CF6" />
              <Text style={styles.kpiValue}>{kpiData.customerSatisfaction || '0'}%</Text>
              <Text style={styles.kpiLabel}>Satisfaction</Text>
            </View>
          </View>
        )}

        {/* Dashboard Data Summary */}
        {dashboardData && (
          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>📊 Business Overview</Text>
            <View style={styles.dashboardStatsContainer}>
              <View style={styles.dashboardStat}>
                <Text style={styles.dashboardStatLabel}>Products</Text>
                <Text style={styles.dashboardStatValue}>{dashboardData.totalProducts}</Text>
              </View>
              <View style={styles.dashboardStat}>
                <Text style={styles.dashboardStatLabel}>Low Stock</Text>
                <Text style={styles.dashboardStatValue}>{dashboardData.lowStockCount}</Text>
              </View>
              <View style={styles.dashboardStat}>
                <Text style={styles.dashboardStatLabel}>Inventory Value</Text>
                <Text style={styles.dashboardStatValue}>${dashboardData.inventoryValue?.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Coming Soon Section */}
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>📈 Advanced Analytics</Text>
          <Text style={styles.performanceUnits}>
            More advanced reporting features coming soon:{'\n\n'}
            • Sales trends and forecasting{'\n'}
            • Inventory analytics{'\n'}
            • Employee performance{'\n'}
            • Financial reports{'\n'}
            • Custom dashboards{'\n'}
            • Export capabilities
          </Text>
        </View>

        {!loading && !dashboardData && !error && (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="bar-chart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Data Available</Text>
            <Text style={styles.emptyStateText}>
              Reports will appear here once you have business data
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadData}
            >
              <Text style={styles.retryButtonText}>Load Reports</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}