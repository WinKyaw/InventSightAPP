import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/api/apiClient';
import { useStore } from '../../context/StoreContext';
import { FloatingCartBadge } from '../pos/FloatingCartBadge';
import { CartBottomSheet } from '../pos/CartBottomSheet';

type OrderType = 'delivery' | 'pickup' | 'hold';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface Product {
  id: number;
  name: string;
  sellingPrice: number;
  quantity: number;
  sku?: string;
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface TakeOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TakeOrderModal({ visible, onClose, onSuccess }: TakeOrderModalProps) {
  const { currentStore } = useStore();
  
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  
  const [orderType, setOrderType] = useState<OrderType>('hold');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cartVisible, setCartVisible] = useState(false);

  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  // Memoize combined product list for efficient lookups
  const productLookup = React.useMemo(() => {
    const map = new Map<number, Product>();
    [...products, ...topSellers].forEach(p => map.set(p.id, p));
    return map;
  }, [products, topSellers]);

  // Load customers and products when modal opens
  useEffect(() => {
    if (visible && currentStore?.id) {
      loadCustomers();
      loadProducts();
    }
  }, [visible, currentStore?.id]);

  // Filter customers as user types
  useEffect(() => {
    if (!customerQuery.trim()) {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }

    const query = customerQuery.toLowerCase();
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );

    setFilteredCustomers(filtered);
    setShowCustomerDropdown(filtered.length > 0);
  }, [customerQuery, customers]);

  const loadCustomers = async () => {
    if (!currentStore?.id) {
      console.warn('⚠️ No store selected, cannot load customers');
      setCustomers([]);
      setCustomerError('No store selected');
      return;
    }
    
    try {
      console.log('📋 Loading customers for store:', currentStore.id);
      
      const response = await apiClient.get('/api/customers', {
        params: { 
          storeId: currentStore.id,
          page: 0,
          size: 100
        }
      });
      
      console.log('✅ Loaded customers:', response.data);
      
      const customerList = response.data?.customers || response.data || [];
      setCustomers(customerList);
      setCustomerError(null);
      
      console.log(`✅ Customer autocomplete enabled with ${customerList.length} customers`);
      
    } catch (error: any) {
      console.error('❌ API Error:', error.response?.status, '-', error.config?.url);
      console.error('Error loading customers:', error);
      
      // ✅ Don't block - just log and allow manual entry
      setCustomerError('Could not load customer list. You can still enter names manually.');
      setCustomers([]); // Empty array as fallback
      console.log('ℹ️ Customer autocomplete unavailable, manual entry enabled');
    }
  };

  const loadProducts = async () => {
    if (!currentStore?.id) {
      console.log('⚠️ No store selected, cannot load items');
      return;
    }
    
    setLoadingItems(true);
    try {
      console.log(`📦 Loading items for store: ${currentStore.id}`);
      
      // Load all products for search
      const response = await apiClient.get('/api/products', {
        params: { 
          storeId: currentStore.id,
          page: 0,
          size: 100,
          // Only show items in stock
          inStock: true
        }
      });
      
      const productList = response.products || [];
      console.log(`✅ Loaded ${productList.length} items`);
      setProducts(productList);
      
      // Load top sellers for default view
      try {
        const topSellersResponse = await apiClient.get('/api/products/top-sellers', {
          params: {
            storeId: currentStore.id,
            limit: 10
          }
        });
        const topSellersList = topSellersResponse.products || [];
        console.log(`✅ Loaded ${topSellersList.length} top sellers`);
        setTopSellers(topSellersList);
      } catch (error) {
        console.log('ℹ️ Top sellers endpoint not available, using fallback sorting');
        // Fallback: Sort products by quantity sold (if field exists) or just show first 10
        const sorted = [...productList]
          .sort((a, b) => ((b as any).salesCount || 0) - ((a as any).salesCount || 0))
          .slice(0, 10);
        setTopSellers(sorted);
      }
    } catch (error: any) {
      console.error('❌ Error loading items:', error);
      Alert.alert(
        'Error Loading Items',
        error.response?.data?.message || 'Failed to load available items'
      );
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.name);
    setShowCustomerDropdown(false);
  };

  // Handle +/- button clicks
  const handleQuantityChange = (productId: number, delta: number) => {
    setQuantities(prev => {
      const product = filteredProducts.find(p => p.id === productId);
      if (!product) return prev;
      
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, Math.min(currentQty + delta, product.quantity));
      
      return { ...prev, [productId]: newQty };
    });
  };

  // Handle direct input
  const handleQuantityInput = (productId: number, text: string) => {
    const product = filteredProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Parse input - only allow valid numbers
    if (text === '' || text === '0') {
      setQuantities(prev => ({ ...prev, [productId]: 0 }));
      return;
    }
    
    const qty = parseInt(text, 10);
    
    // Validate that it's a valid number
    if (isNaN(qty) || qty < 0) {
      return; // Ignore invalid input
    }
    
    // Validate against stock
    if (qty > product.quantity) {
      Alert.alert(
        'Stock Limit',
        `Only ${product.quantity} units available`,
        [{ text: 'OK' }]
      );
      setQuantities(prev => ({ ...prev, [productId]: product.quantity }));
    } else {
      setQuantities(prev => ({ ...prev, [productId]: qty }));
    }
  };

  // Handle add to cart
  const handleAddToCart = (product: Product, quantity: number) => {
    if (quantity === 0) {
      Alert.alert('Invalid Quantity', 'Please enter a quantity greater than 0');
      return;
    }
    
    // Check stock availability
    if (quantity > product.quantity) {
      Alert.alert('Insufficient Stock', `Only ${product.quantity} units available`);
      return;
    }
    
    // Check if item already in cart
    const existingItem = selectedItems.find(item => item.productId === product.id);
    const currentCartQty = existingItem ? existingItem.quantity : 0;
    const totalQty = currentCartQty + quantity;
    
    if (totalQty > product.quantity) {
      Alert.alert(
        'Insufficient Stock',
        `Only ${product.quantity} units available. You already have ${currentCartQty} in cart.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Add to cart
    setSelectedItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      
      if (existing) {
        // Update quantity
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        return [...prev, { 
          productId: product.id,
          name: product.name,
          price: product.sellingPrice,
          quantity 
        }];
      }
    });
    
    // Reset quantity input for this product
    setQuantities(prev => ({ ...prev, [product.id]: 0 }));
    
    // Show success feedback
    Alert.alert(
      'Added to Cart',
      `${quantity}x ${product.name} added to cart`,
      [{ text: 'OK' }]
    );
  };

  // Helper to update cart item to an absolute quantity (used by CartBottomSheet)
  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setSelectedItems(prev =>
        prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.min(newQuantity, getProductStock(productId)) }
            : item
        )
      );
    }
  };

  // Helper to update cart quantity
  const updateCartQuantity = (productId: number, delta: number) => {
    setSelectedItems(prev => {
      return prev.map(item => {
        if (item.productId !== productId) return item;
        
        const product = productLookup.get(productId);
        if (!product) return item;
        
        const newQty = item.quantity + delta;
        
        // Remove item if quantity would be 0 or less
        if (newQty <= 0) {
          return null;
        }
        
        // Cap at available stock
        const cappedQty = Math.min(newQty, product.quantity);
        return { ...item, quantity: cappedQty };
      }).filter((item): item is CartItem => item !== null);
    });
  };

  // Helper to remove from cart
  const removeFromCart = (productId: number) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Helper to get current stock
  const getProductStock = (productId: number): number => {
    const product = productLookup.get(productId);
    return product?.quantity || 0;
  };

  const handleAddItem = (product: Product) => {
    const existingItem = selectedItems.find(i => i.productId === product.id);
    
    if (existingItem) {
      setSelectedItems(items =>
        items.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: product.id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
        },
      ]);
    }
  };

  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    if (!currentStore?.id) {
      Alert.alert('Error', 'No store selected');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const orderData = {
        storeId: currentStore.id,
        customerName: customerQuery || 'Walk-in Customer',
        customerId: selectedCustomer?.id,
        items: selectedItems.map(item => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
        })),
        status: 'PENDING',
        receiptType: orderType.toUpperCase(),
        // No payment method yet - will be added when user clicks "Pay Now"
      };

      await apiClient.post('/api/receipts', orderData);
      
      Alert.alert('Success', 'Order created successfully');
      
      // Reset form
      setCustomerQuery('');
      setSelectedCustomer(null);
      setSelectedItems([]);
      setOrderType('hold');
      setSearchQuery('');
      setCartVisible(false);
      
      // Call success callback to refresh parent
      onSuccess?.();
      
      onClose();
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = searchQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topSellers;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Take Order</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent}>
          {/* Customer Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Customer (Optional)</Text>
            
            {/* ✅ Customer Error Warning Banner */}
            {customerError && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <Text style={styles.warningText}>
                  {customerError}
                </Text>
              </View>
            )}
            
            <View style={styles.customerInputContainer}>
              <TextInput
                style={styles.customerInput}
                placeholder="Type to search or enter new customer"
                value={customerQuery}
                onChangeText={setCustomerQuery}
                onFocus={() => {
                  if (customerQuery && filteredCustomers.length > 0) {
                    setShowCustomerDropdown(true);
                  }
                }}
              />
              {selectedCustomer && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSelectedCustomer(null);
                    setCustomerQuery('');
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Customer Dropdown */}
            {showCustomerDropdown && (
              <View style={styles.customerDropdown}>
                <FlatList
                  data={filteredCustomers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.customerOption}
                      onPress={() => handleSelectCustomer(item)}
                    >
                      <View style={styles.customerAvatar}>
                        <Text style={styles.customerAvatarText}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.customerDetails}>
                        <Text style={styles.customerOptionName}>{item.name}</Text>
                        {item.phone && (
                          <Text style={styles.customerOptionPhone}>{item.phone}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                  style={styles.dropdownList}
                  nestedScrollEnabled={true}
                />
              </View>
            )}
          </View>

          {/* Order Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Order Type</Text>
            <View style={styles.orderTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.orderTypeButton,
                  orderType === 'delivery' && styles.orderTypeButtonActive,
                ]}
                onPress={() => setOrderType('delivery')}
              >
                <Ionicons
                  name="bicycle"
                  size={24}
                  color={orderType === 'delivery' ? '#FFF' : '#666'}
                />
                <Text
                  style={[
                    styles.orderTypeText,
                    orderType === 'delivery' && styles.orderTypeTextActive,
                  ]}
                >
                  Delivery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.orderTypeButton,
                  orderType === 'pickup' && styles.orderTypeButtonActive,
                ]}
                onPress={() => setOrderType('pickup')}
              >
                <Ionicons
                  name="cube"
                  size={24}
                  color={orderType === 'pickup' ? '#FFF' : '#666'}
                />
                <Text
                  style={[
                    styles.orderTypeText,
                    orderType === 'pickup' && styles.orderTypeTextActive,
                  ]}
                >
                  Pickup
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.orderTypeButton,
                  orderType === 'hold' && styles.orderTypeButtonActive,
                ]}
                onPress={() => setOrderType('hold')}
              >
                <Ionicons
                  name="pause-circle"
                  size={24}
                  color={orderType === 'hold' ? '#FFF' : '#666'}
                />
                <Text
                  style={[
                    styles.orderTypeText,
                    orderType === 'hold' && styles.orderTypeTextActive,
                  ]}
                >
                  Hold
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Item Search */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Add Items</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items by name, category, SKU..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Available Items List */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsCount}>
              {filteredProducts.length} items available
              {searchQuery 
                ? ` (searched for "${searchQuery}")`
                : ' (top sellers)'
              }
            </Text>
            
            {loadingItems ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E67E22" />
                <Text style={styles.loadingText}>Loading items...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.productCard}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productPrice}>${item.sellingPrice.toFixed(2)}</Text>
                      <Text style={styles.productStock}>Available: {item.quantity} units</Text>
                    </View>

                    {/* Quick Add Button */}
                    <TouchableOpacity
                      style={styles.quickAddButton}
                      onPress={() => handleAddItem(item)}
                      accessibilityLabel={`Add ${item.name} to cart`}
                      accessibilityHint="Tap to add one unit to cart"
                    >
                      <Ionicons name="add-circle" size={36} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                )}
                scrollEnabled={false}
                nestedScrollEnabled={true}
                ListEmptyComponent={
                  <View style={styles.emptyItems}>
                    <Ionicons name="cube-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyItemsText}>
                      {searchQuery
                        ? `No items match "${searchQuery}"`
                        : 'No items available in this store'
                      }
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </ScrollView>

        {/* ✅ FLOATING CART BADGE - Only shows when items > 0 */}
        <FloatingCartBadge
          itemCount={itemCount}
          total={total}
          onPress={() => setCartVisible(true)}
        />

        {/* ✅ EXPANDABLE CART BOTTOM SHEET */}
        <CartBottomSheet
          visible={cartVisible}
          items={selectedItems}
          total={total}
          isSubmitting={isSubmitting}
          onClose={() => setCartVisible(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={removeFromCart}
          onCheckout={handleSubmitOrder}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  customerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  customerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
  },
  customerDropdown: {
    maxHeight: 200,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  dropdownList: {
    maxHeight: 200,
  },
  customerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerDetails: {
    flex: 1,
  },
  customerOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerOptionPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  orderTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    gap: 8,
  },
  orderTypeButtonActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  orderTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  orderTypeTextActive: {
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  itemsSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 100, // Space for floating cart badge
  },
  itemsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1,
    marginBottom: 0,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
  },
  quickAddButton: {
    padding: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#fff',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addButton: {
    padding: 8,
  },
  cartSection: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    maxHeight: 300,
  },
  cartHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cartList: {
    maxHeight: 200,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartQuantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    minWidth: 60,
    textAlign: 'right',
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  cartTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cartTotalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10B981',
  },
  summarySection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#E67E22',
    marginTop: 8,
    fontSize: 14,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
});
