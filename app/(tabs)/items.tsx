import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useItemsApi } from '../../context/ItemsApiContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/shared/Header';
import { SearchBar } from '../../components/shared/SearchBar';
import { FilterSortBar } from '../../components/shared/FilterSortBar';
import { AddItemModal } from '../../components/modals/AddItemModal';
import { EditItemModal } from '../../components/modals/EditItemModal';
import { StockManagementModal } from '../../components/modals/StockManagementModal';
import { FilterModal } from '../../components/modals/FilterModal';
import { SortModal } from '../../components/modals/SortModal';
import { productToItem } from '../../utils/productUtils';
import { Product } from '../../services/api/config';
import { styles } from '../../constants/Styles';
import { PermissionService } from '../../services/api/permissionService';

export default function ItemsScreen() {
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Items: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const [canAdd, setCanAdd] = useState(false);

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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockManagementProduct, setStockManagementProduct] = useState<Product | null>(null);

  // ✅ INFINITE LOOP FIX: Track loaded state to prevent repeated loads
  const loadedRef = useRef(false);

  // ✅ LAZY LOADING: Load products and categories only when Items screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Prevent loading if already loaded or currently loading
      if (loadedRef.current || loading) {
        console.log('⏭️  Items: Skipping load (already loaded or loading)');
        return;
      }

      console.log('📦 Items screen focused - loading products and categories');
      loadedRef.current = true;
      loadProducts();
      loadCategories();

      // Check permissions
      PermissionService.canAddItem()
        .then(setCanAdd)
        .catch((error) => {
          console.error('Failed to check add item permission:', error);
          setCanAdd(false);
        });
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
      
      <Header 
        title="Inventory Management"
        backgroundColor="#10B981"
        rightComponent={
          canAdd ? (
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.headerButtonText}>Add Item</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <SearchBar
        placeholder="Search inventory..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FilterSortBar
        selectedCategory={selectedCategoryName}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onFilterPress={() => setShowFilterModal(true)}
        onSortPress={() => setShowSortModal(true)}
        onClearFilter={() => clearFilters()}
      />

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
                    onPress={() => toggleItemExpansion(item.id)}
                  >
                    <View style={styles.itemInfo}>
                      <View style={styles.itemNameRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {/* <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{item.category}</Text>
                        </View> */}
                      </View>
                    </View>
                    <View style={styles.itemStats}>
                      <Text style={styles.itemStat}>${item.price.toFixed(2)}</Text>
                      <Text style={styles.itemStat}>Qty: {item.quantity}</Text>
                      {/* <Text style={[styles.itemStat, { color: '#3B82F6', fontWeight: '600' }]}>
                        Sold: {item.salesCount || 0}
                      </Text>
                      <Text style={[styles.itemStat, { color: '#10B981', fontWeight: '600' }]}>
                        ${item.total.toFixed(2)}
                      </Text> */}
                    </View>
                    {/* <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditPress(products.find(p => p.id === item.id)!)}
                      >
                        <Ionicons name="create-outline" size={18} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeletePress(item.id, item.name)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View> */}
                  </TouchableOpacity>
                  
                  {expandedItems.has(item.id) && (
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
      
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedCategory={selectedCategoryName}
        onSelectCategory={(category) => {
          const categoryId = category === 'All' ? null : categories.find(cat => cat.name === category)?.id || null;
          setSelectedCategoryId(categoryId);
        }}
        categories={categoryNames}
      />

      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSelectSort={handleSortPress}
      />
    </SafeAreaView>
  );
}