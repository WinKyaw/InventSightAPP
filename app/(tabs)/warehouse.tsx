import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/shared/Header';
import { SearchBar } from '../../components/shared/SearchBar';
import { WarehouseInventoryList } from '../../components/warehouse/WarehouseInventoryList';
import { AddWarehouseModal } from '../../components/modals/AddWarehouseModal';
import { WarehouseSummary, WarehouseInventoryRow, WarehouseRestock, WarehouseSale } from '../../types/warehouse';
import WarehouseService, { WarehouseAdditionTransactionType, WarehouseWithdrawalTransactionType } from '../../services/api/warehouse';
import { useApiReadiness } from '../../hooks/useAuthenticatedAPI';
import { useAuth } from '../../context/AuthContext';
import { canManageWarehouses } from '../../utils/permissions';
import { Colors } from '../../constants/Colors';
import { styles as commonStyles } from '../../constants/Styles';
import { ProductService } from '../../services/api/productService';

type TabType = 'inventory' | 'restocks' | 'sales';

// Debounce delay for tab switching (prevents rapid-fire API calls)
const TAB_SWITCH_DEBOUNCE_MS = 300;

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

  // ✅ Memoize permission check (only recalculates when user.role changes)
  const canAdd = useMemo(() => {
    const result = canManageWarehouses(user?.role);
    
    // Only log once when role changes
    console.log('🔍 Warehouse - Permission Check:');
    console.log('  - User:', user?.email || 'Not logged in');
    console.log('  - Role:', user?.role || 'undefined');
    console.log('  - Can Manage Warehouses:', result);
    
    return result;
  }, [user?.role]); // ✅ Only depends on role
  
  const { isReady, isAuthenticating, isUnauthenticated } = useApiReadiness();
  
  // Debounce timer and loading ref
  const tabSwitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);
  
  // Helper to clear the debounce timer
  const clearTabSwitchTimer = useCallback(() => {
    if (tabSwitchTimer.current) {
      clearTimeout(tabSwitchTimer.current);
      tabSwitchTimer.current = null;
    }
  }, []);
  
  // Helper to check if error is an axios error with specific status
  const isAxiosErrorWithStatus = (error: unknown, status: number): boolean => {
    return error !== null && 
      typeof error === 'object' && 
      'response' in error && 
      error.response !== null &&
      typeof error.response === 'object' && 
      'status' in error.response && 
      error.response.status === status;
  };
  
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
    transactionType: WarehouseAdditionTransactionType.RECEIPT, // ✅ Default to RECEIPT
    notes: '',
  });
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [warehouseProducts, setWarehouseProducts] = useState<any[]>([]); // ✅ Products in current warehouse

  // Withdraw Inventory modal state
  const [showWithdrawInventoryModal, setShowWithdrawInventoryModal] = useState(false);
  const [withdrawInventoryItem, setWithdrawInventoryItem] = useState<{
    productId: string;
    productName: string;
    quantity: string;
    transactionType: WarehouseWithdrawalTransactionType;
    notes: string;
    maxQuantity: number;
  }>({
    productId: '',
    productName: '',
    quantity: '',
    transactionType: WarehouseWithdrawalTransactionType.ISSUE, // ✅ Default to ISSUE (valid enum)
    notes: '',
    maxQuantity: 0,
  });

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

  // Load data based on active tab with debouncing support
  const loadTabData = useCallback(async (showLoadingState = true, forceRefresh = false) => {
    if (!isReady || !selectedWarehouse) {
      console.log('⏭️ Not ready or no warehouse selected, skipping load');
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoadingRef.current && !forceRefresh) {
      console.log('⏭️ Already loading, skipping duplicate request');
      return;
    }

    try {
      isLoadingRef.current = true;
      if (showLoadingState) {
        setTabLoading(true);
      }
      setError(null);
      
      console.log(`📦 Loading ${activeTab} for warehouse: ${selectedWarehouse.id} (forceRefresh: ${forceRefresh})`);

      switch (activeTab) {
        case 'inventory':
          const inventory = await WarehouseService.getWarehouseInventory(
            selectedWarehouse.id,
            forceRefresh
          );
          console.log(`✅ Loaded ${inventory.length} inventory items`);
          setInventory(inventory);
          break;

        case 'restocks':
          const restocks = await WarehouseService.getWarehouseRestocks(
            selectedWarehouse.id,
            forceRefresh
          );
          console.log(`✅ Loaded ${restocks.length} restocks`);
          setRestocks(restocks);
          break;

        case 'sales':
          const sales = await WarehouseService.getWarehouseSales(
            selectedWarehouse.id,
            forceRefresh
          );
          console.log(`✅ Loaded ${sales.length} sales`);
          setSales(sales);
          break;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error loading tab data:', errorMessage);
      
      // Don't show error for 404 (not found) responses
      if (!isAxiosErrorWithStatus(error, 404)) {
        setError(errorMessage);
      }
    } finally {
      setTabLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  }, [isReady, selectedWarehouse, activeTab]);

  // Debounced version - waits 300ms before executing
  const debouncedLoadTabData = useCallback((forceRefresh: boolean = false) => {
    // Clear any pending timer
    clearTabSwitchTimer();
    console.log('⏰ Clearing previous tab switch timer');

    // Set new timer
    tabSwitchTimer.current = setTimeout(() => {
      console.log('✅ Debounce complete, loading tab data');
      loadTabData(true, forceRefresh);
    }, TAB_SWITCH_DEBOUNCE_MS);
  }, [loadTabData, clearTabSwitchTimer]);

  // Refresh handler with force refresh
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Pull-to-refresh triggered');
    setRefreshing(true);
    await Promise.all([
      loadWarehouses(),
      loadTabData(false, true), // Force refresh (bypass cache)
    ]);
    setRefreshing(false);
  }, [loadWarehouses, loadTabData]);

  // Load warehouses on mount when auth is ready
  useEffect(() => {
    if (isReady) {
      loadWarehouses();
    }
  }, [isReady, loadWarehouses]);

  // Load data when warehouse or tab changes (with debouncing)
  useEffect(() => {
    if (isReady && selectedWarehouse && activeTab) {
      console.log(`🔄 Tab/Warehouse changed: ${activeTab} - ${selectedWarehouse.name}`);
      debouncedLoadTabData(false);
    }

    // Cleanup timer on unmount or before next effect
    return () => clearTabSwitchTimer();
  }, [isReady, selectedWarehouse, activeTab, debouncedLoadTabData, clearTabSwitchTimer]);

  // Load products when Add Inventory or Withdraw Inventory modal opens
  useEffect(() => {
    if ((showAddInventoryModal || showWithdrawInventoryModal) && products.length === 0) {
      loadProducts();
    }
  }, [showAddInventoryModal, showWithdrawInventoryModal]);

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

  // ✅ Load products from current warehouse inventory (not all products)
  const loadWarehouseProducts = useCallback(async () => {
    if (!selectedWarehouse) return;

    try {
      console.log('📦 Loading products for warehouse:', selectedWarehouse.id);
      
      // Get inventory items for this warehouse
      const inventoryItems = await WarehouseService.getWarehouseInventory(
        selectedWarehouse.id,
        false // Use cache
      );
      
      // Extract unique products with available quantity
      const productsInWarehouse = inventoryItems
        .filter(item => (item.availableQuantity || item.quantity) > 0)
        .map(item => ({
          id: item.productId,
          name: item.productName,
          availableQuantity: item.availableQuantity || item.quantity,
          sku: item.sku,
        }));
      
      console.log(`✅ Found ${productsInWarehouse.length} products in warehouse`);
      setWarehouseProducts(productsInWarehouse);
      
    } catch (error: any) {
      console.error('❌ Error loading warehouse products:', error.message);
      setWarehouseProducts([]);
    }
  }, [selectedWarehouse]);

  // Handle tab switch with debouncing
  const handleTabSwitch = useCallback((tab: 'inventory' | 'restocks' | 'sales') => {
    console.log(`🔄 User clicked tab: ${tab}`);
    
    // Update active tab immediately for UI
    setActiveTab(tab);
    
    // Note: useEffect will trigger debouncedLoadTabData automatically
  }, []);

  // Handle add inventory
  const handleAddInventory = async () => {
    console.log('🔍 Add inventory form data:');
    console.log('  Product:', newInventoryItem.productName);
    console.log('  Quantity:', newInventoryItem.quantity);
    console.log('  Transaction Type:', newInventoryItem.transactionType);

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
        transactionType: newInventoryItem.transactionType, // ✅ Pass transaction type
        notes: newInventoryItem.notes || undefined,
      });

      Alert.alert('Success', 'Inventory added successfully');
      setShowAddInventoryModal(false);
      setNewInventoryItem({
        productId: '',
        productName: '',
        quantity: '',
        transactionType: WarehouseAdditionTransactionType.RECEIPT, // Reset to default
        notes: '',
      });
      
      // Reload data with force refresh (bypasses cache)
      await loadTabData(true, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error adding inventory:', errorMessage);
      Alert.alert('Error', `Failed to add inventory: ${errorMessage}`);
    }
  };

  // Handle withdraw inventory
  const handleWithdrawInventory = async () => {
    console.log('🔍 Withdraw inventory form data:');
    console.log('  Product:', withdrawInventoryItem.productName);
    console.log('  Quantity:', withdrawInventoryItem.quantity);
    console.log('  Transaction Type:', withdrawInventoryItem.transactionType);
    console.log('  Max Available:', withdrawInventoryItem.maxQuantity);

    if (!selectedWarehouse) {
      Alert.alert('Error', 'Please select a warehouse first');
      return;
    }

    if (!withdrawInventoryItem.productId || !withdrawInventoryItem.quantity) {
      Alert.alert('Validation Error', 'Please select a product and enter quantity');
      return;
    }

    const quantity = parseInt(withdrawInventoryItem.quantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Validation Error', 'Quantity must be a positive number');
      return;
    }

    // ✅ Validate against available quantity
    if (quantity > withdrawInventoryItem.maxQuantity) {
      Alert.alert(
        'Insufficient Quantity',
        `Cannot withdraw ${quantity} units. Only ${withdrawInventoryItem.maxQuantity} available.`
      );
      return;
    }

    try {
      console.log('➖ Withdrawing inventory from warehouse:', selectedWarehouse.id);
      
      await WarehouseService.withdrawInventory({
        warehouseId: selectedWarehouse.id,
        productId: withdrawInventoryItem.productId,
        quantity: quantity,
        transactionType: withdrawInventoryItem.transactionType,
        notes: withdrawInventoryItem.notes || undefined,
      });

      Alert.alert('Success', 'Inventory withdrawn successfully');
      setShowWithdrawInventoryModal(false);
      setWithdrawInventoryItem({
        productId: '',
        productName: '',
        quantity: '',
        transactionType: WarehouseWithdrawalTransactionType.ISSUE,
        notes: '',
        maxQuantity: 0,
      });
      
      // Reload data with force refresh (bypasses cache)
      await loadTabData(true, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error withdrawing inventory:', errorMessage);
      Alert.alert('Error', `Failed to withdraw inventory: ${errorMessage}`);
    }
  };

  // ✅ Open withdraw modal and load warehouse products
  const handleOpenWithdrawModal = () => {
    loadWarehouseProducts();
    setShowWithdrawInventoryModal(true);
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

  // Shared utility function to format date and time
  const formatDateTime = useCallback((dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${dateStr} at ${timeStr}`;
    } catch (error) {
      return dateString;
    }
  }, []);

  // Shared utility function to extract product name from various data structures
  const extractProductName = useCallback((item: WarehouseRestock | WarehouseSale): string => {
    // Backend may return product data in different structures:
    // 1. Nested product object: item.product.name
    // 2. Direct field: item.productName
    const itemWithProduct = item as any;
    return itemWithProduct.product?.name || item.productName || 'Unknown Product';
  }, []);

  // Render restock item
  const renderRestockItem = ({ item }: { item: WarehouseRestock }) => {
    // Get transaction type icon
    const getTransactionIcon = (type: string) => {
      switch (type?.toUpperCase()) {
        case 'RECEIPT': return '📦';
        case 'TRANSFER_IN': return '🚚';
        case 'ADJUSTMENT_IN': return '🔄';
        case 'RETURN': return '↩️';
        default: return '📥';
      }
    };

    return (
      <View style={styles.restockItem}>
        {/* Product Name Header */}
        <View style={styles.itemHeader}>
          <Text style={styles.itemProductName}>
            {extractProductName(item)}
          </Text>
          <Text style={styles.itemQuantityPositive}>
            +{item.quantity}
          </Text>
        </View>

        {/* Transaction Type */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemTransactionType}>
            {getTransactionIcon(item.transactionType || '')} {item.transactionType || 'RECEIPT'}
          </Text>
        </View>

        {/* Date and Time */}
        <View style={styles.itemFooter}>
          <Text style={styles.itemDateTime}>
            🕒 {formatDateTime(item.createdAt || item.restockDate || '')}
          </Text>
        </View>

        {/* Added By */}
        {item.createdBy && (
          <Text style={styles.itemCreatedBy}>
            👤 By: {item.createdBy}
          </Text>
        )}

        {/* Notes */}
        {item.notes && (
          <Text style={styles.itemNotes}>
            📝 {item.notes}
          </Text>
        )}
      </View>
    );
  };

  // Render sale item
  const renderSaleItem = ({ item }: { item: WarehouseSale }) => {
    // Get transaction type icon
    const getWithdrawalIcon = (type: string) => {
      switch (type?.toUpperCase()) {
        case 'ISSUE': return '📤';
        case 'TRANSFER_OUT': return '🚚';
        case 'ADJUSTMENT_OUT': return '🔄';
        case 'DAMAGE': return '💥';
        case 'THEFT': return '🚨';
        case 'EXPIRED': return '⏰';
        default: return '📤';
      }
    };

    return (
      <View style={styles.saleItem}>
        {/* Product Name Header */}
        <View style={styles.itemHeader}>
          <Text style={styles.itemProductName}>
            {extractProductName(item)}
          </Text>
          <Text style={styles.itemQuantityNegative}>
            -{item.quantity || 0}
          </Text>
        </View>

        {/* Transaction Type */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemTransactionType}>
            {getWithdrawalIcon(item.transactionType || '')} {item.transactionType || 'ISSUE'}
          </Text>
        </View>

        {/* Date and Time */}
        <View style={styles.itemFooter}>
          <Text style={styles.itemDateTime}>
            🕒 {formatDateTime(item.createdAt || item.saleDate || item.withdrawalDate || '')}
          </Text>
        </View>

        {/* Withdrawn By */}
        {item.createdBy && (
          <Text style={styles.itemCreatedBy}>
            👤 By: {item.createdBy}
          </Text>
        )}

        {/* Notes */}
        {item.notes && (
          <Text style={styles.itemNotes}>
            📝 {item.notes}
          </Text>
        )}
      </View>
    );
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
          onPress={() => handleTabSwitch('inventory')}
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
          onPress={() => handleTabSwitch('restocks')}
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
          onPress={() => handleTabSwitch('sales')}
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
              {canAdd && selectedWarehouse && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={styles.addInventoryButton}
                    onPress={() => setShowAddInventoryModal(true)}
                  >
                    <Text style={styles.actionButtonText}>➕ Add Inventory</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.withdrawInventoryButton}
                    onPress={handleOpenWithdrawModal}
                  >
                    <Text style={styles.actionButtonText}>➖ Withdraw</Text>
                  </TouchableOpacity>
                </View>
              )}
              <WarehouseInventoryList inventory={filteredInventory} />
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

              {/* ✅ FIXED: Transaction Type Dropdown (Not Button Selection) */}
              <Text style={styles.inputLabel}>Transaction Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newInventoryItem.transactionType}
                  onValueChange={(value) =>
                    setNewInventoryItem({ ...newInventoryItem, transactionType: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="📦 Receipt (New Purchase)" value={WarehouseAdditionTransactionType.RECEIPT} />
                  <Picker.Item label="🚚 Transfer In (From Another Warehouse)" value={WarehouseAdditionTransactionType.TRANSFER_IN} />
                  <Picker.Item label="🔄 Adjustment In (Inventory Correction)" value={WarehouseAdditionTransactionType.ADJUSTMENT_IN} />
                  <Picker.Item label="↩️ Return (Customer Return)" value={WarehouseAdditionTransactionType.RETURN} />
                </Picker>
              </View>

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
                    setNewInventoryItem({
                      productId: '',
                      productName: '',
                      quantity: '',
                      transactionType: WarehouseAdditionTransactionType.RECEIPT, // Reset to default
                      notes: '',
                    });
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

      {/* Withdraw Inventory Modal */}
      <Modal
        visible={showWithdrawInventoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWithdrawInventoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➖ Withdraw Inventory</Text>
              <TouchableOpacity onPress={() => setShowWithdrawInventoryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.modalSubtitle}>
                Warehouse: {selectedWarehouse?.name}
              </Text>

              {/* ✅ Product Dropdown - Only Warehouse Products */}
              <Text style={styles.inputLabel}>Product *</Text>
              {loadingProducts ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.productPicker} nestedScrollEnabled>
                    {warehouseProducts.length === 0 ? (
                      <View style={styles.emptyPickerContainer}>
                        <Text style={styles.emptyPickerText}>No products in warehouse</Text>
                      </View>
                    ) : (
                      warehouseProducts.map((product) => (
                        <TouchableOpacity
                          key={product.id}
                          style={[
                            styles.productOption,
                            withdrawInventoryItem.productId === product.id.toString() && styles.productOptionSelected,
                          ]}
                          onPress={() => {
                            setWithdrawInventoryItem({
                              ...withdrawInventoryItem,
                              productId: product.id.toString(),
                              productName: product.name,
                              maxQuantity: product.availableQuantity,
                            });
                          }}
                        >
                          <Text style={[
                            styles.productOptionText,
                            withdrawInventoryItem.productId === product.id.toString() && styles.productOptionTextSelected,
                          ]}>
                            {product.name} (Available: {product.availableQuantity})
                          </Text>
                          {withdrawInventoryItem.productId === product.id.toString() && (
                            <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Show Available Quantity */}
              {withdrawInventoryItem.productId && (
                <Text style={styles.availableQuantityText}>
                  📦 Available: {withdrawInventoryItem.maxQuantity}
                </Text>
              )}

              <Text style={styles.inputLabel}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder={withdrawInventoryItem.maxQuantity > 0 ? `Enter quantity (Max: ${withdrawInventoryItem.maxQuantity})` : "Enter quantity"}
                value={withdrawInventoryItem.quantity}
                onChangeText={(text) => {
                  setWithdrawInventoryItem({ ...withdrawInventoryItem, quantity: text });
                }}
                keyboardType="numeric"
              />

              {/* ✅ Transaction Type Picker - Valid Backend Enums */}
              <Text style={styles.inputLabel}>Transaction Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={withdrawInventoryItem.transactionType}
                  onValueChange={(value) =>
                    setWithdrawInventoryItem({ ...withdrawInventoryItem, transactionType: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="📤 Issue (Sold/Issued to Customer)" value={WarehouseWithdrawalTransactionType.ISSUE} />
                  <Picker.Item label="🚚 Transfer Out (To Another Warehouse)" value={WarehouseWithdrawalTransactionType.TRANSFER_OUT} />
                  <Picker.Item label="🔄 Adjustment Out (Inventory Correction)" value={WarehouseWithdrawalTransactionType.ADJUSTMENT_OUT} />
                  <Picker.Item label="💥 Damage (Damaged Goods)" value={WarehouseWithdrawalTransactionType.DAMAGE} />
                  <Picker.Item label="🚨 Theft (Stolen/Lost)" value={WarehouseWithdrawalTransactionType.THEFT} />
                  <Picker.Item label="⏰ Expired (Expired Goods)" value={WarehouseWithdrawalTransactionType.EXPIRED} />
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes about this inventory withdrawal"
                value={withdrawInventoryItem.notes}
                onChangeText={(text) => {
                  setWithdrawInventoryItem({ ...withdrawInventoryItem, notes: text });
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowWithdrawInventoryModal(false);
                    setWithdrawInventoryItem({
                      productId: '',
                      productName: '',
                      quantity: '',
                      transactionType: WarehouseWithdrawalTransactionType.ISSUE,
                      notes: '',
                      maxQuantity: 0,
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleWithdrawInventory}
                >
                  <Text style={styles.saveButtonText}>Withdraw</Text>
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
  // Item cards
  restockItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saleItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
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
  itemProductName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  itemQuantityPositive: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  itemQuantityNegative: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
  },
  itemDetails: {
    marginBottom: 8,
  },
  itemTransactionType: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  itemFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  itemDateTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemCreatedBy: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
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
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
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
  // Action buttons container
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    gap: 10,
  },
  // Add Inventory Button
  addInventoryButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawInventoryButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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
  // Transaction Type Picker Styles
  transactionTypeContainer: {
    gap: 8,
    marginBottom: 4,
  },
  transactionTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  transactionTypeButtonSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  transactionTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  transactionTypeButtonTextSelected: {
    fontSize: 14,
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
  picker: {
    height: 50,
  },
  availableQuantityText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  emptyPickerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
