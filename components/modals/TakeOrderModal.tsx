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
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

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
    if (!currentStore?.id) return;
    
    try {
      const response = await apiClient.get('/api/customers', {
        params: { storeId: currentStore.id }
      });
      const customerList = response.data?.customers || response.data || [];
      setCustomers(customerList);
      setCustomerError(null);
    } catch (error: any) {
      console.error('❌ API Error:', error.response?.status, '-', error.config?.url);
      console.error('Error loading customers:', error);
      
      // ✅ Don't block - just log and allow manual entry
      setCustomerError('Could not load customer list. You can still enter names manually.');
      setCustomers([]); // Empty array as fallback
      
      // Don't show alert - just log
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
      
      const response = await apiClient.get('/api/products', {
        params: { 
          storeId: currentStore.id,
          page: 0,
          size: 100,
          // Only show items in stock
          inStock: true
        }
      });
      
      const productList = response.data?.products || response.data || [];
      console.log(`✅ Loaded ${productList.length} items`);
      setProducts(productList);
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {searchQuery && ` (searched for "${searchQuery}")`}
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
                  <TouchableOpacity
                    style={styles.productCard}
                    onPress={() => handleAddItem(item)}
                  >
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productPrice}>${item.sellingPrice.toFixed(2)}</Text>
                      <Text style={styles.productStock}>Stock: {item.quantity}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddItem(item)}
                    >
                      <Ionicons name="add-circle" size={32} color="#1976D2" />
                    </TouchableOpacity>
                  </TouchableOpacity>
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

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>
              {selectedItems.length} item(s) added
            </Text>
            <Text style={styles.summaryTotal}>
              Total: ${selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmitOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.submitButtonText}>Create Order</Text>
            </>
          )}
        </TouchableOpacity>
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
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1,
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
  addButton: {
    padding: 8,
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
