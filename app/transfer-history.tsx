import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { TransferFilters } from '../components/transfer';
import { TransferRequestCard } from '../components/transfer/TransferRequestCard';
import { Header } from '../components/shared/Header';
import { Colors } from '../constants/Colors';
import {
  TransferRequest,
  TransferFilters as ITransferFilters,
  TransferHistorySummary,
} from '../types/transfer';
import {
  getTransferRequests,
  getTransferSummary,
} from '../services/api/transferRequestService';

export default function TransferHistoryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [summary, setSummary] = useState<TransferHistorySummary | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ITransferFilters>({
    status: 'ALL',
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadTransfers(), loadSummary()]);
    } catch (error) {
      console.error('Error loading history data:', error);
      Alert.alert('Error', 'Failed to load transfer history');
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    try {
      const response = await getTransferRequests(filters, 0, 50);
      setTransfers(response.items || []);
    } catch (error) {
      console.error('Error loading transfers:', error);
      throw error;
    }
  };

  const loadSummary = async () => {
    try {
      const data = await getTransferSummary(filters);
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
      throw error;
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [filters]);

  const handleFilterApply = async (newFilters: ITransferFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    
    try {
      setLoading(true);
      const response = await getTransferRequests(newFilters, 0, 50);
      setTransfers(response.items || []);
      
      const summaryData = await getTransferSummary(newFilters);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error applying filters:', error);
      Alert.alert('Error', 'Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClear = async () => {
    const emptyFilters: ITransferFilters = { status: 'ALL' };
    setFilters(emptyFilters);
    setShowFilters(false);
    
    try {
      setLoading(true);
      const response = await getTransferRequests(emptyFilters, 0, 50);
      setTransfers(response.items || []);
      
      const summaryData = await getTransferSummary(emptyFilters);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error clearing filters:', error);
      Alert.alert('Error', 'Failed to clear filters');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (transfer: TransferRequest) => {
    router.push(`/transfer-detail/${transfer.id}`);
  };

  const handleExportCSV = () => {
    Alert.alert('Coming Soon', 'CSV export feature will be available soon!');
  };

  const handleExportPDF = () => {
    Alert.alert('Coming Soon', 'PDF export feature will be available soon!');
  };

  const formatAvgTime = (hours: number): string => {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Transfer History"
        showBackButton
        rightElement={
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Ionicons
              name={showFilters ? 'close' : 'filter'}
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        }
      />

      {showFilters && (
        <View style={styles.filtersContainer}>
          <TransferFilters
            filters={filters}
            onApply={handleFilterApply}
            onClear={handleFilterClear}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Summary Statistics */}
        {summary && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Summary Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
                <Ionicons name="analytics" size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{summary.totalTransfers}</Text>
                <Text style={styles.statLabel}>Total Transfers</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
                <Ionicons name="time" size={24} color={Colors.warning} />
                <Text style={styles.statValue}>{summary.pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
                <Ionicons name="checkmark-done" size={24} color={Colors.success} />
                <Text style={styles.statValue}>{summary.completedCount}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: Colors.purple }]}>
                <Ionicons name="car" size={24} color={Colors.purple} />
                <Text style={styles.statValue}>{summary.inTransitCount}</Text>
                <Text style={styles.statLabel}>In Transit</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: Colors.accent }]}>
                <Ionicons name="speedometer" size={24} color={Colors.accent} />
                <Text style={styles.statValue}>
                  {formatAvgTime(summary.avgDeliveryTime)}
                </Text>
                <Text style={styles.statLabel}>Avg Delivery Time</Text>
              </View>
            </View>

            {/* Top Requested Items */}
            {summary.topRequestedItems && summary.topRequestedItems.length > 0 && (
              <View style={styles.topItemsSection}>
                <Text style={styles.subsectionTitle}>Top Requested Items</Text>
                {summary.topRequestedItems.slice(0, 5).map((item, index) => (
                  <View key={index} style={styles.topItem}>
                    <View style={styles.topItemRank}>
                      <Text style={styles.topItemRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.topItemInfo}>
                      <Text style={styles.topItemName}>{item.itemName}</Text>
                      <Text style={styles.topItemSku}>SKU: {item.sku}</Text>
                    </View>
                    <View style={styles.topItemCount}>
                      <Text style={styles.topItemCountText}>{item.count}</Text>
                      <Text style={styles.topItemCountLabel}>transfers</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Most Active Routes */}
            {summary.mostActiveRoutes && summary.mostActiveRoutes.length > 0 && (
              <View style={styles.topItemsSection}>
                <Text style={styles.subsectionTitle}>Most Active Routes</Text>
                {summary.mostActiveRoutes.slice(0, 5).map((route, index) => (
                  <View key={index} style={styles.routeItem}>
                    <View style={styles.routeRank}>
                      <Text style={styles.routeRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.routeInfo}>
                      <View style={styles.routePath}>
                        <Text style={styles.routeLocation}>{route.from}</Text>
                        <Ionicons name="arrow-forward" size={14} color={Colors.gray} />
                        <Text style={styles.routeLocation}>{route.to}</Text>
                      </View>
                    </View>
                    <View style={styles.routeCount}>
                      <Text style={styles.routeCountText}>{route.count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Export Buttons */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Export Data</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportCSV}
            >
              <Ionicons name="document-text" size={20} color={Colors.primary} />
              <Text style={styles.exportButtonText}>Export CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportPDF}
            >
              <Ionicons name="document" size={20} color={Colors.primary} />
              <Text style={styles.exportButtonText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transfers List */}
        <View style={styles.transfersSection}>
          <Text style={styles.transfersTitle}>
            Transfer History ({transfers.length})
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading transfers...</Text>
            </View>
          ) : transfers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={48} color={Colors.lightGray} />
              <Text style={styles.emptyText}>No transfers found</Text>
            </View>
          ) : (
            <View style={styles.transfersList}>
              {transfers.map((transfer) => (
                <View key={transfer.id} style={styles.transferCardContainer}>
                  <TransferRequestCard
                    transfer={transfer}
                    onPress={handleCardPress}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: 16,
    maxHeight: '60%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  topItemsSection: {
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  topItemSku: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topItemCount: {
    alignItems: 'flex-end',
  },
  topItemCountText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  topItemCountLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  routeRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
  },
  routeInfo: {
    flex: 1,
  },
  routePath: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeLocation: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  routeCount: {
    backgroundColor: Colors.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  routeCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  exportSection: {
    marginBottom: 24,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  transfersSection: {
    marginBottom: 16,
  },
  transfersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  transfersList: {
    gap: 12,
  },
  transferCardContainer: {
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
