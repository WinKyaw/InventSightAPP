import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import Header from "../../components/ui/Header";
import SearchBar from "../../components/ui/SearchBar";
import DatePicker from "../../components/ui/DatePicker";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import AddItemToReceiptModal from "../../components/modals/AddItemToReceiptModal";
import { ReceiptDetailsModal } from "../../components/modals/ReceiptDetailsModal";
import { PaymentModal } from "../../components/receipt/PaymentModal";
import SmartScanner from "../../components/ui/SmartScanner";
import { OCRScanner } from "../../components/ui/OCRScanner";
import { PendingReceiptCard } from "../../components/ui/PendingReceiptCard";
import { Chip } from "../../components/ui/Chip";
import { ReceiptFilterModal, ReceiptFilters } from "../../components/modals/ReceiptFilterModal";
import { EmployeePickerModal, Employee } from "../../components/modals/EmployeePickerModal";
import TakeOrderModal from "../../components/modals/TakeOrderModal";

import { useReceipt } from "../../context/ReceiptContext";
import { useItems } from "../../context/ItemsContext";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { Receipt, Item } from "../../types";
import ReceiptService from "../../services/api/receiptService";
import { EmployeeService } from "../../services/api/employeeService";
import apiClient from "../../services/api/apiClient";

type TabType = "create" | "pending" | "history";

