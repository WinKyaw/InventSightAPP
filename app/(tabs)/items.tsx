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
import { productToItem } from '../../utils/productUtils';
import { Product } from '../../services/api/config';
import { styles } from '../../constants/Styles';
import { PermissionService } from '../../services/api/permissionService';
import { apiClient } from '../../services/api/apiClient';
import { Colors } from '../../constants/Colors';
import { StoreService, Store } from '../../services/api/storeService';
import { canManageWarehouses } from '../../utils/permissions';

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
  const [restockItem, setRestockItem] = useState({
    productId: '',
    quantity: '',
    notes: '',
  });
  const [activeTab, setActiveTab] = useState<'inventory' | 'restocks'>('inventory');
  const [restockHistory, setRestockHistory] = useState<RestockHistoryItem[]>([]);

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

  // Convert products to items for UI compatibility
  const items = (products ?? []).map(productToItem);

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

  // Handle restock submission
  const handleRestock = async () => {
    if (!restockItem.productId || !restockItem.quantity) {
      Alert.alert('Error', 'Please select a product and enter quantity');
      return;
    }

    // Validate that the quantity is a valid positive integer
    const trimmedQuantity = restockItem.quantity.trim();
    if (!/^\d+$/.test(trimmedQuantity)) {
      Alert.alert('Error', 'Please enter a valid positive whole number');
      return;
    }

    const quantity = parseInt(trimmedQuantity, 10);

    // Get current store ID from user
    const currentStoreId = user?.currentStoreId || user?.activeStoreId;
    if (!currentStoreId) {
      Alert.alert('Error', 'No store selected. Please select a store first.');
      return;
    }

    try {
      console.log('📦 Restocking product:', restockItem);

      const response = await apiClient.post('/api/store-inventory/add', {
        storeId: currentStoreId,
        productId: restockItem.productId,
        quantity: quantity,
        notes: restockItem.notes,
      });

      console.log('✅ Restock successful:', response);

      Alert.alert('Success', 'Inventory updated successfully');
      setShowRestockModal(false);
      
      // Reset form
      setRestockItem({ productId: '', quantity: '', notes: '' });
      
      // Refresh product list
      loadProducts();
    } catch (error) {
      console.error('❌ Restock failed:', error);
      Alert.alert('Error', 'Failed to update inventory');
    }
  };

  // Load restock history
  const loadRestockHistory = async () => {
    const currentStoreId = user?.currentStoreId || user?.activeStoreId;
    if (!currentStoreId) {
      console.log('⚠️ No store selected');
      return;
    }

    try {
      console.log('📋 Loading restock history for store:', currentStoreId);

      const response = await apiClient.get<RestockHistoryResponse>(
        `/api/store-inventory/store/${currentStoreId}/additions?page=0&size=${RESTOCK_HISTORY_PAGE_SIZE}`
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
              onPress={() => setShowAddStoreModal(true)}
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

      {/* ✅ NEW: Updated Header with Store Name */}
      <View style={itemsStyles.headerContainer}>
        <Text style={itemsStyles.headerStoreName}>{currentStore?.storeName || 'No Store'}</Text>
        <Text style={itemsStyles.subtitle}>Inventory Management</Text>
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
        onRequestClose={() => setShowRestockModal(false)}
      >
        <View style={itemsStyles.modalContainer}>
          <View style={itemsStyles.modalHeader}>
            <Text style={itemsStyles.modalTitle}>Restock Inventory</Text>
            <TouchableOpacity onPress={() => setShowRestockModal(false)}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={itemsStyles.modalContent}>
            {/* Product Selector */}
            <Text style={itemsStyles.inputLabel}>Select Product *</Text>
            <View style={itemsStyles.pickerContainer}>
              <ScrollView style={itemsStyles.productPicker} nestedScrollEnabled>
                {products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      itemsStyles.productOption,
                      restockItem.productId === product.id && itemsStyles.productOptionSelected,
                    ]}
                    onPress={() => {
                      setRestockItem({
                        ...restockItem,
                        productId: product.id,
                      });
                    }}
                  >
                    <View style={itemsStyles.productOptionContent}>
                      <Text style={itemsStyles.productOptionTitle}>{product.name}</Text>
                      <Text style={itemsStyles.productOptionSubtext}>
                        Current Stock: {product.quantity} units
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Quantity Input */}
            <Text style={itemsStyles.inputLabel}>Quantity to Add *</Text>
            <TextInput
              style={itemsStyles.input}
              placeholder="Enter quantity"
              keyboardType="number-pad"
              value={restockItem.quantity}
              onChangeText={(value) => setRestockItem({ ...restockItem, quantity: value })}
            />

            {/* Notes (Optional) */}
            <Text style={itemsStyles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[itemsStyles.input, itemsStyles.textArea]}
              placeholder="Add notes about this restock..."
              multiline
              numberOfLines={3}
              value={restockItem.notes}
              onChangeText={(value) => setRestockItem({ ...restockItem, notes: value })}
            />

            {/* Submit Button */}
            {(() => {
              const isFormValid = !!(restockItem.productId && restockItem.quantity);
              return (
                <TouchableOpacity
                  style={[
                    itemsStyles.submitButton,
                    !isFormValid && itemsStyles.submitButtonDisabled,
                  ]}
                  onPress={handleRestock}
                  disabled={!isFormValid}
                >
                  <Text style={itemsStyles.submitButtonText}>Add to Inventory</Text>
                </TouchableOpacity>
              );
            })()}
          </ScrollView>
        </View>
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

      {/* ✅ NEW: Add Store Modal Placeholder */}
      <Modal
        visible={showAddStoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStoreModal(false)}
      >
        <View style={itemsStyles.modalOverlay}>
          <View style={itemsStyles.storeSelectorModal}>
            <View style={itemsStyles.modalHeader}>
              <Text style={itemsStyles.modalTitle}>Add New Store</Text>
              <TouchableOpacity onPress={() => setShowAddStoreModal(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={itemsStyles.addStoreContent}>
              <Text style={itemsStyles.placeholderText}>
                Store creation functionality will be implemented here.
              </Text>
              <TouchableOpacity
                style={itemsStyles.placeholderButton}
                onPress={() => setShowAddStoreModal(false)}
              >
                <Text style={itemsStyles.placeholderButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  // Header Container Styles
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.secondary,
  },
  headerStoreName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
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
    marginTop: 20,
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
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
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

  // Add Store Modal Styles
  addStoreContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  placeholderButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  placeholderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});