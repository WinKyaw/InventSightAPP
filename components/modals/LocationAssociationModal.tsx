import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { StoreService, Store } from '../../services/api/storeService';
import { WarehouseService } from '../../services/api/warehouse';
import { WarehouseSummary } from '../../types/warehouse';
import { PredefinedItemsService } from '../../services/api/predefinedItemsService';

interface LocationAssociationModalProps {
  visible: boolean;
  onClose: () => void;
  itemIds: string[];  // Can be single or multiple items
  itemNames?: string[];  // For display in modal title
  onSuccess: () => void;
}

export const LocationAssociationModal: React.FC<LocationAssociationModalProps> = ({
  visible,
  onClose,
  itemIds,
  itemNames,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'stores' | 'warehouses'>('stores');
  
  // Stores state
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [storeSearch, setStoreSearch] = useState('');
  const [loadingStores, setLoadingStores] = useState(false);
  
  // Warehouses state
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  
  // Assignment state
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (visible) {
      loadStores();
      loadWarehouses();
    }
  }, [visible]);

  const loadStores = async () => {
    try {
      setLoadingStores(true);
      const response = await StoreService.getUserStores();
      setStores(response || []);
    } catch (error) {
      console.error('Failed to load stores:', error);
    } finally {
      setLoadingStores(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      const response = await WarehouseService.getWarehouses();
      setWarehouses(response || []);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const toggleWarehouseSelection = (warehouseId: string) => {
    setSelectedWarehouses(prev =>
      prev.includes(warehouseId)
        ? prev.filter(id => id !== warehouseId)
        : [...prev, warehouseId]
    );
  };

  const handleAssign = async () => {
    if (selectedStores.length === 0 && selectedWarehouses.length === 0) {
      Alert.alert('No Selection', 'Please select at least one store or warehouse');
      return;
    }

    try {
      setAssigning(true);

      // Associate each item with selected stores and warehouses
      for (const itemId of itemIds) {
        if (selectedStores.length > 0) {
          await PredefinedItemsService.associateStores(itemId, selectedStores);
        }
        if (selectedWarehouses.length > 0) {
          await PredefinedItemsService.associateWarehouses(itemId, selectedWarehouses);
        }
      }

      Alert.alert(
        'Success',
        `Assigned ${itemIds.length} item(s) to ${selectedStores.length} store(s) and ${selectedWarehouses.length} warehouse(s)`
      );
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to assign locations:', error);
      Alert.alert('Error', error?.message || 'Failed to assign locations');
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedStores([]);
    setSelectedWarehouses([]);
    setStoreSearch('');
    setWarehouseSearch('');
    onClose();
  };

  const filteredStores = stores.filter(store =>
    store.storeName.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  const getModalTitle = () => {
    if (itemIds.length === 1 && itemNames && itemNames.length > 0) {
      return `Assign "${itemNames[0]}" to Locations`;
    }
    return `Assign ${itemIds.length} Items to Locations`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {getModalTitle()}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stores' && styles.tabActive]}
            onPress={() => setActiveTab('stores')}
          >
            <Ionicons
              name="storefront"
              size={20}
              color={activeTab === 'stores' ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'stores' && styles.tabTextActive
            ]}>
              Stores ({selectedStores.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'warehouses' && styles.tabActive]}
            onPress={() => setActiveTab('warehouses')}
          >
            <Ionicons
              name="business"
              size={20}
              color={activeTab === 'warehouses' ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'warehouses' && styles.tabTextActive
            ]}>
              Warehouses ({selectedWarehouses.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'stores' ? (
            <>
              {/* Store Search */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search stores..."
                  value={storeSearch}
                  onChangeText={setStoreSearch}
                  placeholderTextColor={Colors.textSecondary}
                />
                {storeSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setStoreSearch('')}>
                    <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Stores List */}
              {loadingStores ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={filteredStores}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.locationItem}
                      onPress={() => toggleStoreSelection(item.id)}
                    >
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationName}>{item.storeName}</Text>
                        {item.address && (
                          <Text style={styles.locationAddress}>{item.address}</Text>
                        )}
                      </View>
                      <View style={[
                        styles.checkbox,
                        selectedStores.includes(item.id) && styles.checkboxActive
                      ]}>
                        {selectedStores.includes(item.id) && (
                          <Ionicons name="checkmark" size={18} color="white" />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No stores found</Text>
                    </View>
                  }
                />
              )}
            </>
          ) : (
            <>
              {/* Warehouse Search */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search warehouses..."
                  value={warehouseSearch}
                  onChangeText={setWarehouseSearch}
                  placeholderTextColor={Colors.textSecondary}
                />
                {warehouseSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setWarehouseSearch('')}>
                    <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Warehouses List */}
              {loadingWarehouses ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={filteredWarehouses}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.locationItem}
                      onPress={() => toggleWarehouseSelection(item.id)}
                    >
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationName}>{item.name}</Text>
                        {item.location && (
                          <Text style={styles.locationAddress}>{item.location}</Text>
                        )}
                      </View>
                      <View style={[
                        styles.checkbox,
                        selectedWarehouses.includes(item.id) && styles.checkboxActive
                      ]}>
                        {selectedWarehouses.includes(item.id) && (
                          <Ionicons name="checkmark" size={18} color="white" />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No warehouses found</Text>
                    </View>
                  }
                />
              )}
            </>
          )}
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.assignButton,
              (assigning || (selectedStores.length === 0 && selectedWarehouses.length === 0)) && 
                styles.assignButtonDisabled
            ]}
            onPress={handleAssign}
            disabled={assigning || (selectedStores.length === 0 && selectedWarehouses.length === 0)}
          >
            {assigning ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.assignButtonText}>
                Assign to Locations
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  assignButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  assignButtonDisabled: {
    opacity: 0.5,
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