export default function ReceiptScreen() {
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized, user } = useAuth();
  const router = useRouter();
  const { currentStore, isStoreReady } = useStore(); // ✅ Get store from shared context

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Receipt: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const {
    receiptItems,
    customerName,
    paymentMethod,
    loading,
    error,
    submitting,
    setCustomerName,
    setPaymentMethod,
    updateReceiptItemQuantity,
    removeItemFromReceipt,
    calculateTotal,
    calculateTax,
    handleSubmitReceipt,
    useApiIntegration,
    setUseApiIntegration,
    addItemToReceipt,
    selectedCashier,
    setSelectedCashier,
    cashierStats,
    clearReceipt,
  } = useReceipt();

  const { items, addItem } = useItems();

  const [activeTab, setActiveTab] = useState<TabType>("create");
  const [showAddToReceipt, setShowAddToReceipt] = useState(false);
  const [showTakeOrderModal, setShowTakeOrderModal] = useState(false);
  const [customerNameError, setCustomerNameError] = useState("");
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedReceiptForPayment, setSelectedReceiptForPayment] = useState<Receipt | null>(null);

  // Receipt listing state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "total" | "customer">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = useState(false);

  // Date filtering state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // SmartScanner state
  const [showSmartScanner, setShowSmartScanner] = useState(false);
  // OCRScanner state
  const [showOCRScanner, setShowOCRScanner] = useState(false);

  // Pending receipts state
  const [pendingReceipts, setPendingReceipts] = useState<Receipt[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingFilter, setPendingFilter] = useState<'all' | 'delivery' | 'pickup'>('all');

  // Advanced filter state for History tab
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ReceiptFilters>({
    startDate: null,
    endDate: null,
    createdBy: null,
    fulfilledBy: null,
    deliveredBy: null,
    status: [],
    paymentMethod: [],
    receiptType: [],
    customerFilter: '',
  });

  // Employee picker state
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [employeePickerType, setEmployeePickerType] = useState<'createdBy' | 'fulfilledBy' | 'deliveredBy'>('createdBy');
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Scroll state and ref
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  // State for pending receipt action modal
  const [selectedPendingReceipt, setSelectedPendingReceipt] = useState<Receipt | null>(null);

  // Customer autocomplete state
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Check if user is GM+ (case-insensitive)
  const userRoleUpper = user?.role?.toUpperCase();
  const isGMPlus = userRoleUpper === 'OWNER' ||
                   userRoleUpper === 'GENERAL_MANAGER' || 
                   userRoleUpper === 'CEO' || 
                   userRoleUpper === 'FOUNDER' ||
                   userRoleUpper === 'ADMIN';

  // ✅ Check if store is available
  useEffect(() => {
    if (!isStoreReady) {
      console.warn('⚠️ No store selected for receipt');
    } else {
      console.log(`✅ Receipt page using store: ${currentStore?.name || currentStore?.storeName}`);
    }
  }, [currentStore, isStoreReady]);

  // ✅ Debug logging for GM+ status (only in development)
  useEffect(() => {
    if (__DEV__) {
      console.log('🔍 Receipt Screen - User Debug:');
      console.log('  - User role:', user?.role);
      console.log('  - Is GM+:', isGMPlus);
      console.log('  - Cashier stats count:', cashierStats?.length || 0);
      console.log('  - Selected cashier:', selectedCashier);
    }
  }, [user?.role, isGMPlus, cashierStats?.length, selectedCashier]);

  useEffect(() => {
    if (activeTab === "history") {
      loadReceipts();
    }
  }, [activeTab]);

  useEffect(() => {
    loadReceipts();
  }, []);

  // Reload receipts when cashier filter changes
  useEffect(() => {
    if (activeTab === "history") {
      loadReceipts();
    }
  }, [selectedCashier]);

  const loadReceipts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoadingReceipts(true);
      setReceiptsError(null);
      
      // ✅ FIX: Only fetch COMPLETED receipts for history tab
      const response = await ReceiptService.getAllReceipts(0, 20, selectedCashier || undefined, 'COMPLETED');
      setReceipts(response.receipts || []);
      
      if (__DEV__) {
        console.log('📄 Loaded COMPLETED receipts with filter - cashier:', selectedCashier || 'All', 'count:', response.receipts?.length || 0);
      }
    } catch (error: any) {
      setReceiptsError(error.message || "Failed to load receipts");
    } finally {
      setLoadingReceipts(false);
      setRefreshing(false);
    }
  };

  const handleRefreshReceipts = () => {
    loadReceipts(true);
  };

  // ✅ DRY: Centralized function to refresh both receipt lists
  const refreshReceiptLists = () => {
    loadPendingReceipts();
    if (activeTab === 'history') {
      loadReceipts();
    }
  };

  // Load pending receipts
  const loadPendingReceipts = async () => {
    try {
      setLoadingPending(true);
      const pending = await ReceiptService.getPendingReceipts(pendingFilter);
      setPendingReceipts(pending);
    } catch (error: any) {
      console.error('Failed to load pending receipts:', error);
      Alert.alert('Error', 'Failed to load pending receipts');
    } finally {
      setLoadingPending(false);
    }
  };

  // Effect to load pending receipts when tab changes or filter changes
  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingReceipts();
    }
  }, [activeTab, pendingFilter]);

  // Load customers for autocomplete
  useEffect(() => {
    loadCustomers();
  }, [currentStore?.id]);

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

  // Filter customers as user types
  useEffect(() => {
    if (!customerSearchQuery.trim()) {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }

    const query = customerSearchQuery.toLowerCase();
    const filtered = customers.filter((c: any) =>
      c.name?.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );

    setFilteredCustomers(filtered);
    setShowCustomerDropdown(filtered.length > 0);
  }, [customerSearchQuery, customers]);

  // Handle customer selection
  const handleSelectCustomer = (customer: any) => {
    setCustomerName(customer.name);
    setCustomerSearchQuery(customer.name);
    setShowCustomerDropdown(false);
  };

  // Handle adding new customer inline
  const handleAddNewCustomer = async () => {
    if (!newCustomerForm.name.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    try {
      await apiClient.post('/api/customers', {
        ...newCustomerForm,
        storeId: currentStore?.id,
      });
      Alert.alert('Success', 'Customer added successfully');
      setShowAddCustomerModal(false);
      setNewCustomerForm({ name: '', phone: '', email: '' });
      loadCustomers();
    } catch (error: any) {
      console.error('Error adding customer:', error);
      if (error.response?.status === 404) {
        Alert.alert(
          'Feature Not Available',
          'Customer management is not yet implemented on the backend.'
        );
      } else {
        Alert.alert('Error', 'Failed to add customer');
      }
    }
  };

  // Load employees when filter modal or employee picker opens
  useEffect(() => {
    const loadEmployees = async () => {
      if (showFilterModal || showEmployeePicker) {
        try {
          const employeeList = await EmployeeService.getAllEmployees();
          // Map employees to the format expected by the modal
          const mappedEmployees = employeeList.map(emp => ({
            id: emp.id.toString(),
            name: `${emp.firstName} ${emp.lastName}`,
            role: emp.title,
            username: `${emp.firstName} ${emp.lastName}`,
          }));
          setEmployees(mappedEmployees);
        } catch (error: any) {
          console.error('Failed to load employees:', error);
        }
      }
    };
    
    loadEmployees();
  }, [showFilterModal, showEmployeePicker]);

  // Handle fulfillment action
  const handleFulfill = async (receiptId: number) => {
    try {
      await ReceiptService.fulfillReceipt(receiptId);
      Alert.alert('Success', 'Receipt marked as fulfilled');
      refreshReceiptLists();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fulfill receipt');
    }
  };

  // Handle delivery action
  const handleMarkDelivered = async (receiptId: number) => {
    try {
      await ReceiptService.markAsDelivered(receiptId);
      Alert.alert('Success', 'Receipt marked as delivered');
      refreshReceiptLists();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark as delivered');
    }
  };

  // Handle payment action
  const handlePayNow = (receipt: Receipt) => {
    console.log('💳 Opening payment modal for receipt:', receipt.id);
    setSelectedReceiptForPayment(receipt);
    setShowPaymentModal(true);
    setSelectedPendingReceipt(null); // Close action modal
  };

  // Handle Ready for Pickup action
  const handleReadyForPickup = async (receipt: Receipt) => {
    try {
      await apiClient.put(`/api/receipts/${receipt.id}/ready-for-pickup`);
      Alert.alert('Success', 'Customer notified - order ready for pickup');
      setSelectedPendingReceipt(null);
      loadPendingReceipts();
    } catch (error) {
      console.error('Error marking ready for pickup:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  // Custom handler for creating PENDING receipts (no payment method yet)
  const handleCreatePendingReceipt = async () => {
    // ✅ Check if store is selected
    if (!currentStore) {
      Alert.alert(
        'No Store Selected',
        'Please go to Items page and select a store before creating a receipt.',
        [
          {
            text: 'Go to Items',
            onPress: () => router.push('/(tabs)/items'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    if (receiptItems.length === 0) {
      Alert.alert('Error', 'Please add items to the receipt');
      return;
    }

    try {
      console.log(`📝 Creating PENDING receipt for store: ${currentStore.storeName || currentStore.name}`);

      const subtotal = calculateTotal();
      const tax = calculateTax(subtotal);

      // ✅ Create receipt with shared store, no payment method, PENDING status
      const receiptData = {
        storeId: currentStore.id, // ✅ Use store from shared context
        customerName: customerName || 'Walk-in Customer',
        items: receiptItems.map(item => ({
          productId: item.id.toString(),
          quantity: item.quantity,
        })),
        status: 'PENDING', // ✅ No payment yet - just save as pending
        // ❌ NO paymentMethod here! It will be added when user clicks "Pay Now"
      };

      await ReceiptService.createReceipt(receiptData);
      
      // Clear the receipt form
      clearReceipt();
      
      // Reload pending receipts to show the new one
      loadPendingReceipts();
      
      Alert.alert(
        'Success',
        'Receipt created and saved as pending. You can complete payment later.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Error creating receipt:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create receipt');
    }
  };

  // Get pending counts for tabs
  const pendingCount = pendingReceipts.length;
  const deliveryCount = pendingReceipts.filter(r => r.receiptType === 'DELIVERY').length;
  const pickupCount = pendingReceipts.filter(r => r.receiptType === 'PICKUP').length;

  // Handle filter application
  const handleApplyFilters = (filters: ReceiptFilters) => {
    setActiveFilters(filters);
    setShowFilterModal(false);
    // Apply filters to receipts
    loadReceiptsWithFilters(filters);
  };

  const loadReceiptsWithFilters = async (filters: ReceiptFilters) => {
    try {
      setLoadingReceipts(true);
      setReceiptsError(null);
      
      const completedReceipts = await ReceiptService.getCompletedReceipts({
        search: searchTerm,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        createdBy: filters.createdBy?.id,
        fulfilledBy: filters.fulfilledBy?.id,
        deliveredBy: filters.deliveredBy?.id,
        status: filters.status,
        paymentMethod: filters.paymentMethod,
        receiptType: filters.receiptType,
        customerId: filters.customerFilter,
      });
      
      setReceipts(completedReceipts);
    } catch (error: any) {
      setReceiptsError(error.message || 'Failed to load receipts');
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleClearFilters = () => {
    const emptyFilters: ReceiptFilters = {
      startDate: null,
      endDate: null,
      createdBy: null,
      fulfilledBy: null,
      deliveredBy: null,
      status: [],
      paymentMethod: [],
      receiptType: [],
      customerFilter: '',
    };
    setActiveFilters(emptyFilters);
    setStartDate(null);
    setEndDate(null);
    loadReceipts();
  };

  const hasActiveFilters = 
    activeFilters.startDate !== null ||
    activeFilters.endDate !== null ||
    activeFilters.createdBy !== null ||
    activeFilters.fulfilledBy !== null ||
    activeFilters.deliveredBy !== null ||
    (activeFilters.status && activeFilters.status.length > 0) ||
    (activeFilters.paymentMethod && activeFilters.paymentMethod.length > 0) ||
    (activeFilters.receiptType && activeFilters.receiptType.length > 0) ||
    (activeFilters.customerFilter && activeFilters.customerFilter.trim() !== '');

  const handleOpenEmployeePicker = (type: 'createdBy' | 'fulfilledBy' | 'deliveredBy') => {
    setEmployeePickerType(type);
    setShowFilterModal(false);
    setShowEmployeePicker(true);
  };

  const handleSelectEmployee = (employee: Employee) => {
    setActiveFilters({
      ...activeFilters,
      [employeePickerType]: { id: employee.id, name: employee.name },
    });
    setShowEmployeePicker(false);
    setShowFilterModal(true);
  };

  // Filter and sort receipts
  const getFilteredAndSortedReceipts = () => {
    let filtered = receipts;
    filtered = getFilteredReceiptsByDate(filtered);
    
    // Filter receipts by selected cashier for GM+ users
    if (isGMPlus && selectedCashier) {
      filtered = filtered.filter(
        (receipt) => receipt.processedById === selectedCashier
      );
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (receipt) =>
          receipt.customerName?.toLowerCase().includes(term) ||
          receipt.receiptNumber?.toString().includes(term)
      );
    }
    filtered = filtered.sort((a, b) => {
      let valA: any;
      let valB: any;
      
      if (sortBy === "date") {
        valA = new Date(a.createdAt || a.dateTime || 0).getTime();
        valB = new Date(b.createdAt || b.dateTime || 0).getTime();
      } else if (sortBy === "customer") {
        valA = a.customerName || "";
        valB = b.customerName || "";
      } else if (sortBy === "total") {
        valA = a.totalAmount || a.total || 0;
        valB = b.totalAmount || b.total || 0;
      } else {
        valA = (a as any)[sortBy];
        valB = (b as any)[sortBy];
      }
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  };

  const getFilteredReceiptsByDate = (receiptsList: Receipt[]) => {
    if (!startDate && !endDate) return receiptsList;
    return receiptsList.filter((receipt) => {
      const dateStr = receipt.createdAt || receipt.dateTime;
      if (!dateStr) return true;
      const receiptDate = new Date(dateStr);
      const start = startDate
        ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        : null;
      const end = endDate
        ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59)
        : null;
      if (start && receiptDate < start) return false;
      if (end && receiptDate > end) return false;
      return true;
    });
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ FIX: Calculate total quantity across all items
  const getTotalItemQuantity = useCallback((receipt: Receipt): number => {
    if (!receipt.items || receipt.items.length === 0) return 0;
    
    return receipt.items.reduce((total, item) => {
      return total + (item.quantity || 0);
    }, 0);
  }, []);

  // ✅ FIX: Get correct tax value from receipt
  const getReceiptTax = useCallback((receipt: Receipt): number => {
    // Use explicit null/undefined checks to handle tax value of 0 correctly
    if (receipt.tax != null) return receipt.tax;
    if (receipt.taxAmount != null) return receipt.taxAmount;
    return 0;
  }, []);

  // Scroll handlers
  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollButtons(offsetY > 100);
  };

  const renderReceiptItem = ({ item }: { item: Receipt }) => (
    <TouchableOpacity
      style={styles.receiptItem}
      onPress={() => {
        setSelectedReceipt(item);
        setShowReceiptDetails(true);
      }}
    >
      <View style={styles.receiptItemInfo}>
        <Text style={styles.receiptItemName}>#{item.receiptNumber}</Text>
        
        {/* Display cashier info for GM+ users */}
        {isGMPlus && item.processedByFullName && (
          <View style={styles.receiptItemCashier}>
            <Ionicons name="person" size={14} color="#F59E0B" style={styles.receiptItemCashierIcon} />
            <Text style={styles.receiptItemCashierName}>
              {item.processedByFullName}
            </Text>
          </View>
        )}
        
        <Text style={styles.receiptItemPrice}>{item.customerName || "Walk-in Customer"}</Text>
        <Text style={styles.receiptItemPrice}>
          {getTotalItemQuantity(item)} items • Tax: ${getReceiptTax(item).toFixed(2)}
          {item.paymentMethod ? ` • ${item.paymentMethod}` : ''}
        </Text>
      </View>
      <View style={styles.receiptItemControls}>
        <Text style={styles.receiptItemTotal}>${(item.totalAmount || item.total || 0).toFixed(2)}</Text>
        <Text style={styles.receiptItemName}>{formatDate(item.createdAt || item.dateTime)}</Text>
      </View>
    </TouchableOpacity>
  );

  const formatDate = (date?: string | number | Date): string => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }
      
      return dateObj.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Render Create Tab Content
  const renderCreateTab = () => (
    <View style={styles.createContent}>
      {/* Main Action Button */}
      <TouchableOpacity
        style={styles.takeOrderButton}
        onPress={() => setShowTakeOrderModal(true)}
      >
        <Ionicons name="cart" size={28} color="#FFF" />
        <Text style={styles.takeOrderText}>Take Order</Text>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => setShowOCRScanner(true)}
        >
          <Ionicons name="scan" size={24} color="#6366F1" />
          <Text style={styles.quickActionText}>Smart Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => setShowAddToReceipt(true)}
        >
          <Ionicons name="search" size={24} color="#10B981" />
          <Text style={styles.quickActionText}>Browse Items</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Pending Tab Content
  const renderPendingTab = () => (
    <View style={styles.pendingContent}>
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, pendingFilter === 'all' && styles.filterTabActive]}
          onPress={() => setPendingFilter('all')}
        >
          <Text style={[styles.filterTabText, pendingFilter === 'all' && styles.filterTabTextActive]}>
            All Pending ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, pendingFilter === 'delivery' && styles.filterTabActive]}
          onPress={() => setPendingFilter('delivery')}
        >
          <Ionicons name="bicycle" size={16} color={pendingFilter === 'delivery' ? '#E67E22' : '#666'} />
          <Text style={[styles.filterTabText, pendingFilter === 'delivery' && styles.filterTabTextActive]}>
            Delivery ({deliveryCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, pendingFilter === 'pickup' && styles.filterTabActive]}
          onPress={() => setPendingFilter('pickup')}
        >
          <Ionicons name="cube" size={16} color={pendingFilter === 'pickup' ? '#E67E22' : '#666'} />
          <Text style={[styles.filterTabText, pendingFilter === 'pickup' && styles.filterTabTextActive]}>
            Pickup ({pickupCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pending Receipts List */}
      {loadingPending ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading pending receipts...</Text>
        </View>
      ) : pendingReceipts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle" size={64} color="#10B981" />
          <Text style={styles.emptyText}>All Caught Up!</Text>
          <Text style={styles.emptySubtext}>No pending receipts at the moment</Text>
        </View>
      ) : (
        <FlatList
          data={pendingReceipts}
          keyExtractor={(item) => item.id?.toString() || item.receiptNumber}
          renderItem={({ item }) => (
            <PendingReceiptCard 
              receipt={item}
              onPress={() => setSelectedPendingReceipt(item)}
            />
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  // Render History Tab Content - Use FlatList with ListHeaderComponent to avoid nested ScrollView
  const renderHistoryTab = () => {
    // Header component for FlatList
    const renderListHeader = () => (
      <>
        {/* Header */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Receipt History</Text>
          <Text style={styles.historySubtitle}>Completed transactions</Text>
        </View>

        {/* Search bar with filter icon */}
        <View style={styles.searchWithFilterContainer}>
          <View style={styles.searchBarWrapper}>
            <SearchBar
              placeholder="Search receipts..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchBarInput}
            />
          </View>
          
          {/* Hamburger Filter Button */}
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={24} color="#333" />
            {hasActiveFilters && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.activeFiltersRow}>
                {(activeFilters.startDate || activeFilters.endDate) && (
                  <Chip 
                    label={`${activeFilters.startDate ? activeFilters.startDate.toLocaleDateString() : 'Any'} - ${activeFilters.endDate ? activeFilters.endDate.toLocaleDateString() : 'Any'}`}
                    onRemove={() => setActiveFilters({ ...activeFilters, startDate: null, endDate: null })}
                  />
                )}
                {activeFilters.createdBy && (
                  <Chip 
                    label={`Created by: ${activeFilters.createdBy.name}`}
                    onRemove={() => setActiveFilters({ ...activeFilters, createdBy: null })}
                  />
                )}
                {activeFilters.fulfilledBy && (
                  <Chip 
                    label={`Fulfilled by: ${activeFilters.fulfilledBy.name}`}
                    onRemove={() => setActiveFilters({ ...activeFilters, fulfilledBy: null })}
                  />
                )}
                {activeFilters.deliveredBy && (
                  <Chip 
                    label={`Delivered by: ${activeFilters.deliveredBy.name}`}
                    onRemove={() => setActiveFilters({ ...activeFilters, deliveredBy: null })}
                  />
                )}
                {activeFilters.status && activeFilters.status.map(status => (
                  <Chip 
                    key={status}
                    label={`Status: ${status}`}
                    onRemove={() => setActiveFilters({ 
                      ...activeFilters, 
                      status: activeFilters.status?.filter(s => s !== status) 
                    })}
                  />
                ))}
                {activeFilters.paymentMethod && activeFilters.paymentMethod.map(method => (
                  <Chip 
                    key={method}
                    label={`Payment: ${method}`}
                    onRemove={() => setActiveFilters({ 
                      ...activeFilters, 
                      paymentMethod: activeFilters.paymentMethod?.filter(m => m !== method) 
                    })}
                  />
                ))}
                {activeFilters.receiptType && activeFilters.receiptType.map(type => (
                  <Chip 
                    key={type}
                    label={`Type: ${type.replace('_', ' ')}`}
                    onRemove={() => setActiveFilters({ 
                      ...activeFilters, 
                      receiptType: activeFilters.receiptType?.filter(t => t !== type) 
                    })}
                  />
                ))}
                
                <TouchableOpacity onPress={handleClearFilters} style={styles.clearAllButton}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Sort/Stats Header */}
        <View style={styles.employeeStats}>
          <TouchableOpacity style={styles.employeeStatCard} onPress={() => setSortBy("date")}>
            <Text style={styles.employeeStatValue}>Date</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.employeeStatCard} onPress={() => setSortBy("total")}>
            <Text style={styles.employeeStatValue}>Total</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.employeeStatCard} onPress={() => setSortBy("customer")}>
            <Text style={styles.employeeStatValue}>Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.employeeStatCard} onPress={toggleSortOrder}>
            <Ionicons
              name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
              size={16}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>
      </>
    );

    // Empty state component
    const renderEmptyState = () => (
      <View style={styles.emptyReceiptCard}>
        <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyReceiptTitle}>No Receipts Found</Text>
        <Text style={styles.emptyReceiptText}>
          {receiptsError 
            ? receiptsError
            : searchTerm.trim()
              ? "No receipts match your search criteria"
              : "No receipts have been created yet"}
        </Text>
      </View>
    );

    // Footer component for loading and stats
    const renderListFooter = () => (
      <>
        {loadingReceipts && (
          <View style={styles.loadingFooter}>
            <ActivityIndicator size="small" color="#E67E22" />
          </View>
        )}
        
        {receipts.length > 0 && !loadingReceipts && (
          <View style={styles.employeeStats}>
            <View style={styles.employeeStatCard}>
              <Text style={styles.employeeStatValue}>{receipts.length}</Text>
              <Text style={styles.employeeStatLabel}>Total Receipts</Text>
            </View>
            <View style={styles.employeeStatCard}>
              <Text style={styles.employeeStatValue}>
                ${receipts.reduce((sum, receipt) => sum + (receipt.totalAmount || receipt.total || 0), 0).toLocaleString()}
              </Text>
              <Text style={styles.employeeStatLabel}>Total Revenue</Text>
            </View>
          </View>
        )}
      </>
    );

    return (
      <View style={styles.receiptContainer}>
        {receiptsError && !loadingReceipts && (
          <View style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{receiptsError}</Text>
            </View>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadReceipts()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* ✅ Single FlatList with header - no ScrollView wrapper */}
        <FlatList
          data={getFilteredAndSortedReceipts()}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id?.toString() || item.receiptNumber || Math.random().toString()}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={!loadingReceipts ? renderEmptyState : null}
          ListFooterComponent={renderListFooter}
          contentContainerStyle={styles.flatListContent}
          refreshing={refreshing}
          onRefresh={handleRefreshReceipts}
          showsVerticalScrollIndicator={true}
        />
      </View>
    );
  };

  // Keep for backward compatibility
  const renderReceiptListTab = () => renderHistoryTab();

  // SmartScanner handlers
  const handleSmartBarcodeDetected = useCallback((barcode: string) => {
    console.log("Barcode detected:", barcode);
    
    // Find item by barcode in inventory
    const item = items.find((item) => item.barcode === barcode);
    if (item) {
      // Add item to receipt using the receipt context method
      addItemToReceipt(item, 1);
      Alert.alert("Item Added!", `${item.name} has been added to the receipt.`);
    } else {
      Alert.alert(
        "Item Not Found", 
        `No item found with barcode: ${barcode}`,
        [
          { text: "OK" },
          { 
            text: "Add Manually", 
            onPress: () => setShowAddToReceipt(true) 
          }
        ]
      );
    }
    
    // Close scanner after processing
    setShowSmartScanner(false);
  }, [items, addItemToReceipt]);

  const handleSmartOcrDetected = useCallback((ocrText: string) => {
    console.log("OCR text detected:", ocrText);
    
    if (!ocrText || ocrText.trim() === "") {
      Alert.alert("No Text Found", "No readable text was found in the image.");
      setShowSmartScanner(false);
      return;
    }

    const lines = ocrText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    let foundItems: Item[] = [];
    
    // Search for items by name matching
    lines.forEach((line) => {
      const foundItem = items.find((item) => 
        item.name.toLowerCase().includes(line.toLowerCase()) ||
        line.toLowerCase().includes(item.name.toLowerCase())
      );
      
      if (foundItem && !foundItems.find(fi => fi.id === foundItem.id)) {
        foundItems.push(foundItem);
      }
    });

    if (foundItems.length > 0) {
      // Add all found items to receipt
      foundItems.forEach(item => {
        addItemToReceipt(item, 1);
      });
      
      Alert.alert(
        "Items Added!", 
        `Found and added ${foundItems.length} item(s): ${foundItems.map(item => item.name).join(", ")}`
      );
    } else {
      Alert.alert(
        "No Items Recognized", 
        "No matching items found in the scanned text. You can add items manually.",
        [
          { text: "OK" },
          { 
            text: "Add Manually", 
            onPress: () => setShowAddToReceipt(true) 
          }
        ]
      );
    }
    
    // Close scanner after processing
    setShowSmartScanner(false);
  }, [items, addItemToReceipt]);

  // Enhanced OCR result handler with better item matching and review capability
  const handleOCRResult = useCallback((extractedItems: Array<{ name: string; price: number; quantity: number }>) => {
    console.log("OCR items detected:", extractedItems);
    
    if (!extractedItems || extractedItems.length === 0) {
      Alert.alert("No Items Found", "No items were extracted from the receipt.");
      return;
    }

    let matchedItems: Item[] = [];
    let unmatchedItems: Array<{ name: string; price: number; quantity: number }> = [];

    // Try to match extracted items with inventory
    extractedItems.forEach((extractedItem) => {
      const foundItem = items.find((item) => 
        item.name.toLowerCase().includes(extractedItem.name.toLowerCase()) ||
        extractedItem.name.toLowerCase().includes(item.name.toLowerCase()) ||
        // Also try partial matching
        extractedItem.name.toLowerCase().split(' ').some(word => 
          item.name.toLowerCase().includes(word) && word.length > 2
        )
      );
      
      if (foundItem && !matchedItems.find(mi => mi.id === foundItem.id)) {
        matchedItems.push(foundItem);
      } else {
        unmatchedItems.push(extractedItem);
      }
    });

    // Add matched items to receipt
    matchedItems.forEach(item => addItemToReceipt(item, 1));

    // Show results to user
    let message = "";
    if (matchedItems.length > 0) {
      message += `${matchedItems.length} items matched and added:\n${matchedItems.map(item => `• ${item.name}`).join('\n')}`;
    }
    
    if (unmatchedItems.length > 0) {
      if (message) message += "\n\n";
      message += `${unmatchedItems.length} items not found in inventory:\n${unmatchedItems.map(item => `• ${item.name} - $${item.price}`).join('\n')}`;
    }

    Alert.alert(
      "OCR Processing Complete", 
      message || "No items could be processed.",
      [
        { text: "OK" },
        ...(unmatchedItems.length > 0 ? [{ 
          text: "Add Missing Items", 
          onPress: () => setShowAddToReceipt(true) 
        }] : [])
      ]
    );
    
    setShowOCRScanner(false);
  }, [items, addItemToReceipt]);

  const subtotal = calculateTotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#E67E22" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>Create Receipt</Text>
            <Text style={styles.storeName}>{currentStore?.storeName || currentStore?.name || 'My Store'}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.metadataRow}>
              <Ionicons name="person" size={14} color="#FFF" />
              <Text style={styles.metadataText}>{user?.name || 'Unknown'}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Ionicons name="calendar" size={14} color="#FFF" />
              <Text style={styles.metadataText}>
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Ionicons 
            name={activeTab === 'create' ? 'add-circle' : 'add-circle-outline'} 
            size={20} 
            color={activeTab === 'create' ? '#1976D2' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            Create
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons 
            name={activeTab === 'pending' ? 'time' : 'time-outline'} 
            size={20} 
            color={activeTab === 'pending' ? '#1976D2' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name={activeTab === 'history' ? 'list' : 'list-outline'} 
            size={20} 
            color={activeTab === 'history' ? '#1976D2' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'create' && renderCreateTab()}
        {activeTab === 'pending' && renderPendingTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </ScrollView>

      {/* Modals */}
      <TakeOrderModal
        visible={showTakeOrderModal}
        onClose={() => setShowTakeOrderModal(false)}
        onSuccess={() => {
          loadPendingReceipts();
          setActiveTab('pending'); // Switch to pending tab after order creation
        }}
      />

      <AddItemToReceiptModal
        visible={showAddToReceipt}
        onClose={() => setShowAddToReceipt(false)}
      />

      <SmartScanner
        visible={showSmartScanner}
        onClose={() => setShowSmartScanner(false)}
        onBarcodeDetected={handleSmartBarcodeDetected}
        onOcrDetected={handleSmartOcrDetected}
      />

      <OCRScanner
        visible={showOCRScanner}
        onClose={() => setShowOCRScanner(false)}
        onOCRResult={handleOCRResult}
      />

      <ReceiptDetailsModal
        visible={showReceiptDetails}
        onClose={() => {
          setShowReceiptDetails(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
        onUpdate={(updatedReceipt) => {
          setReceipts(prev => prev.map(r => r.id === updatedReceipt.id ? updatedReceipt : r));
        }}
      />

      <ReceiptFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={activeFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onOpenEmployeePicker={handleOpenEmployeePicker}
      />

      <EmployeePickerModal
        visible={showEmployeePicker}
        onClose={() => {
          setShowEmployeePicker(false);
          setShowFilterModal(true);
        }}
        onSelect={handleSelectEmployee}
        title={
          employeePickerType === 'createdBy' ? 'Select Creator' :
          employeePickerType === 'fulfilledBy' ? 'Select Fulfiller' :
          'Select Delivery Person'
        }
        employees={employees}
        selectedEmployeeId={activeFilters[employeePickerType]?.id}
      />

      <PaymentModal
        visible={showPaymentModal}
        receipt={selectedReceiptForPayment}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedReceiptForPayment(null);
        }}
        onSuccess={() => {
          refreshReceiptLists();
        }}
      />

      {/* Pending Receipt Action Modal */}
      <Modal
        visible={selectedPendingReceipt !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPendingReceipt(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Receipt Details</Text>
            <TouchableOpacity onPress={() => setSelectedPendingReceipt(null)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {selectedPendingReceipt && (
            <>
              <ScrollView style={styles.modalScrollContent}>
                {/* Receipt Info Card */}
                <View style={styles.receiptInfoCardModal}>
                  <Text style={styles.receiptIdModal}>
                    #{selectedPendingReceipt.receiptNumber}
                  </Text>
                  
                  <View style={styles.infoRowModal}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.infoTextModal}>
                      {formatDate(selectedPendingReceipt.createdAt || selectedPendingReceipt.dateTime)}
                    </Text>
                  </View>

                  <View style={styles.infoRowModal}>
                    <Ionicons name="person" size={16} color="#666" />
                    <Text style={styles.infoTextModal}>
                      {selectedPendingReceipt.customerName || 'Walk-in Customer'}
                    </Text>
                  </View>

                  <View style={styles.infoRowModal}>
                    <Ionicons name="card" size={16} color="#666" />
                    <Text style={styles.infoTextModal}>
                      Payment: {selectedPendingReceipt.paymentMethod || 'Not Paid'}
                    </Text>
                  </View>

                  <View style={styles.statusRowModal}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.statusTextModal}>
                      Status: {selectedPendingReceipt.status}
                    </Text>
                  </View>
                </View>

                {/* ✅ FIX: Show Items Immediately */}
                <View style={styles.itemsSectionModal}>
                  <Text style={styles.sectionTitleModal}>Items</Text>
                  
                  {selectedPendingReceipt.items?.map((item: any, index: number) => {
                    const quantity = item.quantity || 0;
                    const unitPrice = item.unitPrice || item.price || 0;
                    const totalPrice = item.totalPrice || (unitPrice * quantity);
                    
                    return (
                      <View key={index} style={styles.itemRowModal}>
                        <View style={styles.itemDetailsModal}>
                          <Text style={styles.itemNameModal}>{item.product?.name || item.name || 'Unknown Item'}</Text>
                          <Text style={styles.itemPriceModal}>
                            ${unitPrice.toFixed(2)} × {quantity}
                          </Text>
                        </View>
                        <Text style={styles.itemTotalModal}>
                          ${totalPrice.toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}

                  {/* Totals */}
                  <View style={styles.totalsSectionModal}>
                    <View style={styles.totalRowModal}>
                      <Text style={styles.totalLabelModal}>Subtotal:</Text>
                      <Text style={styles.totalValueModal}>
                        ${(selectedPendingReceipt.subtotal || 0).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.totalRowModal}>
                      <Text style={styles.totalLabelModal}>Tax:</Text>
                      <Text style={styles.totalValueModal}>
                        ${(selectedPendingReceipt.tax || selectedPendingReceipt.taxAmount || 0).toFixed(2)}
                      </Text>
                    </View>

                    <View style={[styles.totalRowModal, styles.grandTotalRowModal]}>
                      <Text style={styles.grandTotalLabelModal}>Total:</Text>
                      <Text style={styles.grandTotalValueModal}>
                        ${(selectedPendingReceipt.totalAmount || selectedPendingReceipt.total || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* ✅ FIX: Buttons at bottom, side-by-side */}
              <View style={styles.bottomActions}>
                {/* Pay Now - only show if not paid */}
                {!selectedPendingReceipt.paymentMethod && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.payBtn]}
                    onPress={() => handlePayNow(selectedPendingReceipt)}
                  >
                    <Ionicons name="card" size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>Pay Now</Text>
                  </TouchableOpacity>
                )}

                {/* Mark as Fulfilled - only show if not fulfilled */}
                {!selectedPendingReceipt.fulfilledAt && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.fulfillBtn]}
                    onPress={() => {
                      setSelectedPendingReceipt(null);
                      handleFulfill(selectedPendingReceipt.id);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>Mark as Fulfilled</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        visible={showAddCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddCustomerModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Customer</Text>
            <TouchableOpacity onPress={() => setShowAddCustomerModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Name *</Text>
            <Input
              placeholder="Customer name"
              value={newCustomerForm.name}
              onChangeText={(text) => setNewCustomerForm({ ...newCustomerForm, name: text })}
              style={styles.input}
            />

            <Text style={styles.label}>Phone</Text>
            <Input
              placeholder="Phone number"
              value={newCustomerForm.phone}
              onChangeText={(text) => setNewCustomerForm({ ...newCustomerForm, phone: text })}
              style={styles.input}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <Input
              placeholder="Email address"
              value={newCustomerForm.email}
              onChangeText={(text) => setNewCustomerForm({ ...newCustomerForm, email: text })}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity 
              style={styles.saveCustomerButton}
              onPress={handleAddNewCustomer}
            >
              <Text style={styles.saveCustomerButtonText}>Add Customer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ✅ Constants for styling
const BOTTOM_ACTION_BAR_HEIGHT = 80;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  
  // Header Styles
  header: {
    backgroundColor: '#E67E22',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 12,
    color: '#FFF',
  },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#1976D2',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  
  // Create Tab Content Styles
  createContent: {
    padding: 16,
    gap: 16,
  },
  takeOrderButton: {
    backgroundColor: '#E67E22',
    padding: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  takeOrderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  
  // Pending Tab Content Styles
  pendingContent: {
    padding: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#E67E22',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#E67E22',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  
  receiptContainer: { flex: 1, padding: 16 },
  employeeStats: { flexDirection: "row", marginBottom: 12 },
  employeeStatCard: {
    flex: 1,
    backgroundColor: "#fff7e6",
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  employeeStatValue: { fontSize: 16, fontWeight: "bold", marginRight: 6 },
  employeeStatLabel: { fontSize: 13, color: "#6B7280" },
  addItemToReceiptButton: {
    flexDirection: "row",
    backgroundColor: "#F59E0B",
    padding: 14,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addItemToReceiptText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  scannerOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  scannerOptionButton: {
    flexDirection: "row",
    backgroundColor: "#e0e7ff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
    flex: 1,
    justifyContent: "center",
  },
  scannerOptionText: {
    marginLeft: 8,
    color: "#3B82F6",
    fontWeight: "500",
  },
  receiptInfoCard: {
    backgroundColor: "#fffbe9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  receiptInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  receiptInfoItem: { flexDirection: "row", alignItems: "center" },
  receiptInfoLabel: { fontWeight: "bold", color: "#F59E0B", marginLeft: 6 },
  receiptInfoValue: { fontWeight: "500", color: "#6B7280" },
  customerInputSection: { marginTop: 8 },
  customerInputLabel: { fontWeight: "600", fontSize: 14, marginBottom: 2 },
  customerInput: { borderColor: "#ddd", borderWidth: 1, borderRadius: 8, padding: 8 },
  fieldErrorContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  fieldErrorText: { color: "#EF4444", marginLeft: 4, fontSize: 12 },
  receiptItemsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
    elevation: 2,
  },
  receiptItemsTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  receiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  receiptItemInfo: {},
  receiptItemName: { fontWeight: "600", fontSize: 15 },
  receiptItemPrice: { color: "#6B7280", marginTop: 2, fontSize: 13 },
  receiptItemControls: { flexDirection: "row", alignItems: "center" },
  quantityControls: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  quantityButton: {
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    padding: 2,
    marginHorizontal: 2,
  },
  quantityText: { fontWeight: "bold", fontSize: 15, marginHorizontal: 6 },
  receiptItemTotal: { fontWeight: "bold", marginRight: 10, fontSize: 15 },
  removeItemButton: { marginLeft: 3, padding: 2 },
  receiptTotals: { marginTop: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  totalLabel: { fontWeight: "600", fontSize: 14 },
  totalValue: { fontWeight: "bold", fontSize: 14 },
  grandTotalRow: { marginTop: 6 },
  grandTotalLabel: { fontWeight: "bold", fontSize: 16 },
  grandTotalValue: { fontWeight: "bold", fontSize: 16, color: "#10B981" },
  submitReceiptButton: { marginTop: 16 },
  apiToggleButton: {
    marginTop: 12,
    alignSelf: "center",
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
    padding: 6,
    paddingHorizontal: 12,
  },
  apiToggleText: { color: "#3B82F6", fontWeight: "600" },
  errorContainer: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  errorText: { color: "#EF4444", marginLeft: 6, fontSize: 13 },
  recentReceiptsSection: { marginTop: 16 },
  recentReceiptsTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 6 },
  emptyRecentReceipts: { alignItems: "center", padding: 14 },
  emptyRecentReceiptsText: { color: "#aaa", fontSize: 13 },
  recentReceiptsList: { marginTop: 6 },
  recentReceiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    backgroundColor: "#fffbe9",
    borderRadius: 8,
    padding: 8,
  },
  recentReceiptInfo: {},
  recentReceiptNumber: { fontWeight: "bold" },
  recentReceiptCustomer: { color: "#555" },
  recentReceiptDetails: { alignItems: "flex-end" },
  recentReceiptTotal: { fontWeight: "bold", color: "#10B981" },
  recentReceiptDate: { color: "#555", fontSize: 12 },
  viewAllReceiptsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  viewAllReceiptsText: { color: "#F59E0B", fontWeight: "bold", marginRight: 4 },
  emptyReceiptCard: {
    alignItems: "center",
    marginVertical: 32,
    padding: 18,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  emptyReceiptTitle: { fontWeight: "bold", fontSize: 17, marginTop: 18 },
  emptyReceiptText: { color: "#6B7280", marginTop: 4, fontSize: 13, textAlign: "center" },
  dateFilterContainer: { marginVertical: 10 },
  dateFilterRow: { flexDirection: "row", marginBottom: 4 },
  dateFilterField: { flex: 1, marginHorizontal: 4 },
  clearDateFiltersButton: {
    alignSelf: "flex-end",
    margin: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  clearDateFiltersText: { color: "#F59E0B", fontWeight: "bold" },
  employeesList: {},
  loadingContainer: { alignItems: "center", marginTop: 16 },
  loadingText: { color: "#F59E0B", marginTop: 8 },
  errorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  retryButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  paymentMethodSection: {
    marginTop: 16,
  },
  paymentMethodLabel: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 8,
    color: "#374151",
  },
  paymentMethodButtons: {
    flexDirection: "row",
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  paymentMethodButtonActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  paymentMethodButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  paymentMethodButtonTextActive: {
    color: "#F59E0B",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  warningText: {
    color: "#92400E",
    marginLeft: 8,
    fontSize: 13,
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  scrollButtonsContainer: {
    position: "absolute",
    right: 16,
    bottom: 100,
    zIndex: 1000,
  },
  scrollButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollButtonText: {
    fontSize: 24,
    color: "#FFF",
    fontWeight: "bold",
  },
  cashierFilterContainer: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cashierFilterLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  cashierFilterScroll: {
    marginTop: 4,
  },
  cashierFilterButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cashierFilterButtonActive: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  cashierFilterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  cashierFilterButtonTextActive: {
    color: "#F59E0B",
  },
  filterIndicator: {
    fontSize: 14,
    color: "#F59E0B",
    fontWeight: "normal",
  },
  filterBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  filterBannerText: {
    color: "#92400E",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  clearFilterText: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "bold",
  },
  receiptItemCashier: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  receiptItemCashierIcon: {
    marginRight: 6,
  },
  receiptItemCashierName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
  },
  // Pending Receipts Section Styles
  pendingSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  pendingTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pendingTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  activePendingTab: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  pendingTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activePendingTabText: {
    color: '#F59E0B',
  },
  pendingListContainer: {
    paddingBottom: 12,
  },
  emptyPendingReceipts: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 12,
  },
  emptyPendingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  // History Tab New Styles
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  historySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  searchWithFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  searchBarWrapper: {
    flex: 1,
  },
  searchBarInput: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  activeFiltersContainer: {
    marginBottom: 12,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  clearAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  // Customer Autocomplete Styles
  customerDropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    color: '#FFF',
    fontSize: 16,
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
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addNewCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: '#F0F9FF',
  },
  addNewCustomerText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  // Action Modal Styles
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
  modalScrollContent: {
    flex: 1,
    padding: 16,
  },
  receiptInfoCardModal: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  receiptIdModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTextModal: {
    fontSize: 14,
    color: '#666',
  },
  statusRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusTextModal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  itemsSectionModal: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: BOTTOM_ACTION_BAR_HEIGHT, // Space for bottom buttons
  },
  sectionTitleModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  itemRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemDetailsModal: {
    flex: 1,
  },
  itemNameModal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPriceModal: {
    fontSize: 14,
    color: '#666',
  },
  itemTotalModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalsSectionModal: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
  },
  totalRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabelModal: {
    fontSize: 14,
    color: '#666',
  },
  totalValueModal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalRowModal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  grandTotalLabelModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValueModal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  
  // ✅ FIX: Bottom actions side-by-side
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  payBtn: {
    backgroundColor: '#F59E0B',
  },
  fulfillBtn: {
    backgroundColor: '#10B981',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalContent: {
    padding: 16,
  },
  receiptSummary: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryCustomer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  summaryItems: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  payButton: {
    backgroundColor: '#F59E0B',
  },
  fulfillButton: {
    backgroundColor: '#10B981',
  },
  pickupButton: {
    backgroundColor: '#6366F1',
  },
  deliverButton: {
    backgroundColor: '#3B82F6',
  },
  viewButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
  },
  viewButtonText: {
    color: '#1976D2',
  },
  // Add Customer Modal Styles
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
  saveCustomerButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveCustomerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});