import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTransferRequests } from '../hooks/useTransferRequests';
import { TransferFilters } from '../components/transfer';
import { TransferRequestCard } from '../components/transfer/TransferRequestCard';
import { Header } from '../components/shared/Header';
import { BottomNav } from '../components/shared/BottomNav';
import { Colors } from '../constants/Colors';
import { TransferRequest, TransferFilters as ITransferFilters } from '../types/transfer';

export default function TransferRequestsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showFilters, setShowFilters] = useState(false);

  const {
    transfers,
    loading,
    error,
    refreshing,
    hasMore,
    filters,
    refresh,
    loadMore,
    applyFilters,
    clearFilters,
  } = useTransferRequests();

  // Check authentication
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 [TransferRequests] Screen focused - refreshing data');
      refresh();
    }, [refresh])
  );

  const handleCardPress = (transfer: TransferRequest) => {
    router.push(`/transfer-detail/${transfer.id}`);
  };

  const handleCreatePress = () => {
    router.push('/transfer-request-create');
  };

  const handleFilterApply = (newFilters: ITransferFilters) => {
    applyFilters(newFilters);
    setShowFilters(false);
  };

  const handleFilterClear = () => {
    clearFilters();
    setShowFilters(false);
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="file-tray-outline" size={64} color={Colors.lightGray} />
        <Text style={styles.emptyTitle}>No Transfer Requests</Text>
        <Text style={styles.emptyText}>
          {filters && Object.keys(filters).length > 0
            ? 'No transfers match your filters'
            : 'Create your first transfer request to get started'}
        </Text>
        {(!filters || Object.keys(filters).length === 0) && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleCreatePress}
          >
            <Ionicons name="add-circle" size={20} color={Colors.white} />
            <Text style={styles.emptyButtonText}>Create Transfer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!filters || Object.keys(filters).length === 0) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <Text style={styles.activeFiltersText}>
          Filters active • {transfers.length} result{transfers.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={handleFilterClear}>
          <Text style={styles.clearFiltersText}>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header 
        title="Transfer Requests" 
        showBackButton={true}
        rightElement={
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Ionicons 
              name={showFilters ? "close" : "filter"} 
              size={24} 
              color={Colors.primary} 
            />
          </TouchableOpacity>
        }
      />

      {showFilters && (
        <View style={styles.filtersContainer}>
          <TransferFilters
            filters={filters || {}}
            onApply={handleFilterApply}
            onClear={handleFilterClear}
          />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={transfers}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <TransferRequestCard
              transfer={item}
              onPress={handleCardPress}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          transfers.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.lightBlue,
  },
  activeFiltersText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 140, // Space for bottom nav (60px) + FAB
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 76, // Above bottom nav (60px) + margin (16px)
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
