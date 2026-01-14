// components/modals/AddItemToReceiptModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useItems } from '../../context/ItemsContext';
import { useReceipt } from '../../context/ReceiptContext';
import { useStore } from '../../context/StoreContext';
import { ProductService } from '../../services/api/productService';
import SearchBar from '../ui/SearchBar';
import { Item } from '../../constants/types';

// Debounce delay for product search (ms)
const SEARCH_DEBOUNCE_DELAY = 500;

// Initial products load limit
const INITIAL_PRODUCTS_LIMIT = 100;

interface AddItemToReceiptModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddItemToReceiptModal: React.FC<AddItemToReceiptModalProps> = ({
  visible,
  onClose,
}) => {
  const { items } = useItems();
  const { addItemToReceipt, receiptItems, useApiIntegration } = useReceipt();
  const { currentStore } = useStore(); // ✅ Get current store
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Item[]>([]);
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ✅ Load all products from API when modal opens
  useEffect(() => {
    if (!visible) return;
    
    if (useApiIntegration) {
      const loadAllProducts = async () => {
        if (!currentStore?.id) {
          console.warn('⚠️ No store selected for receipt products');
          setAllProducts(items); // Fallback to local items
          setIsLoadingInitial(false);
          return;
        }

        try {
          setIsLoadingInitial(true);
          console.log(`📦 Loading products for receipt - Store: ${currentStore.id}`);
          
          // ✅ FIX: Pass storeId parameter
          const results = await ProductService.getAllProducts(1, INITIAL_PRODUCTS_LIMIT, 'name', 'asc', currentStore.id);
          
          // Convert Product[] to Item[] format
          const items: Item[] = results.products.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            category: product.category,
            description: product.description,
            sku: product.sku,
            barcode: product.sku, // Use SKU as fallback if barcode not available
            minStock: product.minStock,
            maxStock: product.maxStock,
            total: product.price * product.quantity,
            expanded: false,
            salesCount: 0, // Sales count not available from product API
          }));
          
          console.log(`✅ Loaded ${items.length} products from API`);
          setAllProducts(items);
        } catch (error) {
          console.error('❌ Error loading products:', error);
          Alert.alert('Error', 'Failed to load products from API. Using local inventory.');
          setAllProducts(items); // Fallback to local items
        } finally {
          setIsLoadingInitial(false);
        }
      };
      
      loadAllProducts();
    } else {
      // Use local items when API integration is disabled
      setAllProducts(items);
    }
    
    // Reset search state when modal opens
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  }, [visible, useApiIntegration, items, currentStore?.id]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (!useApiIntegration || !searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!currentStore?.id) {
        console.warn('⚠️ No store selected for receipt product search');
        setSearchResults([]);
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        console.log(`🔍 Searching products for receipt - Store: ${currentStore.id}`);
        
        // ✅ FIX: Pass storeId parameter
        const results = await ProductService.searchProducts({
          query: searchQuery.trim(),
          page: 0,
          limit: 50,
          storeId: currentStore.id,
        });
        
        // Convert Product[] to Item[] format
        const items: Item[] = results.products.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          category: product.category,
          description: product.description,
          sku: product.sku,
          barcode: product.sku, // Use SKU as fallback if barcode not available
          minStock: product.minStock,
          maxStock: product.maxStock,
          total: product.price * product.quantity,
          expanded: false,
          salesCount: 0, // Sales count not available from product API
        }));
        
        setSearchResults(items);
        setHasSearched(true);
      } catch (error) {
        console.error('Error searching products:', error);
        Alert.alert('Error', 'Failed to search products. Using local inventory.');
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, useApiIntegration, currentStore?.id]);

  // ✅ Filter items: prioritize search results, then all products
  const filteredItems = useMemo(() => {
    // When searching with API integration
    if (useApiIntegration && searchQuery.trim() && (hasSearched || isSearching)) {
      return searchResults;
    }
    
    // When not searching: show all loaded products (from API or local)
    if (!searchQuery.trim()) {
      return allProducts;
    }
    
    // Local filtering on allProducts as fallback
    return allProducts.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allProducts, searchQuery, searchResults, hasSearched, isSearching, useApiIntegration]);

  // Check if item is already in receipt
  const isItemInReceipt = (itemId: number) => {
    return receiptItems.some(receiptItem => receiptItem.id === itemId);
  };

  // Get quantity of item in receipt
  const getReceiptItemQuantity = (itemId: number) => {
    const receiptItem = receiptItems.find(ri => ri.id === itemId);
    return receiptItem?.quantity || 0;
  };

  const handleAddItem = (item: Item) => {
    if (item.quantity <= 0) {
      Alert.alert('Out of Stock', `${item.name} is currently out of stock.`);
      return;
    }

    const receiptQuantity = getReceiptItemQuantity(item.id);
    if (receiptQuantity >= item.quantity) {
      Alert.alert('Maximum Quantity', `All available ${item.name} are already in the receipt.`);
      return;
    }

    addItemToReceipt(item, 1);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    onClose();
  };

  const renderItem = ({ item }: { item: Item }) => {
    const inReceipt = isItemInReceipt(item.id);
    const receiptQuantity = getReceiptItemQuantity(item.id);
    const availableQuantity = item.quantity - receiptQuantity;
    const isOutOfStock = availableQuantity <= 0;

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDetails}>
            ${item.price.toFixed(2)} • {item.category}
          </Text>
          <Text style={styles.itemDetails}>
            Stock: {item.quantity}
            {inReceipt && (
              <Text style={styles.inReceiptText}>
                {' '} • {receiptQuantity} in receipt
              </Text>
            )}
          </Text>
        </View>
        
        <View style={styles.itemActions}>
          {isOutOfStock ? (
            <View style={styles.outOfStockButton}>
              <Text style={styles.outOfStockText}>No Stock</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddItem(item)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Items to Receipt</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <SearchBar
          placeholder="Search items by name, category, SKU, or barcode..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => {
            setSearchQuery('');
            setSearchResults([]);
            setHasSearched(false);
          }}
        />

        <View style={styles.itemCount}>
          <Text style={styles.itemCountText}>
            {isLoadingInitial ? (
              'Loading products...'
            ) : isSearching ? (
              'Searching...'
            ) : (
              `${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''} ${
                useApiIntegration && hasSearched ? 'found' : 'available'
              }`
            )}
          </Text>
          {useApiIntegration && !isLoadingInitial && (
            <Text style={styles.apiIndicator}>• API Active</Text>
          )}
        </View>

        {isLoadingInitial ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading products from API...</Text>
          </View>
        ) : isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Searching products...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Items Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery.trim()
                    ? "Try adjusting your search terms"
                    : "No items available in inventory"}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  itemCount: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCountText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  apiIndicator: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  list: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  inReceiptText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  itemActions: {
    marginLeft: 16,
  },
  addButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 20,
    padding: 8,
  },
  outOfStockButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  outOfStockText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AddItemToReceiptModal;