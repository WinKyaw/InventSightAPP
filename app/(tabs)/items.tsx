import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useItemsApi } from '../../context/ItemsApiContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/shared/Header';
import { AddItemModal } from '../../components/modals/AddItemModal';
import { EditItemModal } from '../../components/modals/EditItemModal';
import { StockManagementModal } from '../../components/modals/StockManagementModal';
import { FilterSortModal } from '../../components/modals/FilterSortModal';
import { RestockProductCard } from '../../components/items/RestockProductCard';
import { productToItem } from '../../utils/productUtils';
import { Product } from '../../services/api/config';
import { styles } from '../../constants/Styles';
import { PermissionService } from '../../services/api/permissionService';
import apiClient from '../../services/api/apiClient';
import { Colors } from '../../constants/Colors';
import { StoreService, Store } from '../../services/api/storeService';
import { canManageWarehouses } from '../../utils/permissions';
import { CacheManager } from '../../utils/cacheManager';

// Constants
const RESTOCK_HISTORY_PAGE_SIZE = 50;

// Interfaces for restock functionality
interface RestockHistoryItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

interface RestockHistoryResponse {
  additions: RestockHistoryItem[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export default function ItemsScreen() {
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Items: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // ✅ Check if user is GM+ (can expand items)
  const isGMPlus = useMemo(() => {
    return canManageWarehouses(user?.role);
  }, [user?.role]);

  const [permissions, setPermissions] = useState({
    canAdd: false,
    canEdit: false,
    canDelete: false,
  });

  // Store management state
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  
  // Add Store form state
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    description: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
  });
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  const {
    products,
    loading,
    refreshing,
    error,
    categories,
    searchQuery,
    selectedCategoryId,
    sortBy,
    sortOrder,
    hasMore,
    currentPage,
    loadProducts,
    loadCategories,
    refreshProducts,
    deleteProduct,
    setSearchQuery,
    setSelectedCategoryId,
    setSortBy,
    setSortOrder,
    clearFilters
  } = useItemsApi();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showFilterSortModal, setShowFilterSortModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockManagementProduct, setStockManagementProduct] = useState<Product | null>(null);

  // Restock modal state
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'restocks'>('inventory');
  const [restockHistory, setRestockHistory] = useState<RestockHistoryItem[]>([]);
  const [restockSearchQuery, setRestockSearchQuery] = useState('');

  // State for multi-item restock
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: number;
    productName: string;
    quantity: string;
  }>>([]);
  const [globalNotes, setGlobalNotes] = useState('');

  // ✅ INFINITE LOOP FIX: Track loaded state to prevent repeated loads
  const loadedRef = useRef(false);

  // Load stores on mount
  const loadStores = useCallback(async () => {
    try {
      console.log('🏪 Loading user stores...');
      const userStores = await StoreService.getUserStores();
      
      console.log('✅ Stores loaded:', userStores.length);
      setStores(userStores);
      
      // Auto-select first store if available
      // This logic runs when loadStores is called (which happens once on mount via useEffect)
      if (userStores.length > 0) {
        console.log('📍 Auto-selecting first store:', userStores[0].storeName);
        setCurrentStore(userStores[0]);
      }
    } catch (error) {
      console.error('❌ Failed to load stores:', error);
      setStores([]);
    }
  }, []); // Empty deps - function is stable across renders

  // Load stores on mount
  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Handler to create store
  const handleCreateStore = async () => {
    // Validation
    if (!storeForm.storeName.trim()) {
      Alert.alert('Validation Error', 'Store name is required');
      return;
    }

    try {
      setIsSubmittingStore(true);
      console.log('🏪 Creating new store:', storeForm.storeName);

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        store: Store;
      }>('/api/stores', storeForm);

      if (response.success) {
        console.log('✅ Store created successfully:', response.store);
        
        Alert.alert(
          'Success',
          `Store "${response.store.storeName}" created successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Close modal
                setShowAddStoreModal(false);
                
                // Reset form
                setStoreForm({
                  storeName: '',
                  description: '',
                  address: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  country: '',
                  phone: '',
                  email: '',
                  website: '',
                  taxId: '',
                });
                
                // Refresh stores list
                loadStores();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error creating store:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create store. Please try again.'
      );
    } finally {
      setIsSubmittingStore(false);
    }
  };

  // Update Add Store button handler
  const handleAddStorePress = () => {
    if (isGMPlus) {
      setShowAddStoreModal(true);
    } else {
      Alert.alert(
        'Upgrade Required',
        'Add Store feature is only available for GM+ subscription. Please upgrade to access this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => console.log('Navigate to upgrade') },
        ]
      );
    }
  };

  // Load permissions once on mount
  const loadPermissions = useCallback(async () => {
    try {
      // Batch check all permissions at once
      const results = await PermissionService.checkPermissions([
        'ADD_ITEM',
        'EDIT_ITEM',
        'DELETE_ITEM',
      ]);
      
      setPermissions({
        canAdd: results.ADD_ITEM,
        canEdit: results.EDIT_ITEM,
        canDelete: results.DELETE_ITEM,
      });
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // ✅ LAZY LOADING: Load products and categories only when Items screen is focused
  useFocusEffect(
    useCallback(() => {
      // Prevent loading if already loaded or currently loading
      if (loadedRef.current || loading) {
        console.log('⏭️  Items: Skipping load (already loaded or loading)');
        return;
      }

      console.log('📦 Items screen focused - loading products and categories');
      loadedRef.current = true;
      loadProducts();
      loadCategories();
    }, [loadProducts, loadCategories, loading])
  );

  // ✅ FIX: Reload products when store changes
  useEffect(() => {
    // Only reload if we've already loaded products at least once
    if (!loadedRef.current) {
      console.log('⏭️  Items: Skipping store change reload - not initialized yet');
      return;
    }

    // Don't reload on initial mount (currentStore is null initially)
    if (!currentStore?.id) {
      console.log('⏭️  Items: Skipping store change reload - no store selected');
      return;
    }

    console.log('🏪 Store changed to:', currentStore.storeName);
    
    // Activate the store in the backend (sets tenant context) and reload products
    (async () => {
      try {
        await StoreService.activateStore(currentStore.id);
        
        console.log('🔄 Reloading products for new store...');
        
        // Clear product cache to ensure fresh data
        CacheManager.invalidateProducts();
        
        // Reload products for the new store
        await loadProducts(1, true);
      } catch (error) {
        console.error('❌ Failed to activate store:', error);
        Alert.alert('Error', 'Failed to switch stores. Please try again.');
      }
    })();
  }, [currentStore?.id, loadProducts]);

  // Convert products to items for UI compatibility
  const items = (products ?? []).map(productToItem);

  // Filter products for restock modal based on search query
  const filteredRestockProducts = useMemo(() => {
    if (!restockSearchQuery.trim()) {
      return products;
    }

    const query = restockSearchQuery.toLowerCase();
    
    return products.filter(product => {
      return (
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    });
  }, [products, restockSearchQuery]);

  const toggleItemExpansion = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleSortPress = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleToggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleCategorySelect = (category: string) => {
    const categoryId = category === 'All' ? null : categories.find(cat => cat.name === category)?.id || null;
    setSelectedCategoryId(categoryId);
  };

  const handleDeletePress = (id: number, name: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteProduct(id)
        }
      ]
    );
  };

  const handleEditPress = (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleStockPress = (product: Product) => {
    setStockManagementProduct(product);
    setShowStockModal(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadProducts(currentPage + 1);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (product: Product) => {
    const isSelected = selectedProducts.some(p => p.productId === product.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedProducts(prev => prev.filter(p => p.productId !== product.id));
    } else {
      // Add to selection
      setSelectedProducts(prev => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: '',
        },
      ]);
    }
  };

  // Update quantity for selected product
  const updateProductQuantity = (productId: number, quantity: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setSelectedProducts(prev => {
      const existing = prev.find(p => p.productId === productId);
      
      if (quantity === '' || quantity === '0') {
        // Remove product if quantity is empty or zero
        return prev.filter(p => p.productId !== productId);
      } else if (existing) {
        // Update existing product quantity
        return prev.map(p =>
          p.productId === productId ? { ...p, quantity } : p
        );
      } else {
        // Add new product to selection
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            quantity,
          },
        ];
      }
    });
  };

  // Handle modal close
  const handleCloseRestockModal = () => {
    console.log('🔴 Closing restock modal');
    setShowRestockModal(false);
    setSelectedProducts([]);
    setGlobalNotes('');
    setRestockSearchQuery('');
  };

  // Handle multi-item restock submission
  const handleMultiItemRestock = async () => {
    try {
      // Validate all items have quantity
      const invalidItems = selectedProducts.filter(p => {
        const trimmedQuantity = p.quantity?.trim();
        return !trimmedQuantity || !/^\d+$/.test(trimmedQuantity) || trimmedQuantity === '0';
      });
      
      if (invalidItems.length > 0) {
        Alert.alert('Error', 'Please enter valid positive quantities for all selected items');
        return;
      }

      // ✅ FIX: Get current store ID from currentStore state
      if (!currentStore?.id) {
        Alert.alert('Error', 'No store selected. Please select a store first.');
        return;
      }

      console.log('📦 Restocking multiple items:', selectedProducts);

      // Create array of promises for parallel API calls
      const restockPromises = selectedProducts.map(async (item) => {
        const response = await apiClient.post<{ success: boolean; message?: string }>('/api/store-inventory/add', {
          storeId: currentStore.id,
          productId: item.productId,
          quantity: parseInt(item.quantity.trim(), 10),
          notes: globalNotes,
        });
        return response;
      });

      // Execute all restocks in parallel
      await Promise.all(restockPromises);

      console.log('✅ Multi-item restock successful');

      Alert.alert(
        'Success',
        `${selectedProducts.length} item(s) restocked successfully`
      );

      // Reset form
      handleCloseRestockModal();

      // Refresh product list
      loadProducts();
    } catch (error) {
      console.error('❌ Multi-item restock failed:', error);
      Alert.alert('Error', 'Failed to restock items. Please try again.');
    }
  };

  // Load restock history
  const loadRestockHistory = async () => {
    if (!currentStore?.id) {
      console.log('⚠️ No store selected');
      return;
    }

    try {
      console.log('📋 Loading restock history for store:', currentStore.id);

      const response = await apiClient.get<RestockHistoryResponse>(
        `/api/store-inventory/store/${currentStore.id}/additions?page=0&size=${RESTOCK_HISTORY_PAGE_SIZE}`
      );

      console.log('✅ Restock history loaded:', response.additions?.length || 0);
      setRestockHistory(response.additions || []);
    } catch (error) {
      console.error('❌ Failed to load restock history:', error);
      setRestockHistory([]);
    }
  };

  // Get category names for the filter modal
  const categoryNames = ['All', ...categories.map(cat => cat.name)];
  const selectedCategoryName = selectedCategoryId 
    ? categories.find(cat => cat.id === selectedCategoryId)?.name || 'All'
    : 'All';

  const renderEmptyState = () => (
    <View style={styles.noItemsContainer}>
      <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
      <Text style={styles.noItemsText}>
        {error ? 'Failed to load products' : 'No products found'}
      </Text>
      <Text style={styles.noItemsSubtext}>
        {error 
          ? 'Please check your connection and try again'
          : searchQuery || selectedCategoryId
            ? 'Try adjusting your search or filters' 
            : 'Add some products to get started'
        }
      </Text>
      {error && (
        <TouchableOpacity 
          style={[styles.headerButton, { marginTop: 16 }]} 
          onPress={() => refreshProducts()}
        >
          <Text style={styles.headerButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={[styles.noItemsContainer, { paddingVertical: 40 }]}>
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={[styles.noItemsSubtext, { marginTop: 16 }]}>Loading products...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />
      
      {/* ✅ NEW: Store Selector Header (similar to Warehouse) */}
      {isGMPlus && (
        <View style={itemsStyles.storeHeader}>
          <View style={itemsStyles.storeInfo}>
            <Text style={itemsStyles.storeLabel}>Store</Text>
            <Text style={itemsStyles.storeName}>{currentStore?.storeName || 'Select Store'}</Text>
          </View>
          
          {/* GM+ Only: Add Store and Change buttons */}
          <View style={itemsStyles.storeActions}>
            <TouchableOpacity 
              style={itemsStyles.addStoreButton}
              onPress={handleAddStorePress}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={itemsStyles.addStoreText}>Add Store</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={itemsStyles.changeButton}
              onPress={() => setShowStoreSelector(true)}
            >
              <Ionicons name="swap-horizontal" size={20} color="white" />
              <Text style={itemsStyles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ✅ Subtitle below store header */}
      <View style={itemsStyles.subtitleContainer}>
        <Text style={itemsStyles.pageSubtitle}>Inventory Management</Text>
      </View>
      
      {/* ✅ NEW: Restock button moved here */}
      {permissions.canAdd && (
        <View style={itemsStyles.restockButtonContainer}>
          <TouchableOpacity 
            style={itemsStyles.restockButton} 
            onPress={() => setShowRestockModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={itemsStyles.restockButtonText}>Restock Items</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ NEW: Search Bar with Inline Filter Button */}
      <View style={itemsStyles.searchSection}>
        <View style={itemsStyles.searchContainer}>
          <View style={itemsStyles.searchInputWrapper}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={itemsStyles.searchInput}
              placeholder="Search inventory..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Filter button on same line */}
          <TouchableOpacity 
            style={itemsStyles.filterButton}
            onPress={() => setShowFilterSortModal(true)}
          >
            <Ionicons name="options-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* ✅ Total items count - moved closer to search */}
        <View style={itemsStyles.totalItemsContainer}>
          <Text style={itemsStyles.totalItemsText}>
            {items.length} items
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={itemsStyles.tabContainer}>
        <TouchableOpacity
          style={[itemsStyles.tab, activeTab === 'inventory' && itemsStyles.activeTab]}
          onPress={() => setActiveTab('inventory')}
        >
          <Ionicons 
            name="cube-outline" 
            size={20} 
            color={activeTab === 'inventory' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[itemsStyles.tabText, activeTab === 'inventory' && itemsStyles.activeTabText]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[itemsStyles.tab, activeTab === 'restocks' && itemsStyles.activeTab]}
          onPress={() => {
            setActiveTab('restocks');
            loadRestockHistory();
          }}
        >
          <Ionicons 
            name="time-outline" 
            size={20} 
            color={activeTab === 'restocks' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[itemsStyles.tabText, activeTab === 'restocks' && itemsStyles.activeTabText]}>
            Restocks
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'inventory' ? (
        <ScrollView 
        style={styles.itemsList} 
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProducts}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        onMomentumScrollEnd={(event) => {
          const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
          const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
          if (isAtBottom) {
            handleLoadMore();
          }
        }}
      >
        <View style={styles.itemsCard}>
          {loading && items.length === 0 ? (
            renderLoadingState()
          ) : items.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {items.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && <View style={styles.itemSeparator} />}
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => isGMPlus && toggleItemExpansion(item.id)}
                    disabled={!isGMPlus}
                    activeOpacity={isGMPlus ? 0.7 : 1} // Visual feedback: no opacity change for non-GM users
                  >
                    <View style={styles.itemInfo}>
                      <View style={styles.itemNameRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                      </View>
                    </View>
                    <View style={styles.itemStats}>
                      <Text style={styles.itemStat}>${item.price.toFixed(2)}</Text>
                      <Text style={styles.itemStat}>Qty: {item.quantity}</Text>
                    </View>
                    
                    {/* Show expand icon only for GM+ */}
                    {isGMPlus && (
                      <Ionicons 
                        name={expandedItems.has(item.id) ? 'chevron-up' : 'chevron-down'} 
                        size={24} 
                        color={Colors.textSecondary} 
                      />
                    )}
                  </TouchableOpacity>
                  
                  {/* Expanded View (GM+ Only) */}
                  {isGMPlus && expandedItems.has(item.id) && (
                    <View style={styles.itemExpanded}>
                      <View style={styles.itemExpandedGrid}>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Category:</Text>
                          <Text style={styles.itemExpandedValue}>{item.category}</Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Unit Price:</Text>
                          <Text style={styles.itemExpandedValue}>${item.price.toFixed(2)}</Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Stock:</Text>
                          <Text style={styles.itemExpandedValue}>{item.quantity} units</Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Total Value:</Text>
                          <Text style={[styles.itemExpandedValue, { color: '#10B981' }]}>
                            ${item.total.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Total Sales:</Text>
                          <Text style={[styles.itemExpandedValue, { color: '#3B82F6' }]}>
                            {item.salesCount || 0} units sold
                          </Text>
                        </View>
                        <View style={styles.itemExpandedItem}>
                          <Text style={styles.itemExpandedLabel}>Status:</Text>
                          <Text style={[styles.itemExpandedValue, { color: item.quantity > (item.minStock || 10) ? '#10B981' : '#F59E0B' }]}>
                            {item.quantity > (item.minStock || 10) ? 'In Stock' : 'Low Stock'}
                          </Text>
                        </View>
                        {item.description && (
                          <View style={[styles.itemExpandedItem, { width: '100%' }]}>
                            <Text style={styles.itemExpandedLabel}>Description:</Text>
                            <Text style={styles.itemExpandedValue}>{item.description}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.expandedActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleStockPress(products.find(p => p.id === item.id)!)}
                        >
                          <Ionicons name="cube" size={16} color="#3B82F6" />
                          <Text style={styles.actionButtonText}>Manage Stock</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditPress(products.find(p => p.id === item.id)!)}
                        >
                          <Ionicons name="create" size={16} color="#10B981" />
                          <Text style={styles.actionButtonText}>Edit Product</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
              
              {loading && items.length > 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text style={{ marginTop: 8, color: '#666', fontSize: 14 }}>Loading more...</Text>
                </View>
              )}
              
              {!hasMore && items.length > 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#666', fontSize: 14 }}>No more products to load</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      ) : (
        /* Restock History Tab */
        <FlatList
          data={restockHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={itemsStyles.restockCard}>
              <View style={itemsStyles.restockHeader}>
                <Text style={itemsStyles.restockProductName}>{item.productName}</Text>
                <Text style={itemsStyles.restockQuantity}>+{item.quantity}</Text>
              </View>
              <Text style={itemsStyles.restockDate}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={itemsStyles.restockUser}>By: {item.createdBy}</Text>
              {item.notes && (
                <Text style={itemsStyles.restockNotes}>Note: {item.notes}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={itemsStyles.emptyState}>
              <Ionicons name="time-outline" size={48} color={Colors.textSecondary} />
              <Text style={itemsStyles.emptyStateText}>No restock history yet</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadRestockHistory}
              colors={['#10B981']}
              tintColor="#10B981"
            />
          }
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {/* Restock Modal */}
      <Modal
        visible={showRestockModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseRestockModal}
      >
        <SafeAreaView style={itemsStyles.modalSafeArea} edges={['top']}>
          <View style={itemsStyles.modalContainer}>
            <View style={itemsStyles.modalHeader}>
              <Text style={itemsStyles.modalTitle}>Restock Inventory</Text>
              <TouchableOpacity 
                onPress={handleCloseRestockModal}
                style={itemsStyles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={itemsStyles.modalContent}>
            {/* Instructions */}
            <View style={itemsStyles.instructionBanner}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={itemsStyles.instructionText}>
                Select products and enter quantities to restock
              </Text>
            </View>

            {/* Search Bar */}
            <View style={itemsStyles.searchBarContainer}>
              <View style={itemsStyles.searchBarWrapper}>
                <Ionicons name="search" size={20} color="#999" style={itemsStyles.searchBarIcon} />
                <TextInput
                  style={itemsStyles.searchBarInput}
                  placeholder="Search by name, SKU, category..."
                  value={restockSearchQuery}
                  onChangeText={setRestockSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {restockSearchQuery.length > 0 && (
                  <TouchableOpacity 
                    style={itemsStyles.clearSearchButton}
                    onPress={() => setRestockSearchQuery('')}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Result Count */}
            {restockSearchQuery.length > 0 && (
              <Text style={itemsStyles.resultCount}>
                {filteredRestockProducts.length} product(s) found
              </Text>
            )}

            {/* Product Selection List */}
            <Text style={itemsStyles.sectionLabel}>Select Products *</Text>
            
            {loading ? (
              <View style={itemsStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#E67E22" />
                <Text style={itemsStyles.loadingText}>Loading products...</Text>
              </View>
            ) : filteredRestockProducts.length === 0 ? (
              <View style={itemsStyles.emptyStateContainer}>
                <Ionicons name="cube-outline" size={64} color="#CCC" />
                <Text style={itemsStyles.emptyStateText}>
                  {restockSearchQuery 
                    ? 'No products match your search' 
                    : 'No products available for this store'}
                </Text>
                {restockSearchQuery && (
                  <Text style={itemsStyles.emptyStateSubtext}>
                    Try a different search term
                  </Text>
                )}
              </View>
            ) : (
              <ScrollView style={itemsStyles.productListContainer} nestedScrollEnabled>
                {filteredRestockProducts.map((product) => {
                  const selectedProduct = selectedProducts.find(p => p.productId === product.id);
                  const quantity = selectedProduct?.quantity || '';
                  
                  return (
                    <RestockProductCard
                      key={product.id}
                      product={product}
                      quantity={quantity}
                      onQuantityChange={(qty) => updateProductQuantity(product.id, qty)}
                      searchQuery={restockSearchQuery}
                    />
                  );
                })}
              </ScrollView>
            )}

            {/* Global Notes (applies to all) */}
            <Text style={itemsStyles.sectionLabel}>Notes (Optional)</Text>
            <TextInput
              style={[itemsStyles.input, itemsStyles.textArea]}
              placeholder="Add notes about this restock (applies to all items)..."
              multiline
              numberOfLines={3}
              value={globalNotes}
              onChangeText={setGlobalNotes}
            />

            {/* Selected Items Summary */}
            {selectedProducts.length > 0 && (
              <View style={itemsStyles.summaryContainer}>
                <Text style={itemsStyles.summaryTitle}>
                  Selected: {selectedProducts.length} item(s)
                </Text>
                {selectedProducts.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  const displayQuantity = item.quantity?.trim() || '-';
                  return (
                    <View key={item.productId} style={itemsStyles.summaryRow}>
                      <Text style={itemsStyles.summaryProduct}>{product?.name}</Text>
                      <Text style={itemsStyles.summaryQuantity}>
                        {displayQuantity !== '-' ? `+${displayQuantity}` : displayQuantity}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                itemsStyles.submitButton,
                selectedProducts.length === 0 && itemsStyles.submitButtonDisabled,
              ]}
              onPress={handleMultiItemRestock}
              disabled={selectedProducts.length === 0}
            >
              <Text style={itemsStyles.submitButtonText}>
                Add {selectedProducts.length} Item(s) to Inventory
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>

      <AddItemModal 
        visible={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />

      <EditItemModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
      />

      <StockManagementModal
        visible={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setStockManagementProduct(null);
        }}
        product={stockManagementProduct}
      />
      
      <FilterSortModal
        visible={showFilterSortModal}
        onClose={() => setShowFilterSortModal(false)}
        selectedCategory={selectedCategoryName}
        onSelectCategory={handleCategorySelect}
        categories={categoryNames}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSelectSort={handleSortPress}
        onToggleSortOrder={handleToggleSortOrder}
      />

      {/* ✅ NEW: Store Selector Modal (like Warehouse selector) */}
      <Modal
        visible={showStoreSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStoreSelector(false)}
      >
        <View style={itemsStyles.modalOverlay}>
          <View style={itemsStyles.storeSelectorModal}>
            <View style={itemsStyles.modalHeader}>
              <Text style={itemsStyles.modalTitle}>Select Store</Text>
              <TouchableOpacity onPress={() => setShowStoreSelector(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={itemsStyles.storeList}>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    itemsStyles.storeOption,
                    currentStore?.id === store.id && itemsStyles.storeOptionSelected,
                  ]}
                  onPress={() => {
                    setCurrentStore(store);
                    setShowStoreSelector(false);
                  }}
                >
                  <Ionicons 
                    name="storefront-outline" 
                    size={24} 
                    color={currentStore?.id === store.id ? Colors.secondary : Colors.textSecondary} 
                  />
                  <View style={itemsStyles.storeOptionInfo}>
                    <Text style={itemsStyles.storeOptionName}>{store.storeName}</Text>
                    {store.city && (
                      <Text style={itemsStyles.storeOptionLocation}>{store.city}, {store.state}</Text>
                    )}
                  </View>
                  {currentStore?.id === store.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.secondary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ✅ Add Store Modal */}
      <Modal
        visible={showAddStoreModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddStoreModal(false)}
      >
        <SafeAreaView style={itemsStyles.modalSafeArea} edges={['top']}>
          <View style={itemsStyles.modalContainer}>
            {/* Header */}
            <View style={itemsStyles.modalHeader}>
              <Text style={itemsStyles.modalTitle}>Add New Store</Text>
              <TouchableOpacity
                onPress={() => setShowAddStoreModal(false)}
                style={itemsStyles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={itemsStyles.modalContent}>
              {/* Store Name (Required) */}
              <View style={itemsStyles.formGroup}>
                <Text style={itemsStyles.formLabel}>
                  Store Name <Text style={itemsStyles.required}>*</Text>
                </Text>
                <TextInput
                  style={itemsStyles.formInput}
                  placeholder="e.g., Downtown Store"
                  value={storeForm.storeName}
                  onChangeText={(text) => setStoreForm({ ...storeForm, storeName: text })}
                  autoCapitalize="words"
                />
              </View>

              {/* Description */}
              <View style={itemsStyles.formGroup}>
                <Text style={itemsStyles.formLabel}>Description</Text>
                <TextInput
                  style={[itemsStyles.formInput, itemsStyles.textArea]}
                  placeholder="Store description (optional)"
                  value={storeForm.description}
                  onChangeText={(text) => setStoreForm({ ...storeForm, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Address */}
              <View style={itemsStyles.formGroup}>
                <Text style={itemsStyles.formLabel}>Address</Text>
                <TextInput
                  style={itemsStyles.formInput}
                  placeholder="Street address"
                  value={storeForm.address}
                  onChangeText={(text) => setStoreForm({ ...storeForm, address: text })}
                  autoCapitalize="words"
                />
              </View>

              {/* City & State */}
              <View style={itemsStyles.formRow}>
                <View style={[itemsStyles.formGroup, itemsStyles.formGroupHalf]}>
                  <Text style={itemsStyles.formLabel}>City</Text>
                  <TextInput
                    style={itemsStyles.formInput}
                    placeholder="City"
                    value={storeForm.city}
                    onChangeText={(text) => setStoreForm({ ...storeForm, city: text })}
                    autoCapitalize="words"
                  />
                </View>

                <View style={[itemsStyles.formGroup, itemsStyles.formGroupHalf]}>
                  <Text style={itemsStyles.formLabel}>State</Text>
                  <TextInput
                    style={itemsStyles.formInput}
                    placeholder="State"
                    value={storeForm.state}
                    onChangeText={(text) => setStoreForm({ ...storeForm, state: text })}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Postal Code & Country */}
              <View style={itemsStyles.formRow}>
                <View style={[itemsStyles.formGroup, itemsStyles.formGroupHalf]}>
                  <Text style={itemsStyles.formLabel}>Postal Code</Text>
                  <TextInput
                    style={itemsStyles.formInput}
                    placeholder="ZIP/Postal"
                    value={storeForm.postalCode}
                    onChangeText={(text) => setStoreForm({ ...storeForm, postalCode: text })}
                    keyboardType="default"
                  />
                </View>

                <View style={[itemsStyles.formGroup, itemsStyles.formGroupHalf]}>
                  <Text style={itemsStyles.formLabel}>Country</Text>
                  <TextInput
                    style={itemsStyles.formInput}
                    placeholder="Country"
                    value={storeForm.country}
                    onChangeText={(text) => setStoreForm({ ...storeForm, country: text })}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={itemsStyles.formGroup}>
                <Text style={itemsStyles.formLabel}>Phone</Text>
                <TextInput
                  style={itemsStyles.formInput}
                  placeholder="(555) 123-4567"
                  value={storeForm.phone}
                  onChangeText={(text) => setStoreForm({ ...storeForm, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={itemsStyles.formGroup}>
                <Text style={itemsStyles.formLabel}>Email</Text>
                <TextInput
                  style={itemsStyles.formInput}
                  placeholder="store@example.com"
                  value={storeForm.email}
                  onChangeText={(text) => setStoreForm({ ...storeForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Website */}
              <View style={itemsStyles.formGroup}>
                <Text style={itemsStyles.formLabel}>Website</Text>
                <TextInput
                  style={itemsStyles.formInput}
                  placeholder="https://example.com"
                  value={storeForm.website}
                  onChangeText={(text) => setStoreForm({ ...storeForm, website: text })}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {/* Tax ID */}
              <View style={itemsStyles.formGroup}>
                <Text style={itemsStyles.formLabel}>Tax ID</Text>
                <TextInput
                  style={itemsStyles.formInput}
                  placeholder="Tax identification number"
                  value={storeForm.taxId}
                  onChangeText={(text) => setStoreForm({ ...storeForm, taxId: text })}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  itemsStyles.submitButton,
                  (!storeForm.storeName.trim() || isSubmittingStore) && itemsStyles.submitButtonDisabled,
                ]}
                onPress={handleCreateStore}
                disabled={!storeForm.storeName.trim() || isSubmittingStore}
              >
                {isSubmittingStore ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={itemsStyles.submitButtonText}>Create Store</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Custom styles for items page
const itemsStyles = StyleSheet.create({
  // Store Header Styles
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  storeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addStoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  changeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Subtitle Container Styles
  subtitleContainer: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  pageSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Restock Button Container
  restockButtonContainer: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  restockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    justifyContent: 'center',
  },
  restockButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Search Section Styles
  searchSection: {
    backgroundColor: Colors.background,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalItemsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  totalItemsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  
  // Modal styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  
  // Product picker
  pickerContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: Colors.white,
  },
  productPicker: {
    maxHeight: 200,
  },
  productOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productOptionSelected: {
    backgroundColor: Colors.lightBlue,
  },
  productOptionContent: {
    gap: 4,
  },
  productOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  productOptionSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Instruction banner
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBlue,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Search bar styles for restock modal
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  clearSearchButton: {
    padding: 4,
  },
  resultCount: {
    marginBottom: 12,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },

  // Loading and empty state styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // Section label
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text,
  },

  // Product list with checkboxes
  productListContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: 'white',
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },

  checkbox: {
    padding: 4,
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },

  productMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  quantityInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },

  quantityInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 80,
    textAlign: 'center',
    backgroundColor: 'white',
  },

  // Summary container
  summaryContainer: {
    backgroundColor: Colors.successLight,
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },

  summaryProduct: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },

  summaryQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },
  
  // Input fields
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Submit button
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.border,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Restock card
  restockCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  restockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restockProductName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  restockQuantity: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
  },
  restockDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  restockUser: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  restockNotes: {
    fontSize: 14,
    color: Colors.text,
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  
  // Empty state (for restocks tab)
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  // Store Selector Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  storeSelectorModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  storeList: {
    padding: 16,
  },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginBottom: 8,
  },
  storeOptionSelected: {
    backgroundColor: Colors.secondaryLight, // ✅ FIXED: Use constant instead of hard-coded color
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  storeOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  storeOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  storeOptionLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Form styles
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  formInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
});