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

import { useReceipt } from "../../context/ReceiptContext";
import { useItems } from "../../context/ItemsContext";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";
import { Receipt, Item } from "../../types";
import ReceiptService from "../../services/api/receiptService";
import { EmployeeService } from "../../services/api/employeeService";

type TabType = "create" | "list";

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
    if (activeTab === "list") {
      loadReceipts();
    }
  }, [activeTab]);

  useEffect(() => {
    loadReceipts();
  }, []);

  // Reload receipts when cashier filter changes
  useEffect(() => {
    if (activeTab === "list") {
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
  const refreshReceiptLists = useCallback(() => {
    loadPendingReceipts();
    if (activeTab === 'list') {
      loadReceipts();
    }
  }, [activeTab]);

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
    if (activeTab === 'create') {
      loadPendingReceipts();
    }
  }, [activeTab, pendingFilter]);

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

  const renderReceiptListTab = () => (
    <View style={styles.receiptContainer}>
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

      {loadingReceipts && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      )}

      {receiptsError && (
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

      {!loadingReceipts && !receiptsError && (
        <FlatList
          data={getFilteredAndSortedReceipts()}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id?.toString() || item.receiptNumber || Math.random().toString()}
          refreshing={refreshing}
          onRefresh={handleRefreshReceipts}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          ListEmptyComponent={() => (
            <View style={styles.emptyReceiptCard}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyReceiptTitle}>No Receipts Found</Text>
              <Text style={styles.emptyReceiptText}>
                {searchTerm.trim()
                  ? "No receipts match your search criteria"
                  : "No receipts have been created yet"}
              </Text>
            </View>
          )}
          style={styles.employeesList}
        />
      )}

      {receipts.length > 0 && (
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
    </View>
  );

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
      <StatusBar backgroundColor="#F59E0B" barStyle="light-content" />
      <Header
        title={activeTab === "create" ? "Create Receipt" : "Receipt History"}
        subtitle={
          activeTab === "create"
            ? "Point of Sale Transaction"
            : "View and search receipts"
        }
        backgroundColor="#F59E0B"
      />

      {/* Tab Navigation */}
      <View style={styles.employeeStats}>
        <TouchableOpacity
          style={[
            styles.employeeStatCard,
            activeTab === "create" && { backgroundColor: "#FEF3C7" },
          ]}
          onPress={() => setActiveTab("create")}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={activeTab === "create" ? "#F59E0B" : "#6B7280"}
          />
          <Text
            style={[
              styles.employeeStatLabel,
              activeTab === "create" && { color: "#F59E0B" },
            ]}
          >
            Create
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.employeeStatCard,
            activeTab === "list" && { backgroundColor: "#FEF3C7" },
          ]}
          onPress={() => setActiveTab("list")}
        >
          <Ionicons
            name="list-outline"
            size={20}
            color={activeTab === "list" ? "#F59E0B" : "#6B7280"}
          />
          <Text
            style={[
              styles.employeeStatLabel,
              activeTab === "list" && { color: "#F59E0B" },
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "create" ? (
        <View style={{ flex: 1 }}>
          <ScrollView 
            ref={scrollRef}
            style={styles.receiptContainer} 
            contentContainerStyle={styles.scrollViewContent}
            // ✅ Enable nested scrolling
            nestedScrollEnabled={true}
            // ✅ Track scroll position
            onScroll={handleScroll}
            scrollEventThrottle={16}
            // ✅ Show scroll indicator
            showsVerticalScrollIndicator={true}
            // ✅ Improve scroll performance
            removeClippedSubviews={true}
            // ✅ Enable momentum scrolling
            decelerationRate="normal"
          >
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
              <Text style={styles.receiptInfoValue}>{user?.name || 'Unknown'}</Text>
            </View>
            <View style={styles.receiptInfoRow}>
              <View style={styles.receiptInfoItem}>
                <Ionicons name="storefront-outline" size={16} color="#F59E0B" />
                <Text style={styles.receiptInfoLabel}>Store</Text>
              </View>
              <Text style={styles.receiptInfoValue}>{currentStore?.storeName || currentStore?.name || 'No store selected'}</Text>
            </View>
            <View style={styles.customerInputSection}>
              <Text style={styles.customerInputLabel}>
                Customer Name (Optional)
              </Text>
              <Input
                placeholder="Enter customer name or leave blank for walk-in"
                value={customerName}
                onChangeText={setCustomerName}
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

            {/* ✅ Store Warning (if no store selected) */}
            {!currentStore && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <Text style={styles.warningText}>
                  No store selected. Please go to Items page and select a store before creating receipts.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.addItemToReceiptButton}
            onPress={() => setShowAddToReceipt(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.addItemToReceiptText}>Add Items to Receipt</Text>
          </TouchableOpacity>

          {/* SmartScanner Option */}
          <View style={styles.scannerOptionsContainer}>
            <TouchableOpacity
              style={styles.scannerOptionButton}
              onPress={() => setShowOCRScanner(true)}
            >
              <Ionicons name="scan" size={20} color="#3B82F6" />
              <Text style={styles.scannerOptionText}>Smart Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scannerOptionButton}
              onPress={() => setShowAddToReceipt(true)}
            >
              <Ionicons name="search" size={20} color="#10B981" />
              <Text style={[styles.scannerOptionText, { color: "#10B981" }]}>Browse Items</Text>
            </TouchableOpacity>
          </View>

          {receiptItems.length > 0 && (
            <View style={styles.receiptItemsCard}>
              <Text style={styles.receiptItemsTitle}>Items in Receipt</Text>
              {receiptItems.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.receiptItem}>
                  <View style={styles.receiptItemInfo}>
                    <Text style={styles.receiptItemName}>{item.name}</Text>
                    <Text style={styles.receiptItemPrice}>
                      ${item.price.toFixed(2)} each
                    </Text>
                  </View>
                  <View style={styles.receiptItemControls}>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updateReceiptItemQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Ionicons name="remove" size={16} color="#F59E0B" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                          updateReceiptItemQuantity(item.id, item.quantity + 1)
                        }
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
                title={submitting ? "Processing..." : "Save as Pending Receipt"}
                onPress={handleCreatePendingReceipt}
                disabled={submitting || receiptItems.length === 0 || !currentStore}
                color="#10B981"
                style={styles.submitReceiptButton}
              />
              {__DEV__ && (
                <TouchableOpacity
                  style={styles.apiToggleButton}
                  onPress={() => setUseApiIntegration(!useApiIntegration)}
                >
                  <Text style={styles.apiToggleText}>
                    API Integration: {useApiIntegration ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              )}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          )}

          {/* Pending Receipts Section */}
          <View style={styles.pendingSection}>
            <Text style={styles.sectionTitle}>⏳ Pending Receipts</Text>
            <Text style={styles.sectionSubtitle}>
              Receipts awaiting fulfillment or delivery
            </Text>
            
            {/* Tabs */}
            <View style={styles.pendingTabs}>
              <TouchableOpacity 
                style={[styles.pendingTab, pendingFilter === 'all' && styles.activePendingTab]}
                onPress={() => setPendingFilter('all')}
              >
                <Text style={[
                  styles.pendingTabText,
                  pendingFilter === 'all' && styles.activePendingTabText
                ]}>
                  All Pending ({pendingCount})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.pendingTab, pendingFilter === 'delivery' && styles.activePendingTab]}
                onPress={() => setPendingFilter('delivery')}
              >
                <Text style={[
                  styles.pendingTabText,
                  pendingFilter === 'delivery' && styles.activePendingTabText
                ]}>
                  🚚 Delivery ({deliveryCount})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.pendingTab, pendingFilter === 'pickup' && styles.activePendingTab]}
                onPress={() => setPendingFilter('pickup')}
              >
                <Text style={[
                  styles.pendingTabText,
                  pendingFilter === 'pickup' && styles.activePendingTabText
                ]}>
                  📦 Pickup ({pickupCount})
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Pending Receipt List */}
            {loadingPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>Loading pending receipts...</Text>
              </View>
            ) : pendingReceipts.length === 0 ? (
              <View style={styles.emptyPendingReceipts}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color="#10B981" />
                <Text style={styles.emptyPendingTitle}>All Caught Up!</Text>
                <Text style={styles.emptyPendingText}>
                  No pending receipts at the moment
                </Text>
              </View>
            ) : (
              <FlatList
                data={pendingReceipts}
                renderItem={({ item }) => (
                  <PendingReceiptCard 
                    receipt={item}
                    onFulfill={() => handleFulfill(item.id)}
                    onDeliver={() => handleMarkDelivered(item.id)}
                    onPayNow={() => handlePayNow(item)}
                  />
                )}
                keyExtractor={(item) => item.id?.toString() || item.receiptNumber}
                contentContainerStyle={styles.pendingListContainer}
                scrollEnabled={false}
              />
            )}
          </View>

          {receiptItems.length === 0 && (
            <View style={styles.emptyReceiptCard}>
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyReceiptTitle}>No Items Added</Text>
              <Text style={styles.emptyReceiptText}>
                Tap "Add Items to Receipt" to start creating a transaction, or use "Smart Scan" to quickly scan barcodes and recognize text
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Scroll Buttons */}
        {showScrollButtons && (
          <View style={styles.scrollButtonsContainer}>
            <TouchableOpacity
              style={styles.scrollButton}
              onPress={scrollToTop}
            >
              <Text style={styles.scrollButtonText}>↑</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.scrollButton, { marginTop: 8 }]}
              onPress={scrollToBottom}
            >
              <Text style={styles.scrollButtonText}>↓</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
      ) : (
        renderReceiptListTab()
      )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
});