import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  StatusBar, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/shared/Header';
import { SearchBar } from '../../components/shared/SearchBar';
import { WarehouseInventoryList } from '../../components/warehouse/WarehouseInventoryList';
import { AddWarehouseModal } from '../../components/modals/AddWarehouseModal';
import { WarehouseSummary, WarehouseInventoryRow } from '../../types/warehouse';
import { getWarehouses, getWarehouseInventory } from '../../services/api/warehouse';
import { useApiReadiness } from '../../hooks/useAuthenticatedAPI';
import { useAuth } from '../../context/AuthContext';
import { canManageWarehouses } from '../../utils/permissions';
import { Colors } from '../../constants/Colors';
import { styles as commonStyles } from '../../constants/Styles';

export default function WarehouseScreen() {
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Warehouse: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const canAdd = canManageWarehouses(user?.role);
  const { isReady, isAuthenticating, isUnauthenticated } = useApiReadiness();
  
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseSummary | null>(null);
  const [inventory, setInventory] = useState<WarehouseInventoryRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter inventory based on search query
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) {
      return inventory;
    }

    const query = searchQuery.toLowerCase();
    return inventory.filter(item => 
      item.productName.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query) ||
      item.warehouseName?.toLowerCase().includes(query)
    );
  }, [inventory, searchQuery]);

  // Load warehouses list
  const loadWarehouses = useCallback(async () => {
    if (!isReady) return;

    try {
      const warehousesList = await getWarehouses();
      setWarehouses(warehousesList);

      // Select first warehouse by default if available
      if (warehousesList.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(warehousesList[0]);
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      // Silently fail for warehouses list - it may not be implemented yet
      setWarehouses([]);
    }
  }, [isReady, selectedWarehouse]);

  // Load inventory for selected warehouse
  const loadInventory = useCallback(async (showLoadingState = true) => {
    if (!isReady || !selectedWarehouse) return;

    if (showLoadingState) {
      setLoading(true);
    }
    setError(null);

    try {
      const inventoryData = await getWarehouseInventory(selectedWarehouse.id);
      setInventory(inventoryData);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
      setInventory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isReady, selectedWarehouse]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadWarehouses(),
      loadInventory(false),
    ]);
    setRefreshing(false);
  }, [loadWarehouses, loadInventory]);

  // Load warehouses on mount when auth is ready
  useEffect(() => {
    if (isReady) {
      loadWarehouses();
    }
  }, [isReady, loadWarehouses]);

  // Load inventory when warehouse changes
  useEffect(() => {
    if (isReady && selectedWarehouse) {
      loadInventory();
    }
  }, [isReady, selectedWarehouse, loadInventory]);

  // Handle warehouse selection
  const handleWarehouseSelect = (warehouse: WarehouseSummary) => {
    setSelectedWarehouse(warehouse);
    setShowWarehousePicker(false);
    setSearchQuery(''); // Clear search when switching warehouses
  };

  // Render authentication states
  if (isAuthenticating) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#6366F1" barStyle="light-content" />
        <Header 
          title="Warehouse"
          subtitle="Inventory"
          backgroundColor="#6366F1"
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.statusText}>Authenticating...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isUnauthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#6366F1" barStyle="light-content" />
        <Header 
          title="Warehouse"
          subtitle="Inventory"
          backgroundColor="#6366F1"
        />
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed" size={48} color={Colors.lightGray} />
          <Text style={styles.statusText}>Please log in to view warehouse inventory</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render empty warehouse state
  if (!loading && warehouses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#6366F1" barStyle="light-content" />
        <Header 
          title="Warehouse"
          subtitle="Inventory"
          backgroundColor="#6366F1"
        />
        <View style={styles.centerContainer}>
          <Ionicons name="business-outline" size={64} color={Colors.lightGray} />
          <Text style={styles.emptyTitle}>No Warehouses Available</Text>
          <Text style={styles.emptySubtext}>
            The warehouse management feature is not yet configured.
            {'\n'}Contact your administrator to set up warehouses.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6366F1" barStyle="light-content" />
      
      <Header 
        title="Warehouse"
        subtitle={selectedWarehouse?.name || 'Select Warehouse'}
        backgroundColor="#6366F1"
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {canAdd && (
              <TouchableOpacity 
                style={styles.warehouseButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.warehouseButtonText}>Add Warehouse</Text>
              </TouchableOpacity>
            )}
            {warehouses.length > 0 && (
              <TouchableOpacity 
                style={styles.warehouseButton}
                onPress={() => setShowWarehousePicker(true)}
              >
                <Ionicons name="business" size={20} color="#fff" />
                <Text style={styles.warehouseButtonText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <SearchBar
        placeholder="Search by product, SKU, or warehouse..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading && inventory.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.statusText}>Loading inventory...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorTitle}>Failed to Load Inventory</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadInventory()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          <WarehouseInventoryList
            inventory={filteredInventory}
          />
          {refreshing && (
            <View style={styles.refreshOverlay}>
              <ActivityIndicator size="small" color="#6366F1" />
            </View>
          )}
        </View>
      )}

      {/* Warehouse Picker Modal */}
      <Modal
        visible={showWarehousePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWarehousePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Warehouse</Text>
              <TouchableOpacity onPress={() => setShowWarehousePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.warehouseList}>
              {warehouses.map((warehouse) => (
                <TouchableOpacity
                  key={warehouse.id}
                  style={[
                    styles.warehouseItem,
                    selectedWarehouse?.id === warehouse.id && styles.warehouseItemSelected,
                  ]}
                  onPress={() => handleWarehouseSelect(warehouse)}
                >
                  <View style={styles.warehouseItemContent}>
                    <Ionicons 
                      name="business" 
                      size={24} 
                      color={selectedWarehouse?.id === warehouse.id ? '#6366F1' : Colors.textSecondary} 
                    />
                    <View style={styles.warehouseItemText}>
                      <Text style={[
                        styles.warehouseName,
                        selectedWarehouse?.id === warehouse.id && styles.warehouseNameSelected,
                      ]}>
                        {warehouse.name}
                      </Text>
                      {warehouse.location && (
                        <Text style={styles.warehouseLocation}>{warehouse.location}</Text>
                      )}
                    </View>
                  </View>
                  {selectedWarehouse?.id === warehouse.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Warehouse Modal */}
      <AddWarehouseModal 
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onWarehouseAdded={handleRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warehouseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  warehouseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  listWrapper: {
    flex: 1,
    position: 'relative',
  },
  refreshOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  warehouseList: {
    padding: 16,
  },
  warehouseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  warehouseItemSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  warehouseItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  warehouseItemText: {
    flex: 1,
    marginLeft: 12,
  },
  warehouseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  warehouseNameSelected: {
    color: '#6366F1',
  },
  warehouseLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
