import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useReports } from '../../context/ReportsContext';
import { useEmployees } from '../../context/EmployeesContext';
import { useApiReadiness } from '../../hooks/useAuthenticatedAPI';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Header } from '../../components/shared/Header';
import { SalesChart } from '../../components/dashboard/SalesChart';
import { TopProductsList } from '../../components/dashboard/TopProductsList';
import { GrowthIndicator } from '../../components/dashboard/GrowthIndicator';
import { styles } from '../../constants/Styles';
import { responseCache } from '../../services/api/cache';
import { CacheManager } from '../../utils/cacheManager';
import { StoreService, Store } from '../../services/api/storeService';
import { Colors } from '../../constants/Colors';

export default function DashboardScreen() {
  const { t } = useTranslation();
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  // ✅ ALL hooks must be declared before any conditional returns (React hooks rules)
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

  const { currentStore, selectStore, loadPersistedStore } = useStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [detailModal, setDetailModal] = useState<string | null>(null);

  // ✅ INFINITE LOOP FIX: Track loaded state and throttle loads
  const loadedRef = useRef(false);
  const lastLoadTime = useRef(0);
  const MIN_LOAD_INTERVAL = 5000; // 5 seconds minimum between loads
  // Tracks whether a store change was initiated by THIS screen so the reactive
  // useEffect([currentStore?.id]) can skip firing a duplicate activateStoreAndRefresh.
  const storeChangedByThisScreen = useRef(false);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Dashboard: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Load stores on mount and restore the persisted selection
  useEffect(() => {
    (async () => {
      try {
        const userStores = await StoreService.getUserStores();
        setStores(userStores);
        if (userStores.length > 0) {
          await loadPersistedStore(userStores);
        }
      } catch (error) {
        console.error('❌ Dashboard: Failed to load stores:', error);
      }
    })();
  }, [loadPersistedStore]);

  // Core logic: activate a store in the backend and refresh dashboard data
  const activateStoreAndRefresh = useCallback(async (storeId: string) => {
    storeChangedByThisScreen.current = true;
    try {
      await StoreService.activateStore(storeId);
      CacheManager.invalidateDashboard();
      loadedRef.current = false;
      lastLoadTime.current = 0;
      await refreshDashboardData();
    } catch (err) {
      // Reset flag on error so subsequent store changes from other tabs
      // are not incorrectly skipped by the reactive useEffect.
      storeChangedByThisScreen.current = false;
      throw err;
    }
  }, [refreshDashboardData]);

  // Handle switching to a different store
  const handleStoreChange = useCallback(async (store: Store) => {
    try {
      await selectStore(store);
      await activateStoreAndRefresh(store.id);
    } catch (error) {
      console.error('❌ Dashboard: Failed to switch store:', error);
      Alert.alert('Error', 'Failed to switch stores. Please try again.');
    }
  }, [selectStore, activateStoreAndRefresh]);

  // Sync dashboard when store changes from another tab (e.g. Items)
  useEffect(() => {
    // Skip if the store change was triggered by this screen — it already called
    // activateStoreAndRefresh directly and we don't want a duplicate request.
    if (storeChangedByThisScreen.current) {
      storeChangedByThisScreen.current = false;
      return;
    }
    if (!loadedRef.current) {
      return;
    }
    if (!currentStore?.id || !canMakeApiCalls) {
      return;
    }
    console.log('🏪 Dashboard: store changed from another tab — reloading data');
    activateStoreAndRefresh(currentStore.id).catch((error) => {
      console.error('❌ Dashboard: Failed to reload after store change:', error);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStore?.id]);

  useEffect(() => {
    // Clear dashboard cache on component mount to ensure fresh data
    console.log('🗑️ Dashboard mounted - clearing cache...');
    CacheManager.invalidateDashboard();
  }, []);

  // ✅ LAZY LOADING: Load data only when Dashboard screen is focused
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();

      // Allow reload if the cache was cleared after the last load (e.g. after receipt creation)
      const cacheClearedAt = responseCache.getLastClearedAt();
      if (loadedRef.current && cacheClearedAt > lastLoadTime.current) {
        console.log('🔄 Dashboard: Cache invalidated since last load - scheduling refresh');
        loadedRef.current = false;
      }

      // Prevent loading with multiple guard conditions
      // Check each condition and log specific reason for skipping
      if (loadedRef.current) {
        console.log('⏭️  Dashboard: Skipping load - already loaded once');
        return;
      }

      if ((now - lastLoadTime.current) < MIN_LOAD_INTERVAL) {
        console.log('⏭️  Dashboard: Skipping load - too soon (< 5 seconds since last load)');
        return;
      }

      if (reportsLoading) {
        console.log('⏭️  Dashboard: Skipping load - currently loading');
        return;
      }

      if (!canMakeApiCalls) {
        console.log('⏭️  Dashboard: Skipping load - not authenticated or not ready');
        return;
      }

      console.log('📊 Dashboard screen focused - loading dashboard data');
      lastLoadTime.current = now;
      loadedRef.current = true;

      refreshDashboardData().catch((error) => {
        console.error('❌ Dashboard load failed:', error);
        // Reset loadedRef to allow manual retry via refresh button
        // Note: Does NOT automatically retry - requires user action
        loadedRef.current = false;
      });

      // Cleanup function
      return () => {
        console.log('📊 Dashboard screen unfocused');
      };
    }, [canMakeApiCalls, refreshDashboardData, reportsLoading])
  );

  const handleRefresh = useCallback(async () => {
    // Check authentication before allowing refresh
    if (!canMakeApiCalls) {
      Alert.alert(t('errors.authenticationRequired'), t('errors.loginToRefresh'));
      return;
    }

    // Reset load guards to allow fresh load
    loadedRef.current = false;
    lastLoadTime.current = 0;

    setRefreshing(true);
    try {
      await refreshDashboardData();
      loadedRef.current = true;
      lastLoadTime.current = Date.now();
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
    if (!dashboardData) return { name: 'No Sales Data', quantity: 0, sales: 0 };
    // Check direct bestPerformer field from API
    const bp = (dashboardData as any)?.bestPerformer;
    if (bp?.productName) {
      return { name: bp.productName, quantity: bp.totalSold || 0, sales: bp.totalRevenue || 0 };
    }
    // Fallback to topSellingItems
    const topItem = dashboardData.topSellingItems?.[0];
    if (topItem) return { name: topItem.name, quantity: topItem.quantity, sales: topItem.revenue };
    return { name: 'No Sales Data Available', quantity: 0, sales: 0 };
  }, [dashboardData]);

  const getRecentOrders = useMemo(() => {
    if (!dashboardData) return [];
    const ro = (dashboardData as any)?.recentOrders;
    if (Array.isArray(ro) && ro.length > 0) return ro;
    return (dashboardData.recentActivities || []).filter((a: any) => a.type === 'sale' || a.type === 'SALE');
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

  // Early return if not authenticated (AFTER all hooks)
  if (!isAuthenticated) {
    return null;
  }

  // Use memoized values instead of calling functions
  const bestItem = getBestPerformer;
  const topItems = getTopPerformers;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      <Header
        title={t('dashboard.title')}
        backgroundColor="#3B82F6"
        showProfileButton={true}
        rightComponent={
          <TouchableOpacity
            onPress={() => setShowStoreSelector(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
          >
            <Ionicons name="storefront-outline" size={18} color="white" />
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '600', maxWidth: 90 }} numberOfLines={1}>
              {currentStore?.storeName || currentStore?.name || 'Store'}
            </Text>
            <Ionicons name="swap-horizontal" size={16} color="white" />
          </TouchableOpacity>
        }
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
                // Reset load guards to allow retry
                loadedRef.current = false;
                lastLoadTime.current = 0;
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
              <TouchableOpacity style={[styles.kpiCard, { borderBottomWidth: 3, borderBottomColor: '#10B981' }]} onPress={() => setDetailModal('revenue')}>
                <Ionicons name="trending-up" size={20} color="#10B981" style={{ marginBottom: 4 }} />
                <Text style={styles.kpiLabel}>{t('dashboard.revenue')}</Text>
                <Text style={styles.kpiValue}>${getDisplayValue(dashboardData?.totalRevenue)}</Text>
                <GrowthIndicator value={parseFloat(getRevenueGrowth())} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.kpiCard, { borderBottomWidth: 3, borderBottomColor: '#3B82F6' }]} onPress={() => setDetailModal('orders')}>
                <Ionicons name="receipt-outline" size={20} color="#3B82F6" style={{ marginBottom: 4 }} />
                <Text style={styles.kpiLabel}>{t('dashboard.orders')}</Text>
                <Text style={[styles.kpiValue, { color: '#3B82F6' }]}>{getDisplayValue(dashboardData?.totalOrders)}</Text>
                <GrowthIndicator value={parseFloat(getOrderGrowth())} />
              </TouchableOpacity>
            </View>

            <View style={styles.kpiRowSmall}>
              <TouchableOpacity style={styles.kpiCardSmall} onPress={() => setDetailModal('products')}>
                <Ionicons name="cube-outline" size={16} color="#10B981" style={{ marginBottom: 2 }} />
                <Text style={styles.kpiLabelSmall}>{t('dashboard.products')}</Text>
                <Text style={[styles.kpiValueSmall, { color: '#10B981', fontWeight: 'bold', fontSize: 20 }]}>
                  {getDisplayValue(dashboardData?.totalProducts)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.kpiCardSmall, (dashboardData?.lowStockCount || 0) > 0 ? { backgroundColor: '#FEF3C7' } : {}]}
                onPress={() => setDetailModal('lowstock')}
              >
                <Text style={styles.kpiLabelSmall}>{t('dashboard.lowStock')}</Text>
                <Text style={[styles.kpiValueSmall, { color: (dashboardData?.lowStockCount || 0) > 0 ? '#D97706' : '#F59E0B' }]}>
                  {getDisplayValue(dashboardData?.lowStockCount)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.kpiCardSmall} onPress={() => setDetailModal('weeklysales')}>
                <Text style={styles.kpiLabelSmall}>Weekly</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 32, marginTop: 4 }}>
                  {(() => {
                    const sales = dashboardData?.dailySales || [];
                    const maxRev = Math.max(...sales.map((d: any) => d.revenue || 0), 1);
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];
                    if (sales.length === 0) {
                      return Array.from({ length: 7 }).map((_, i) => (
                        <View key={i} style={{ flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 2, marginHorizontal: 1 }} />
                      ));
                    }
                    return sales.slice(0, 7).map((d: any, i: number) => (
                      <View key={i} style={{ flex: 1, height: Math.max(4, ((d.revenue || 0) / maxRev) * 32), backgroundColor: colors[i % colors.length], borderRadius: 2, marginHorizontal: 1 }} />
                    ));
                  })()}
                </View>
                <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 4 }}>
                  ${(dashboardData?.dailySales || []).reduce((sum: number, d: any) => sum + (d.revenue || 0), 0).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sales Chart - NEW */}
            {dashboardData?.dailySales && dashboardData.dailySales.length > 0 && (
              <SalesChart dailySales={dashboardData.dailySales} />
            )}

            {/* Top Products List - NEW */}
            {dashboardData?.topSellingItems && dashboardData.topSellingItems.length > 0 && (
              <TopProductsList products={dashboardData.topSellingItems} />
            )}

            <TouchableOpacity onPress={() => setDetailModal('bestperformer')}>
              <View style={styles.performanceCard}>
                <Text style={styles.performanceTitle}>📈 {t('dashboard.bestPerformer')}</Text>
                {bestItem.sales === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <Ionicons name="stats-chart-outline" size={40} color="#9CA3AF" />
                    <Text style={{ color: '#9CA3AF', marginTop: 8 }}>No sales yet</Text>
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🏆</Text>
                    <View style={styles.performanceRow}>
                      <View>
                        <Text style={[styles.performanceName, { color: '#10B981' }]}>{bestItem.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                            <Text style={{ color: '#065F46', fontSize: 12, fontWeight: '600' }}>
                              {bestItem.quantity} {t('common.units')} sold
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.performanceRight}>
                        <Text style={styles.performanceValue}>
                          ${bestItem.sales.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setDetailModal('recentorders')}>
              <View style={styles.topItemsCard}>
                <Text style={styles.topItemsTitle}>
                  🏆 {t('dashboard.recentOrders')}
                </Text>
                {getRecentOrders.length === 0 ? (
                  <Text style={{ color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 }}>
                    No recent orders
                  </Text>
                ) : (
                  getRecentOrders.slice(0, 2).map((order: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                      <View>
                        <Text style={{ fontWeight: '600', fontSize: 13 }}>#{order.receiptNumber || order.id || 'N/A'}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 12 }}>{order.customerName || 'Walk-in'}</Text>
                      </View>
                      <Text style={{ fontWeight: '600', color: '#10B981' }}>${(order.totalAmount || order.total || 0).toFixed(2)}</Text>
                    </View>
                  ))
                )}
              </View>
            </TouchableOpacity>

            {/* Inventory Health */}
            <View style={styles.topItemsCard}>
              <Text style={styles.topItemsTitle}>📦 Inventory Health</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <TouchableOpacity style={styles.inventoryTile} onPress={() => setDetailModal('products')}>
                  <Text style={styles.inventoryTileLabel}>Total Products</Text>
                  <Text style={styles.inventoryTileValue}>{dashboardData?.totalProducts || 0}</Text>
                </TouchableOpacity>
                <View style={styles.inventoryTile}>
                  <Text style={styles.inventoryTileLabel}>Categories</Text>
                  <Text style={styles.inventoryTileValue}>{dashboardData?.totalCategories || 0}</Text>
                </View>
                <View style={styles.inventoryTile}>
                  <Text style={styles.inventoryTileLabel}>Inventory Value</Text>
                  <Text style={styles.inventoryTileValue}>${(dashboardData?.inventoryValue || 0).toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.inventoryTile, (dashboardData?.lowStockCount || 0) > 0 ? { backgroundColor: '#FEF3C7' } : {}]}
                  onPress={() => setDetailModal('lowstock')}
                >
                  <Text style={styles.inventoryTileLabel}>Low Stock</Text>
                  <Text style={[styles.inventoryTileValue, { color: (dashboardData?.lowStockCount || 0) > 0 ? '#D97706' : '#374151' }]}>
                    {dashboardData?.lowStockCount || 0}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Additional Metrics */}
            <View style={styles.kpiRow}>
              <TouchableOpacity style={styles.kpiCard} onPress={() => setDetailModal('avgorder')}>
                <Text style={styles.kpiLabel}>Avg Order Value</Text>
                <Text style={[styles.kpiValue, { color: '#8B5CF6' }]}>
                  ${(dashboardData?.avgOrderValue || 0).toFixed(2)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.kpiCard, { borderBottomWidth: 3, borderBottomColor: '#6366F1' }]}
                onPress={() => setDetailModal('employees')}
              >
                <Ionicons name="people-outline" size={20} color="#6366F1" style={{ marginBottom: 4 }} />
                <Text style={styles.kpiLabel}>Employees</Text>
                <Text style={[styles.kpiValue, { color: '#6366F1' }]}>
                  {(dashboardData as any)?.totalEmployees || 0}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ask AI */}
            <View style={[styles.kpiRow, { marginTop: 12 }]}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  marginHorizontal: 8,
                  padding: 20,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 100,
                  backgroundColor: '#8B5CF6',
                  shadowColor: '#8B5CF6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={() => {
                  Alert.alert(
                    'AI Assistant',
                    'AI Chat feature coming soon! This will provide intelligent insights about your inventory and sales.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="sparkles" size={32} color="#FFF" style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF' }}>
                  Ask AI
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 }}>
                  Get Insights
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
      </ScrollView>

      {/* Store Selector Modal */}
      <Modal
        visible={showStoreSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStoreSelector(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.text }}>Select Store</Text>
              <TouchableOpacity onPress={() => setShowStoreSelector(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 8, backgroundColor: Colors.background, marginBottom: 8 },
                    currentStore?.id === store.id && { backgroundColor: Colors.secondaryLight, borderWidth: 2, borderColor: Colors.secondary },
                  ]}
                  onPress={async () => {
                    await handleStoreChange(store);
                    setShowStoreSelector(false);
                  }}
                >
                  <Ionicons name="storefront-outline" size={24} color={currentStore?.id === store.id ? Colors.primary : Colors.textSecondary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text }}>{store.storeName}</Text>
                    {store.city && (
                      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 2 }}>{store.city}{store.state ? `, ${store.state}` : ''}</Text>
                    )}
                  </View>
                  {currentStore?.id === store.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={detailModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModal(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
              {detailModal === 'revenue' ? 'Revenue Details' :
               detailModal === 'orders' ? 'Orders Details' :
               detailModal === 'products' ? 'Products Details' :
               detailModal === 'lowstock' ? 'Low Stock Items' :
               detailModal === 'bestperformer' ? 'Best Performer' :
               detailModal === 'recentorders' ? 'Recent Orders' :
               detailModal === 'avgorder' ? 'Avg Order Value' :
               detailModal === 'weeklysales' ? 'Weekly Sales' :
               detailModal === 'employees' ? 'Employees' : 'Details'}
            </Text>
            <TouchableOpacity onPress={() => setDetailModal(null)}>
              <Ionicons name="close" size={28} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

            {detailModal === 'revenue' && (
              <View>
                <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#10B981' }}>${(dashboardData?.totalRevenue || 0).toLocaleString()}</Text>
                <Text style={{ color: '#6B7280', marginTop: 8 }}>Revenue Growth: {parseFloat(getRevenueGrowth()) >= 0 ? '+' : ''}{getRevenueGrowth()}%</Text>
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>Progress toward +20% growth target</Text>
                  <View style={[styles.progressBar, { height: 10 }]}>
                    <View style={[styles.progressFill, { width: `${Math.round((1 / 1.2) * 100)}%`, backgroundColor: '#10B981' }]} />
                  </View>
                  <Text style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>{Math.round((1 / 1.2) * 100)}% of target</Text>
                </View>
                {(dashboardData?.dailySales || []).length > 0 && <>
                  <Text style={{ fontWeight: '600', fontSize: 16, marginTop: 24, marginBottom: 12 }}>Daily Breakdown</Text>
                  {(dashboardData?.dailySales || []).map((d: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                      <Text style={{ color: '#374151' }}>{d.date}</Text>
                      <Text style={{ fontWeight: '600', color: '#10B981' }}>${(d.revenue || 0).toFixed(2)}</Text>
                    </View>
                  ))}
                </>}
              </View>
            )}

            {detailModal === 'orders' && (
              <View>
                <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#3B82F6' }}>{dashboardData?.totalOrders || 0}</Text>
                <Text style={{ color: '#6B7280', marginTop: 8 }}>Order Growth: +{getOrderGrowth()}%</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, marginTop: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text>Avg Order Value</Text>
                  <Text style={{ fontWeight: '600' }}>${(dashboardData?.avgOrderValue || 0).toFixed(2)}</Text>
                </View>
              </View>
            )}

            {detailModal === 'products' && (
              <View>
                <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#8B5CF6' }}>{dashboardData?.totalProducts || 0}</Text>
                <Text style={{ color: '#6B7280', marginTop: 8 }}>Total products in inventory</Text>
                {[
                  { label: 'Categories', value: dashboardData?.totalCategories || 0 },
                  { label: 'Low Stock Items', value: dashboardData?.lowStockCount || 0 },
                  { label: 'Inventory Value', value: `$${(dashboardData?.inventoryValue || 0).toLocaleString()}` },
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginTop: i === 0 ? 20 : 0 }}>
                    <Text>{item.label}</Text>
                    <Text style={{ fontWeight: '600' }}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {detailModal === 'lowstock' && (
              <View>
                <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#F59E0B' }}>{dashboardData?.lowStockCount || 0}</Text>
                <Text style={{ color: '#6B7280', marginTop: 8 }}>Items at or below minimum stock threshold</Text>
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Ionicons name="warning-outline" size={48} color="#F59E0B" />
                  <Text style={{ color: '#6B7280', marginTop: 12, textAlign: 'center' }}>Go to Items → Low Stock tab to see the full list with details</Text>
                </View>
              </View>
            )}

            {detailModal === 'bestperformer' && (
              <View>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#111827' }}>{getBestPerformer.name}</Text>
                <View style={{ marginTop: 20 }}>
                  {[
                    { label: 'Units Sold', value: String(getBestPerformer.quantity) },
                    { label: 'Revenue', value: `$${(getBestPerformer.sales || 0).toFixed(2)}` },
                  ].map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                      <Text>{item.label}</Text>
                      <Text style={{ fontWeight: '600', color: '#10B981' }}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {detailModal === 'recentorders' && (
              <View>
                {getRecentOrders.length === 0 ? (
                  <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#6B7280', marginTop: 12 }}>No recent orders available</Text>
                  </View>
                ) : getRecentOrders.map((order: any, i: number) => (
                  <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '600' }}>#{order.receiptNumber || order.id || i + 1}</Text>
                      <Text style={{ fontWeight: '600', color: '#10B981' }}>${(order.totalAmount || order.total || 0).toFixed(2)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ color: '#6B7280' }}>{order.customerName || 'Walk-in'}</Text>
                      <Text style={{ color: '#6B7280', fontSize: 13 }}>{order.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {detailModal === 'avgorder' && (
              <View>
                <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#8B5CF6' }}>${(dashboardData?.avgOrderValue || 0).toFixed(2)}</Text>
                <Text style={{ color: '#6B7280', marginTop: 8 }}>Average value per order</Text>
                <View style={{ marginTop: 20 }}>
                  {[
                    { label: 'Total Revenue', value: `$${(dashboardData?.totalRevenue || 0).toLocaleString()}` },
                    { label: 'Total Orders', value: String(dashboardData?.totalOrders || 0) },
                  ].map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                      <Text>{item.label}</Text>
                      <Text style={{ fontWeight: '600' }}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {detailModal === 'weeklysales' && (
              <View>
                <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 16 }}>Revenue by Day (Last 7 Days)</Text>
                {(dashboardData?.dailySales || []).length > 0 ? (
                  (dashboardData?.dailySales || []).map((day: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                      <Text style={{ color: '#374151', flex: 1 }}>{day.date}</Text>
                      <Text style={{ fontWeight: '500', flex: 1, textAlign: 'center' }}>${(day.revenue || 0).toFixed(2)}</Text>
                      <Text style={{ color: '#6B7280', flex: 1, textAlign: 'right' }}>{day.orders || 0} orders</Text>
                    </View>
                  ))
                ) : (
                  <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
                    <Text style={{ color: '#6B7280', marginTop: 12, textAlign: 'center' }}>No weekly sales data yet</Text>
                    <Text style={{ color: '#9CA3AF', marginTop: 8, textAlign: 'center', fontSize: 13 }}>Data appears once sales are recorded</Text>
                  </View>
                )}
              </View>
            )}

            {detailModal === 'employees' && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text>Employees</Text>
                  <Text style={{ fontWeight: '600', color: '#6366F1' }}>{(dashboardData as any)?.totalEmployees || 0}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                  <Text>Checked In</Text>
                  <Text style={{ fontWeight: '600', color: '#10B981' }}>{(dashboardData as any)?.checkedInEmployees || 0}</Text>
                </View>
              </View>
            )}

          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
