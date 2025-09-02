import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReceipt } from '../../context/ReceiptContext';
import { useItems } from '../../context/ItemsContext';
import { Header } from '../../components/shared/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SearchBar } from '../../components/shared/SearchBar';
import { AddItemToReceiptModal } from '../../components/modals/AddItemToReceiptModal';
import { ReceiptService } from '../../services/api/receiptService';
import { Receipt } from '../../types';
import { styles } from '../../constants/Styles';

type TabType = 'create' | 'list';

export default function ReceiptScreen() {
  const { 
    receiptItems, 
    customerName, 
    loading,
    error,
    submitting,
    setCustomerName,
    updateReceiptItemQuantity, 
    removeItemFromReceipt,
    calculateTotal,
    calculateTax,
    handleSubmitReceipt,
    useApiIntegration,
    setUseApiIntegration
  } = useReceipt();
  
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [showAddToReceipt, setShowAddToReceipt] = useState(false);
  const [customerNameError, setCustomerNameError] = useState('');
  
  // Receipt listing state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'customer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);

  // Load receipts when switching to list tab
  useEffect(() => {
    if (activeTab === 'list') {
      loadReceipts();
    }
  }, [activeTab]);

  const loadReceipts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoadingReceipts(true);
      }
      setReceiptsError(null);
      
      const response = await ReceiptService.getAllReceipts();
      setReceipts(response.receipts || []);
    } catch (error: any) {
      console.error('Failed to load receipts:', error);
      setReceiptsError(error.message || 'Failed to load receipts');
    } finally {
      setLoadingReceipts(false);
      setRefreshing(false);
    }
  };

  const handleRefreshReceipts = () => {
    loadReceipts(true);
  };

  // Filter and sort receipts
  const getFilteredAndSortedReceipts = () => {
    let filtered = receipts;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(receipt => 
        receipt.customerName?.toLowerCase().includes(term) ||
        receipt.receiptNumber?.toLowerCase().includes(term) ||
        receipt.total.toString().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.dateTime || '').getTime() - new Date(b.dateTime || '').getTime();
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'customer':
          comparison = (a.customerName || 'Walk-in').localeCompare(b.customerName || 'Walk-in');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const formatDate = (dateTime: string | undefined) => {
    if (!dateTime) return 'Unknown';
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderReceiptItem = ({ item }: { item: Receipt }) => (
    <View style={styles.receiptItem}>
      <View style={styles.receiptItemInfo}>
        <Text style={styles.receiptItemName}>#{item.receiptNumber}</Text>
        <Text style={styles.receiptItemPrice}>
          {item.customerName || 'Walk-in Customer'}
        </Text>
        <Text style={styles.receiptItemPrice}>
          {item.items?.length || 0} items • Tax: ${item.tax?.toFixed(2) || '0.00'}
        </Text>
      </View>
      <View style={styles.receiptItemControls}>
        <Text style={styles.receiptItemTotal}>${item.total.toFixed(2)}</Text>
        <Text style={styles.receiptItemName}>{formatDate(item.dateTime)}</Text>
      </View>
    </View>
  );

  const renderReceiptListTab = () => (
    <View style={styles.receiptContainer}>
      {/* Search and Filter Section */}
      <SearchBar
        placeholder="Search receipts..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      
      <View style={styles.employeeStats}>
        <TouchableOpacity 
          style={[styles.employeeStatCard, sortBy === 'date' && { backgroundColor: '#FEF3C7' }]}
          onPress={() => setSortBy('date')}
        >
          <Text style={styles.employeeStatValue}>Date</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.employeeStatCard, sortBy === 'total' && { backgroundColor: '#FEF3C7' }]}
          onPress={() => setSortBy('total')}
        >
          <Text style={styles.employeeStatValue}>Amount</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.employeeStatCard, sortBy === 'customer' && { backgroundColor: '#FEF3C7' }]}
          onPress={() => setSortBy('customer')}
        >
          <Text style={styles.employeeStatValue}>Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.employeeStatCard}
          onPress={toggleSortOrder}
        >
          <Ionicons 
            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
            size={16} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loadingReceipts && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      )}

      {/* Error State */}
      {receiptsError && (
        <View style={styles.errorContainer}>
          <View style={styles.errorHeader}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{receiptsError}</Text>
          </View>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadReceipts()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Receipt List */}
      {!loadingReceipts && !receiptsError && (
        <FlatList
          data={getFilteredAndSortedReceipts()}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id?.toString() || item.receiptNumber || Math.random().toString()}
          refreshing={refreshing}
          onRefresh={handleRefreshReceipts}
          ListEmptyComponent={() => (
            <View style={styles.emptyReceiptCard}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyReceiptTitle}>No Receipts Found</Text>
              <Text style={styles.emptyReceiptText}>
                {searchTerm.trim() ? 'No receipts match your search criteria' : 'No receipts have been created yet'}
              </Text>
              {searchTerm.trim() && (
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => setSearchTerm('')}
                >
                  <Text style={styles.headerButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          style={styles.employeesList}
        />
      )}

      {/* Receipt Stats */}
      {receipts.length > 0 && (
        <View style={styles.employeeStats}>
          <View style={styles.employeeStatCard}>
            <Text style={styles.employeeStatValue}>{receipts.length}</Text>
            <Text style={styles.employeeStatLabel}>Total Receipts</Text>
          </View>
          <View style={styles.employeeStatCard}>
            <Text style={styles.employeeStatValue}>
              ${receipts.reduce((sum, receipt) => sum + receipt.total, 0).toLocaleString()}
            </Text>
            <Text style={styles.employeeStatLabel}>Total Revenue</Text>
          </View>
        </View>
      )}
    </View>
  );

  const subtotal = calculateTotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  const validateCustomerName = (name: string): boolean => {
    if (name.length > 50) {
      setCustomerNameError('Customer name must be less than 50 characters');
      return false;
    }
    if (name.trim() !== name) {
      setCustomerNameError('Customer name cannot start or end with spaces');
      return false;
    }
    setCustomerNameError('');
    return true;
  };

  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    if (name.length > 0) {
      validateCustomerName(name);
    } else {
      setCustomerNameError('');
    }
  };

  const getCurrentDateTime = () => {
    return '2025-08-25 01:34:29';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F59E0B" barStyle="light-content" />
      
      <Header 
        title={activeTab === 'create' ? "Create Receipt" : "Receipt History"}
        subtitle={activeTab === 'create' ? "Point of Sale Transaction" : "View and search receipts"}
        backgroundColor="#F59E0B"
      />

      {/* Tab Navigation */}
      <View style={styles.employeeStats}>
        <TouchableOpacity 
          style={[styles.employeeStatCard, activeTab === 'create' && { backgroundColor: '#FEF3C7' }]}
          onPress={() => setActiveTab('create')}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={20} 
            color={activeTab === 'create' ? '#F59E0B' : '#6B7280'} 
          />
          <Text style={[styles.employeeStatLabel, activeTab === 'create' && { color: '#F59E0B' }]}>
            Create
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.employeeStatCard, activeTab === 'list' && { backgroundColor: '#FEF3C7' }]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons 
            name="list-outline" 
            size={20} 
            color={activeTab === 'list' ? '#F59E0B' : '#6B7280'} 
          />
          <Text style={[styles.employeeStatLabel, activeTab === 'list' && { color: '#F59E0B' }]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'create' ? (
        <ScrollView style={styles.receiptContainer} showsVerticalScrollIndicator={false}>
          {/* Create Receipt Content */}
        <View style={styles.receiptInfoCard}>
          <View style={styles.receiptInfoRow}>
            <View style={styles.receiptInfoItem}>
              <Ionicons name="calendar-outline" size={16} color="#F59E0B" />
              <Text style={styles.receiptInfoLabel}>Date & Time (UTC)</Text>
            </View>
            <Text style={styles.receiptInfoValue}>{getCurrentDateTime()}</Text>
          </View>

          <View style={styles.receiptInfoRow}>
            <View style={styles.receiptInfoItem}>
              <Ionicons name="person-outline" size={16} color="#F59E0B" />
              <Text style={styles.receiptInfoLabel}>Cashier</Text>
            </View>
            <Text style={styles.receiptInfoValue}>WinKyaw</Text>
          </View>

          <View style={styles.customerInputSection}>
            <Text style={styles.customerInputLabel}>Customer Name (Optional)</Text>
            <Input
              placeholder="Enter customer name or leave blank for walk-in"
              value={customerName}
              onChangeText={handleCustomerNameChange}
              style={styles.customerInput}
              maxLength={50}
            />
            {customerNameError ? (
              <View style={styles.fieldErrorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.fieldErrorText}>{customerNameError}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.addItemToReceiptButton}
          onPress={() => setShowAddToReceipt(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addItemToReceiptText}>Add Items to Receipt</Text>
        </TouchableOpacity>

        {receiptItems.length > 0 && (
          <View style={styles.receiptItemsCard}>
            <Text style={styles.receiptItemsTitle}>Items in Receipt</Text>
            
            {receiptItems.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.receiptItem}>
                <View style={styles.receiptItemInfo}>
                  <Text style={styles.receiptItemName}>{item.name}</Text>
                  <Text style={styles.receiptItemPrice}>${item.price.toFixed(2)} each</Text>
                </View>
                
                <View style={styles.receiptItemControls}>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateReceiptItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color="#F59E0B" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateReceiptItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color="#F59E0B" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.receiptItemTotal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.removeItemButton}
                    onPress={() => removeItemFromReceipt(item.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.receiptTotals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (8%):</Text>
                <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            <Button
              title={submitting ? "Processing..." : "Complete Transaction"}
              onPress={handleSubmitReceipt}
              disabled={submitting || receiptItems.length === 0}
              color="#10B981"
              style={styles.submitReceiptButton}
            />

            {/* API Integration Toggle for Development */}
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.apiToggleButton}
                onPress={() => setUseApiIntegration(!useApiIntegration)}
              >
                <Text style={styles.apiToggleText}>
                  API Integration: {useApiIntegration ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        )}

        {receiptItems.length === 0 && (
          <View style={styles.emptyReceiptCard}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyReceiptTitle}>No Items Added</Text>
            <Text style={styles.emptyReceiptText}>
              Tap "Add Items to Receipt" to start creating a transaction
            </Text>
          </View>
        )}
      </ScrollView>
      ) : (
        renderReceiptListTab()
      )}

      <AddItemToReceiptModal 
        visible={showAddToReceipt}
        onClose={() => setShowAddToReceipt(false)}
      />
    </SafeAreaView>
  );
}