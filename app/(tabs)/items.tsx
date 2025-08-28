import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useItemsApi } from '../../context/ItemsApiContext';
import { Header } from '../../components/shared/Header';
import { SearchBar } from '../../components/shared/SearchBar';
import { FilterSortBar } from '../../components/shared/FilterSortBar';
import { AddItemModal } from '../../components/modals/AddItemModal';
import { FilterModal } from '../../components/modals/FilterModal';
import { SortModal } from '../../components/modals/SortModal';
import { productToItem } from '../../utils/productUtils';
import { styles } from '../../constants/Styles';

export default function ItemsScreen() {
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
    refreshProducts,
    deleteProduct,
    setSearchQuery,
    setSelectedCategoryId,
    setSortBy,
    setSortOrder,
    clearFilters
  } = useItemsApi();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Convert products to items for UI compatibility
  const items = products.map(productToItem);

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
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.headerButtonText}>Add Item</Text>
          </TouchableOpacity>
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
        showsVerticalScrollIndicator={false}
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
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{item.category}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.itemStats}>
                      <Text style={styles.itemStat}>${item.price.toFixed(2)}</Text>
                      <Text style={styles.itemStat}>Qty: {item.quantity}</Text>
                      <Text style={[styles.itemStat, { color: '#3B82F6', fontWeight: '600' }]}>
                        Sold: {item.salesCount || 0}
                      </Text>
                      <Text style={[styles.itemStat, { color: '#10B981', fontWeight: '600' }]}>
                        ${item.total.toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePress(item.id, item.name)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
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
                          <View style={[styles.itemExpandedItem, { gridColumn: 'span 2' }]}>
                            <Text style={styles.itemExpandedLabel}>Description:</Text>
                            <Text style={styles.itemExpandedValue}>{item.description}</Text>
                          </View>
                        )}
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