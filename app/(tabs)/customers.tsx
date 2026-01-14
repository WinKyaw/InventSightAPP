import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../services/api/apiClient';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalPurchases?: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export default function CustomersScreen() {
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Customers: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const { currentStore } = useStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (currentStore?.id) {
      loadCustomers();
    }
  }, [currentStore?.id]);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const loadCustomers = async (isRefreshing = false) => {
    if (!currentStore?.id) {
      console.warn('⚠️ No store selected for customers');
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('👥 Loading customers for store:', currentStore.id);
      
      const response = await apiClient.get(`/api/customers`, {
        params: {
          storeId: currentStore.id,
        }
      });

      const customerList = response.customers || response.data || response || [];
      console.log(`✅ Loaded ${customerList.length} customers`);
      
      setCustomers(customerList);
      
    } catch (error: any) {
      console.error('❌ Error loading customers:', error);
      // If customers endpoint doesn't exist yet, show empty state
      if (error.response?.status === 404) {
        console.log('ℹ️ Customers endpoint not available yet');
        setCustomers([]);
      } else {
        Alert.alert('Error', 'Failed to load customers');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer =>
      customer.name?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );

    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setShowAddModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowAddModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    if (!currentStore?.id) {
      Alert.alert('Error', 'No store selected');
      return;
    }

    try {
      if (editingCustomer) {
        // Update existing customer
        await apiClient.put(`/api/customers/${editingCustomer.id}`, {
          ...formData,
          storeId: currentStore.id,
        });
        Alert.alert('Success', 'Customer updated successfully');
      } else {
        // Create new customer
        await apiClient.post('/api/customers', {
          ...formData,
          storeId: currentStore.id,
        });
        Alert.alert('Success', 'Customer added successfully');
      }

      setShowAddModal(false);
      loadCustomers();
      
    } catch (error: any) {
      console.error('❌ Error saving customer:', error);
      // Show friendly error if endpoint doesn't exist
      if (error.response?.status === 404) {
        Alert.alert(
          'Feature Not Available',
          'Customer management is not yet implemented on the backend. This is a UI preview.'
        );
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to save customer');
      }
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/customers/${customer.id}`);
              Alert.alert('Success', 'Customer deleted');
              loadCustomers();
            } catch (error: any) {
              console.error('❌ Error deleting customer:', error);
              if (error.response?.status === 404) {
                Alert.alert(
                  'Feature Not Available',
                  'Customer management is not yet implemented on the backend.'
                );
              } else {
                Alert.alert('Error', 'Failed to delete customer');
              }
            }
          },
        },
      ]
    );
  };

  const renderCustomerCard = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => handleEditCustomer(item)}
    >
      <View style={styles.customerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name}</Text>
          {item.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={14} color="#666" />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={14} color="#666" />
              <Text style={styles.infoText}>{item.email}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteCustomer(item);
          }}
        >
          <Ionicons name="trash" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>

      {item.totalPurchases !== undefined && (
        <View style={styles.customerFooter}>
          <Text style={styles.purchasesText}>
            {item.totalPurchases} purchase{item.totalPurchases !== 1 ? 's' : ''}
          </Text>
          {item.lastPurchaseDate && (
            <Text style={styles.lastPurchase}>
              Last: {new Date(item.lastPurchaseDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Customers</Text>
          <Text style={styles.subtitle}>Manage your customer database</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddCustomer}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Store info */}
      {currentStore && (
        <View style={styles.storeInfo}>
          <Ionicons name="storefront" size={16} color={Colors.textSecondary} />
          <Text style={styles.storeText}>{currentStore.storeName || currentStore.name}</Text>
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchContainer, { marginTop: currentStore ? 12 : 16 }]}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Customer List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerCard}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people" size={64} color="#CCC" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No customers found' : 'No customers yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search' : 'Add your first customer to get started'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={handleAddCustomer}
                >
                  <Ionicons name="add-circle" size={20} color="#3B82F6" />
                  <Text style={styles.emptyAddButtonText}>Add Customer</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadCustomers(true)}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Add/Edit Customer Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Customer name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Customer address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveCustomer}
            >
              <Text style={styles.saveButtonText}>
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  storeText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  customerCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  customerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  purchasesText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  lastPurchase: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  emptyAddButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
