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
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/shared/Header';
import { SearchBar } from '../../components/shared/SearchBar';
import { WarehouseInventoryList } from '../../components/warehouse/WarehouseInventoryList';
import { AddWarehouseModal } from '../../components/modals/AddWarehouseModal';
import { WarehouseSummary, WarehouseInventoryRow, WarehouseRestock, WarehouseSale } from '../../types/warehouse';
import WarehouseService from '../../services/api/warehouse';
import { useApiReadiness } from '../../hooks/useAuthenticatedAPI';
import { useAuth } from '../../context/AuthContext';
import { canManageWarehouses } from '../../utils/permissions';
import { Colors } from '../../constants/Colors';
import { styles as commonStyles } from '../../constants/Styles';
import { ProductService } from '../../services/api/productService';

type TabType = 'inventory' | 'restocks' | 'sales';

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
  console.log('🔍 Warehouse - Permission Check:');
  console.log('  - User:', user?.email || 'Not logged in');
  console.log('  - Role:', user?.role || 'undefined');
  console.log('  - Can Manage Warehouses:', canAdd);
  
  const { isReady, isAuthenticating, isUnauthenticated } = useApiReadiness();
  
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseSummary | null>(null);
  const [inventory, setInventory] = useState<WarehouseInventoryRow[]>([]);
  const [restocks, setRestocks] = useState<WarehouseRestock[]>([]);
  const [sales, setSales] = useState<WarehouseSale[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add Inventory modal state
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [newInventoryItem, setNewInventoryItem] = useState({
    productId: '',
    productName: '',
    quantity: '',
    notes: '',
  });
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

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

  // Filter restocks based on search query
  const filteredRestocks = useMemo(() => {
    if (!searchQuery.trim()) {
      return restocks;
    }

    const query = searchQuery.toLowerCase();
    return restocks.filter(item => 
      item.productName?.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query)
    );
  }, [restocks, searchQuery]);

  // Filter sales based on search query
  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) {
      return sales;
    }

    const query = searchQuery.toLowerCase();
    return sales.filter(item => 
      item.receiptNumber?.toLowerCase().includes(query) ||
      item.customerName?.toLowerCase().includes(query)
    );
  }, [sales, searchQuery]);

  // Load warehouses list
  const loadWarehouses = useCallback(async () => {
    if (!isReady) return;

    try {
      console.log('🏢 Loading warehouses...');
      const warehousesList = await WarehouseService.getWarehouses();
      
      console.log('📦 Warehouses loaded:', warehousesList.length);
      
      // Ensure we always have an array
      if (Array.isArray(warehousesList)) {
        setWarehouses(warehousesList);
        
        // Select first warehouse by default if available
        if (warehousesList.length > 0 && !selectedWarehouse) {
          console.log('📍 Auto-selecting first warehouse:', warehousesList[0].name);
          setSelectedWarehouse(warehousesList[0]);
        }
      } else {
        console.warn('⚠️ Unexpected warehouse response format:', warehousesList);
        setWarehouses([]);
      }
    } catch (err) {
      console.error('❌ Failed to load warehouses:', err);
      // Silently fail for warehouses list - it may not be implemented yet
      setWarehouses([]);
    }
  }, [isReady, selectedWarehouse]);

  // Load inventory for selected warehouse
  const loadInventory = useCallback(async (showLoadingState = true, forceRefresh = false) => {
    if (!isReady || !selectedWarehouse) return;

    if (showLoadingState) {
      setTabLoading(true);
    }
    setError(null);

    try {
      const inventoryData = await WarehouseService.getWarehouseInventory(selectedWarehouse.id, forceRefresh);
      setInventory(inventoryData);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
      setInventory([]);
    } finally {
      setTabLoading(false);
      setRefreshing(false);
    }
  }, [isReady, selectedWarehouse]);

  // Load restocks for selected warehouse
  const loadRestocks = useCallback(async (showLoadingState = true, forceRefresh = false) => {
    if (!isReady || !selectedWarehouse) return;

    if (showLoadingState) {
      setTabLoading(true);
    }
    setError(null);

    try {
      const restocksData = await WarehouseService.getWarehouseRestocks(selectedWarehouse.id, forceRefresh);
      setRestocks(restocksData);
    } catch (err) {
      console.error('Failed to load restocks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load restocks');
      setRestocks([]);
    } finally {
      setTabLoading(false);
      setRefreshing(false);
    }
  }, [isReady, selectedWarehouse]);

  // Load sales for selected warehouse
  const loadSales = useCallback(async (showLoadingState = true, forceRefresh = false) => {
    if (!isReady || !selectedWarehouse) return;

    if (showLoadingState) {
      setTabLoading(true);
    }
    setError(null);

    try {
      const salesData = await WarehouseService.getWarehouseSales(selectedWarehouse.id, forceRefresh);
      setSales(salesData);
    } catch (err) {
      console.error('Failed to load sales:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sales');
      setSales([]);
    } finally {
      setTabLoading(false);
      setRefreshing(false);
    }
  }, [isReady, selectedWarehouse]);

  // Load data based on active tab
  const loadTabData = useCallback(async (showLoadingState = true, forceRefresh = false) => {
    switch (activeTab) {
      case 'inventory':
        await loadInventory(showLoadingState, forceRefresh);
        break;
      case 'restocks':
        await loadRestocks(showLoadingState, forceRefresh);
        break;
      case 'sales':
        await loadSales(showLoadingState, forceRefresh);
        break;
    }
  }, [activeTab, loadInventory, loadRestocks, loadSales]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadWarehouses(),
      loadTabData(false),
    ]);
    setRefreshing(false);
  }, [loadWarehouses, loadTabData]);

  // Load warehouses on mount when auth is ready
  useEffect(() => {
    if (isReady) {
      loadWarehouses();
    }
  }, [isReady, loadWarehouses]);

  // Load data when warehouse or tab changes
  useEffect(() => {
    if (isReady && selectedWarehouse) {
      loadTabData();
    }
  }, [isReady, selectedWarehouse, activeTab, loadTabData]);

  // Load products when Add Inventory modal opens
  useEffect(() => {
    if (showAddInventoryModal && products.length === 0) {
      loadProducts();
    }
  }, [showAddInventoryModal]);

  // Load products for inventory addition
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      console.log('📦 Loading products for inventory addition...');
      // Note: Loading 100 products for simplicity. In production, consider implementing
      // pagination or search functionality as the product catalog grows.
      const response = await ProductService.getAllProducts(1, 100);
      setProducts(response.products || []);
      console.log(`✅ Loaded ${response.products?.length || 0} products`);
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle add inventory
  const handleAddInventory = async () => {
    console.log('🔍 Add inventory form data:');
    console.log('  Product:', newInventoryItem.productName);
    console.log('  Quantity:', newInventoryItem.quantity);

    if (!selectedWarehouse) {
      Alert.alert('Error', 'Please select a warehouse first');
      return;
    }

    if (!newInventoryItem.productId || !newInventoryItem.quantity) {
      Alert.alert('Validation Error', 'Please select a product and enter quantity');
      return;
    }

    const quantity = parseInt(newInventoryItem.quantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Validation Error', 'Quantity must be a positive number');
      return;
    }

    try {
      console.log('➕ Adding inventory to warehouse:', selectedWarehouse.id);
      
      await WarehouseService.addInventory({
        warehouseId: selectedWarehouse.id,
        productId: newInventoryItem.productId,
        quantity: quantity,
        notes: newInventoryItem.notes || undefined,
      });

      Alert.alert('Success', 'Inventory added successfully');
      setShowAddInventoryModal(false);
      setNewInventoryItem({ productId: '', productName: '', quantity: '', notes: '' });
      
      // Reload data with force refresh (bypasses cache)
      await loadTabData(true, true);
    } catch (error: any) {
      console.error('❌ Error adding inventory:', error.message);
      Alert.alert('Error', `Failed to add inventory: ${error.message}`);
    }
  };

  // Handle warehouse selection
  const handleWarehouseSelect = (warehouse: WarehouseSummary) => {
    setSelectedWarehouse(warehouse);
    setShowWarehousePicker(false);
    setSearchQuery(''); // Clear search when switching warehouses
  };

  // Helper function to check if current tab data is empty
  const isCurrentTabEmpty = useCallback(() => {
    switch (activeTab) {
      case 'inventory':
        return inventory.length === 0;
      case 'restocks':
        return restocks.length === 0;
      case 'sales':
        return sales.length === 0;
      default:
        return true;
    }
  }, [activeTab, inventory.length, restocks.length, sales.length]);

  // Render restock item
  const renderRestockItem = ({ item }: { item: WarehouseRestock }) => (
    <View style={styles.listItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.itemQuantityPositive}>+{item.quantity}</Text>
      </View>
      {item.sku && <Text style={styles.itemSku}>SKU: {item.sku}</Text>}
      <Text style={styles.itemDate}>
        {new Date(item.restockDate || item.createdAt || '').toLocaleDateString()}
      </Text>
      {item.notes && <Text style={styles.itemNotes}>📝 {item.notes}</Text>}
    </View>
  );

  // Render sale item
  const renderSaleItem = ({ item }: { item: WarehouseSale }) => (
    <View style={styles.listItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>
          {item.receiptNumber || `Sale #${item.id}`}
        </Text>
        <Text style={styles.itemTotal}>${(item.totalAmount || 0).toFixed(2)}</Text>
      </View>
      <Text style={styles.itemDate}>
        {new Date(item.saleDate || item.createdAt || '').toLocaleDateString()}
      </Text>
      {item.customerName && (
        <Text style={styles.itemCustomer}>👤 {item.customerName}</Text>
      )}
    </View>
  );

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
  if (!loading && (!warehouses || warehouses.length === 0)) {
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
          </Text>
          
          {/* Debug Info in Development Mode */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>Debug Info:</Text>
              <Text style={styles.debugText}>User ID: {user?.id || 'Not logged in'}</Text>
              <Text style={styles.debugText}>Role: {user?.role || 'undefined'}</Text>
              <Text style={styles.debugText}>Can Add: {canAdd ? 'YES' : 'NO'}</Text>
            </View>
          )}
          
          {canAdd ? (
            <>
              <Text style={styles.emptySubtext}>
                Click the button below to create your first warehouse.
              </Text>
              <TouchableOpacity 
                style={styles.addWarehouseButton}
                onPress={() => {
                  console.log('➕ Add Warehouse button clicked');
                  setShowAddModal(true);
                }}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addWarehouseButtonText}>Add Warehouse</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.emptySubtext}>
              Contact your administrator to set up warehouses.
            </Text>
          )}
          
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        
        {/* Add Warehouse Modal */}
        <AddWarehouseModal 
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onWarehouseAdded={handleRefresh}
        />
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
            {warehouses && warehouses.length > 0 && (
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
          onPress={() => setActiveTab('inventory')}
        >
          <Ionicons 
            name="cube-outline" 
            size={20} 
            color={activeTab === 'inventory' ? '#6366F1' : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'restocks' && styles.activeTab]}
          onPress={() => setActiveTab('restocks')}
        >
          <Ionicons 
            name="arrow-down-circle-outline" 
            size={20} 
            color={activeTab === 'restocks' ? '#6366F1' : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'restocks' && styles.activeTabText]}>
            Restocks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
          onPress={() => setActiveTab('sales')}
        >
          <Ionicons 
            name="cash-outline" 
            size={20} 
            color={activeTab === 'sales' ? '#6366F1' : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>
            Sales
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {tabLoading && isCurrentTabEmpty() ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.statusText}>Loading {activeTab}...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorTitle}>Failed to Load {activeTab}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadTabData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          {activeTab === 'inventory' && (
            <>
              <WarehouseInventoryList inventory={filteredInventory} />
              {canAdd && selectedWarehouse && (
                <TouchableOpacity
                  style={styles.addInventoryButton}
                  onPress={() => setShowAddInventoryModal(true)}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addInventoryButtonText}>Add Inventory</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {activeTab === 'restocks' && (
            <FlatList
              data={filteredRestocks}
              renderItem={renderRestockItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.flatListContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="arrow-down-circle-outline" size={64} color={Colors.lightGray} />
                  <Text style={styles.emptyTitle}>No Restocks Found</Text>
                  <Text style={styles.emptySubtext}>
                    No restock records available for this warehouse.
                  </Text>
                </View>
              }
            />
          )}
          {activeTab === 'sales' && (
            <FlatList
              data={filteredSales}
              renderItem={renderSaleItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.flatListContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="cash-outline" size={64} color={Colors.lightGray} />
                  <Text style={styles.emptyTitle}>No Sales Found</Text>
                  <Text style={styles.emptySubtext}>
                    No sales records available for this warehouse.
                  </Text>
                </View>
              }
            />
          )}
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
              {warehouses && warehouses.length > 0 ? (
                warehouses.map((warehouse) => (
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
                ))
              ) : (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptySubtext}>No warehouses available</Text>
                </View>
              )}
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

      {/* Add Inventory Modal */}
      <Modal
        visible={showAddInventoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddInventoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ Add Inventory</Text>
              <TouchableOpacity onPress={() => setShowAddInventoryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.modalSubtitle}>
                Warehouse: {selectedWarehouse?.name}
              </Text>

              {/* Product Dropdown - Simplified using TextInput for now */}
              <Text style={styles.inputLabel}>Product *</Text>
              {loadingProducts ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.productPicker} nestedScrollEnabled>
                    {products.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={[
                          styles.productOption,
                          newInventoryItem.productId === product.id.toString() && styles.productOptionSelected,
                        ]}
                        onPress={() => {
                          setNewInventoryItem({
                            ...newInventoryItem,
                            productId: product.id.toString(),
                            productName: product.name,
                          });
                        }}
                      >
                        <Text style={[
                          styles.productOptionText,
                          newInventoryItem.productId === product.id.toString() && styles.productOptionTextSelected,
                        ]}>
                          {product.name} {product.sku ? `(${product.sku})` : ''}
                        </Text>
                        {newInventoryItem.productId === product.id.toString() && (
                          <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.inputLabel}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                value={newInventoryItem.quantity}
                onChangeText={(text) => {
                  setNewInventoryItem({ ...newInventoryItem, quantity: text });
                }}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes about this inventory addition"
                value={newInventoryItem.notes}
                onChangeText={(text) => {
                  setNewInventoryItem({ ...newInventoryItem, notes: text });
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddInventoryModal(false);
                    setNewInventoryItem({ productId: '', productName: '', quantity: '', notes: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddInventory}
                >
                  <Text style={styles.saveButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addWarehouseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    gap: 8,
  },
  addWarehouseButtonText: {
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
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  activeTab: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  // List item styles
  flatListContent: {
    padding: 16,
  },
  listItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  itemQuantityPositive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  itemSku: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  itemCustomer: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  debugInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  // Add Inventory Button
  addInventoryButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  addInventoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Form Styles
  modalForm: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    maxHeight: 200,
  },
  productPicker: {
    maxHeight: 180,
  },
  productOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  productOptionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  productOptionTextSelected: {
    fontWeight: '600',
    color: '#6366F1',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
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
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
