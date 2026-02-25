import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import { useItems } from './ItemsContext';
import { useAuth } from './AuthContext';
import { Receipt, ReceiptItem, Item } from '../types';
import { ReceiptService, CreateReceiptRequest, CashierStats } from '../services';
import { useAuthenticatedAPI, useApiReadiness } from '../hooks';
import { responseCache } from '../services/api/cache';

// API response types for better type safety
interface ApiReceiptItem {
  id?: number;
  productId?: string;
  name?: string;
  productName?: string;
  price?: number;
  unitPrice?: number;
  quantity?: number;
  total?: number;
  totalPrice?: number;
  subtotal?: number;
  stock?: number;
  product?: {
    name?: string;
    sku?: string;
  };
}

interface ApiReceipt {
  id: number;
  receiptNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotal?: number;
  tax?: number;
  taxAmount?: number;
  discountAmount?: number;
  total?: number;
  totalAmount?: number;
  status?: string;
  storeId?: string;
  storeName?: string;
  processedById?: string;
  processedByUsername?: string;
  processedByFullName?: string;
  paymentMethod?: string;
  notes?: string;
  items?: ApiReceiptItem[];
  createdAt?: string;
  updatedAt?: string;
  dateTime?: string;
}

interface ReceiptContextType {
  receiptItems: ReceiptItem[];
  customerName: string;
  paymentMethod: string;
  receiptType: 'IN_STORE' | 'PICKUP' | 'DELIVERY' | 'HOLD';
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  setCustomerName: (name: string) => void;
  setPaymentMethod: (method: string) => void;
  setReceiptType: (type: 'IN_STORE' | 'PICKUP' | 'DELIVERY' | 'HOLD') => void;
  addItemToReceipt: (item: Item, quantity?: number) => void;
  removeItemFromReceipt: (itemId: number) => void;
  updateReceiptItemQuantity: (itemId: number, quantity: number) => void;
  calculateTotal: () => number;
  calculateTax: (subtotal: number) => number;
  handleSubmitReceipt: () => Promise<void>;
  clearReceipt: () => void;
  refreshReceipts: () => Promise<void>;
  useApiIntegration: boolean;
  setUseApiIntegration: (use: boolean) => void;
  // GM+ cashier filter support
  selectedCashier: string | null;
  setSelectedCashier: (cashierId: string | null) => void;
  cashierStats: CashierStats[];
  loadCashierStats: () => Promise<void>;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export function ReceiptProvider({ children }: { children: ReactNode }) {
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [receiptType, setReceiptType] = useState<'IN_STORE' | 'PICKUP' | 'DELIVERY' | 'HOLD'>('IN_STORE');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [useApiIntegration, setUseApiIntegration] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { items, setItems } = useItems();
  const { user } = useAuth();  // ✅ Get user from auth context

  // GM+ cashier filter state
  const [selectedCashier, setSelectedCashier] = useState<string | null>(null);
  const [cashierStats, setCashierStats] = useState<CashierStats[]>([]);

  // Check if user is GM+ (case-insensitive)
  const userRoleUpper = user?.role?.toUpperCase();
  const isGMPlus = userRoleUpper === 'OWNER' ||
                   userRoleUpper === 'GENERAL_MANAGER' || 
                   userRoleUpper === 'CEO' || 
                   userRoleUpper === 'FOUNDER' ||
                   userRoleUpper === 'ADMIN';

  // Authentication readiness check
  const { canMakeApiCalls } = useApiReadiness();

  // API integration using useAuthenticatedAPI hook
  const {
    data: apiReceipts,
    loading,
    error,
    execute: fetchReceipts,
    reset,
  } = useAuthenticatedAPI(
    () => ReceiptService.getAllReceipts(0, 20, selectedCashier || undefined), 
    { immediate: false }
  );

  // Effect to sync API data with local state when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && apiReceipts && apiReceipts.receipts) {
      // Normalize all receipts from API
      const normalizedReceipts = apiReceipts.receipts.map(normalizeReceipt);
      setReceipts(normalizedReceipts);
    } else if (!useApiIntegration) {
      // Keep local receipts when API integration is disabled
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useApiIntegration, apiReceipts]);

  // Auto-fetch receipts when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && canMakeApiCalls) {
      fetchReceipts();
    }
  }, [useApiIntegration, canMakeApiCalls]);

  const addItemToReceipt = useCallback((item: Item, quantity = 1) => {
    // ✅ Get available stock from product.quantity
    const availableStock = item.quantity || 0;

    if (__DEV__) {
      console.log(`🛒 Adding ${quantity}x ${item.name} (Stock: ${availableStock})`);
    }

    // Find existing item in cart
    const existingItem = receiptItems.find(ri => ri.id === item.id);
    
    // Calculate total quantity if we add this
    const currentQuantityInCart = existingItem?.quantity || 0;
    const newTotalQuantity = currentQuantityInCart + quantity;

    if (__DEV__) {
      console.log(`  - Current in cart: ${currentQuantityInCart}`);
      console.log(`  - Adding: ${quantity}`);
      console.log(`  - New total would be: ${newTotalQuantity}`);
      console.log(`  - Available stock: ${availableStock}`);
    }

    // ✅ CORRECT VALIDATION: Check if total quantity exceeds stock
    if (availableStock === 0) {
      Alert.alert('Out of Stock', `${item.name} is currently out of stock.`);
      return;
    }

    if (newTotalQuantity > availableStock) {
      Alert.alert(
        'Insufficient Stock',
        `Cannot add ${quantity} more ${item.name}.\n\n` +
        `Already in cart: ${currentQuantityInCart}\n` +
        `Available stock: ${availableStock}\n` +
        `Maximum you can add: ${availableStock - currentQuantityInCart}`
      );
      return;
    }

    // ✅ Stock validation passed - add or update item
    if (existingItem) {
      // Update existing item quantity and stock
      setReceiptItems(receiptItems.map(ri => 
        ri.id === item.id 
          ? { 
              ...ri, 
              quantity: newTotalQuantity, 
              total: ri.price * newTotalQuantity,
              stock: availableStock, // ✅ Update stock too!
            }
          : ri
      ));
      if (__DEV__) {
        console.log(`✅ Updated ${item.name} quantity to ${newTotalQuantity}`);
      }
    } else {
      // Add new item with stock field
      const newItem: ReceiptItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity,
        total: item.price * quantity,
        stock: availableStock, // ✅ CRITICAL: Store stock from product
      };
      setReceiptItems([...receiptItems, newItem]);
      if (__DEV__) {
        console.log(`✅ Added new item:`, newItem);
      }
    }
    Alert.alert('Success', `${item.name} added to receipt!`);
  }, [receiptItems]);

  const removeItemFromReceipt = useCallback((itemId: number) => {
    setReceiptItems(receiptItems.filter(item => item.id !== itemId));
  }, [receiptItems]);

  const updateReceiptItemQuantity = useCallback((itemId: number, newQuantity: number) => {
    const receiptItem = receiptItems.find(item => item.id === itemId);
    if (!receiptItem) {
      if (__DEV__) {
        console.warn(`⚠️ Item ${itemId} not found in receipt`);
      }
      return;
    }

    if (__DEV__) {
      console.log(`📝 Updating ${receiptItem.name} quantity from ${receiptItem.quantity} to ${newQuantity}`);
      console.log(`  - Item stock: ${receiptItem.stock}`);
    }

    if (newQuantity <= 0) {
      if (__DEV__) {
        console.log(`🗑️ Removing ${receiptItem.name} from receipt (quantity <= 0)`);
      }
      removeItemFromReceipt(itemId);
      return;
    }

    // ✅ Validate against stored stock in receipt item
    if (newQuantity > receiptItem.stock) {
      if (__DEV__) {
        console.log(`❌ Cannot update quantity: ${newQuantity} exceeds available stock ${receiptItem.stock}`);
      }
      Alert.alert(
        'Insufficient Stock',
        `Cannot set quantity to ${newQuantity}.\n\n` +
        `Product: ${receiptItem.name}\n` +
        `Available stock: ${receiptItem.stock}\n` +
        `Current in cart: ${receiptItem.quantity}`
      );
      return;
    }

    setReceiptItems(receiptItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity, total: item.price * newQuantity } : item
    ));
    if (__DEV__) {
      console.log(`✅ Updated ${receiptItem.name} quantity to ${newQuantity}`);
    }
  }, [receiptItems, removeItemFromReceipt]);

  const calculateTotal = useCallback(() => {
    return receiptItems.reduce((sum, item) => sum + item.total, 0);
  }, [receiptItems]);

  const calculateTax = useCallback((subtotal: number) => {
    return subtotal * 0.08;
  }, []);

  const generateReceiptNumber = useCallback(() => {
    return `RCP-${Date.now()}`;
  }, []);

  // Normalize backend receipt response to match frontend expectations
  const normalizeReceipt = useCallback((apiReceipt: ApiReceipt): Receipt => {
    return {
      id: apiReceipt.id,
      receiptNumber: apiReceipt.receiptNumber || `RCP-${apiReceipt.id}`,
      
      // Customer
      customerName: apiReceipt.customerName,
      customerEmail: apiReceipt.customerEmail,
      customerPhone: apiReceipt.customerPhone,
      
      // Amounts - prioritize new field names, fallback to legacy
      subtotal: apiReceipt.subtotal || 0,
      taxAmount: apiReceipt.taxAmount || apiReceipt.tax || 0,
      tax: apiReceipt.taxAmount || apiReceipt.tax || 0, // Legacy field
      discountAmount: apiReceipt.discountAmount || 0,
      totalAmount: apiReceipt.totalAmount || apiReceipt.total || 0,
      total: apiReceipt.totalAmount || apiReceipt.total || 0, // Legacy field
      
      // Status
      status: apiReceipt.status || 'completed',
      
      // Store
      storeId: apiReceipt.storeId,
      storeName: apiReceipt.storeName,
      
      // User
      processedById: apiReceipt.processedById,
      processedByUsername: apiReceipt.processedByUsername,
      processedByFullName: apiReceipt.processedByFullName,
      
      // Payment
      paymentMethod: apiReceipt.paymentMethod || 'CASH',
      notes: apiReceipt.notes,
      
      // Items
      items: (apiReceipt.items || []).map((item: ApiReceiptItem) => ({
        id: item.id || (item.productId ? Number(item.productId) : 0),
        name: item.name || item.productName || item.product?.name || 'Unknown Item',
        price: item.price || item.unitPrice || 0,
        quantity: item.quantity || 0,
        total: item.total || item.totalPrice || item.subtotal || 0,
        stock: item.stock || 0,
      })),
      
      // Timestamps - prioritize new field names, fallback to legacy
      createdAt: apiReceipt.createdAt || apiReceipt.dateTime || new Date().toISOString(),
      updatedAt: apiReceipt.updatedAt || apiReceipt.createdAt || new Date().toISOString(),
      dateTime: apiReceipt.createdAt || apiReceipt.dateTime || new Date().toISOString(), // Legacy field
    };
  }, []);

  const clearReceipt = useCallback(() => {
    setReceiptItems([]);
    setCustomerName('');
    setPaymentMethod('CASH');
    setReceiptType('IN_STORE');
  }, []);

  const handleSubmitReceipt = useCallback(async (): Promise<void> => {
    if (receiptItems.length === 0) {
      Alert.alert('Error', 'Please add items to the receipt');
      return;
    }

    // ✅ NO stock validation here - it was already done when adding items to cart!
    // Stock is validated in addItemToReceipt() (lines 89-103) with proper error handling.
    // Redundant validation here is unnecessary and was causing false "Insufficient Stock" errors.

    const subtotal = calculateTotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    // ✅ CRITICAL: Backend expects items array with productId and quantity only
    // ✅ Include storeId if user has an active store
    const payload: CreateReceiptRequest = {
      items: receiptItems.map(item => ({
        productId: item.id.toString(),  // Convert number ID to string as backend expects
        quantity: item.quantity,         // Integer >= 1
      })),
      paymentMethod: paymentMethod || 'CASH',
      customerName: customerName || undefined,  // Optional field, send undefined if empty
      storeId: user?.activeStoreId,  // ✅ Include user's active store ID if available
      receiptType: receiptType,  // ✅ Include receipt type
    };

    if (__DEV__) {
      console.log('📤 ========================================');
      console.log('📤 SENDING TO BACKEND:');
      console.log(JSON.stringify(payload, null, 2));
      if (payload.storeId) {
        console.log('✅ Store ID included:', payload.storeId);
      } else {
        console.log('⚠️  No store ID - backend may derive from user context');
      }
      console.log('📤 ========================================');
    }

    setSubmitting(true);

    try {
      let receipt: Receipt;

      if (useApiIntegration && canMakeApiCalls) {
        // Create receipt via API
        if (__DEV__) {
          console.log('🌐 Sending receipt to API...');
        }
        const apiReceipt = await ReceiptService.createReceipt(payload);
        receipt = normalizeReceipt(apiReceipt); // ✅ Normalize backend response
        if (__DEV__) {
          console.log('✅ Receipt created successfully:', receipt);
          console.log(`✅ Receipt created: ${receipt.receiptNumber}`);
        }
        // ✅ Invalidate dashboard cache so it re-fetches on next focus
        console.log('🗑️  Clearing dashboard cache after receipt creation');
        responseCache.clear();
        setReceipts(prev => [receipt, ...prev]);
      } else {
        // Create receipt locally
        receipt = {
          id: Date.now(),
          receiptNumber: generateReceiptNumber(),
          customerName: customerName || 'Walk-in Customer',
          items: [...receiptItems],
          subtotal,
          tax,
          taxAmount: tax,
          total,
          totalAmount: total,
          dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'completed',
          paymentMethod: paymentMethod || 'CASH',
        };
        setReceipts(prev => [receipt, ...prev]);
      }

      // Update items inventory and sales count
      setItems(prevItems => 
        prevItems.map(item => {
          const soldItem = receiptItems.find(ri => ri.id === item.id);
          if (soldItem) {
            const newQuantity = item.quantity - soldItem.quantity;
            return {
              ...item,
              quantity: Math.max(0, newQuantity),
              total: item.price * Math.max(0, newQuantity),
              salesCount: item.salesCount + soldItem.quantity
            };
          }
          return item;
        })
      );

      clearReceipt();
      Alert.alert(
        'Success! 🎉',
        `Receipt #${receipt.receiptNumber} created\n\nTotal: $${(receipt.totalAmount || receipt.total || 0).toFixed(2)}`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      console.error('❌ Error details:', error.response?.data);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process transaction';
      Alert.alert('Error', errorMessage);

      // If API fails, fall back to local creation
      if (useApiIntegration) {
        const receipt: Receipt = {
          id: Date.now(),
          receiptNumber: generateReceiptNumber(),
          customerName: customerName || 'Walk-in Customer',
          items: [...receiptItems],
          subtotal,
          tax,
          taxAmount: tax,
          total,
          totalAmount: total,
          dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'completed',
          paymentMethod: paymentMethod || 'CASH',
        };
        setReceipts(prev => [receipt, ...prev]);
        clearReceipt();
        Alert.alert('Info', 'Transaction saved locally - will sync when connection is restored');
      }
    } finally {
      setSubmitting(false);
    }
  }, [receiptItems, items, calculateTotal, calculateTax, generateReceiptNumber, customerName, paymentMethod, receiptType, useApiIntegration, canMakeApiCalls, setItems, clearReceipt, user?.activeStoreId]);

  const refreshReceipts = useCallback(async (): Promise<void> => {
    if (useApiIntegration && canMakeApiCalls) {
      await fetchReceipts();
    }
  }, [useApiIntegration, canMakeApiCalls, fetchReceipts]);

  // Load cashier stats (GM+ only)
  const loadCashierStats = useCallback(async (): Promise<void> => {
    if (!isGMPlus) {
      if (__DEV__) {
        console.log('⏭️ ReceiptContext: Not GM+, skipping cashier stats');
      }
      return;
    }
    
    try {
      if (__DEV__) {
        console.log('📊 ReceiptContext: Loading cashier stats...');
      }
      const data = await ReceiptService.getCashierStats();
      if (__DEV__) {
        console.log('✅ ReceiptContext: Loaded', data.length, 'cashier(s)');
      }
      setCashierStats(data);
    } catch (error) {
      console.error('❌ ReceiptContext: Error loading cashier stats:', error);
      setCashierStats([]);
    }
  }, [isGMPlus]);

  // Load cashier stats when user is GM+ and on mount
  useEffect(() => {
    if (__DEV__) {
      console.log('🔍 ReceiptContext: GM+ check - isGMPlus:', isGMPlus, 'role:', user?.role);
    }
    
    if (isGMPlus && canMakeApiCalls) {
      if (__DEV__) {
        console.log('✅ ReceiptContext: Loading cashier stats for GM+ user');
      }
      loadCashierStats();
    }
  }, [isGMPlus, canMakeApiCalls, loadCashierStats]);

  // Reload receipts when cashier filter changes
  useEffect(() => {
    if (useApiIntegration && canMakeApiCalls) {
      if (__DEV__) {
        console.log('🔄 ReceiptContext: Reloading receipts - cashier:', selectedCashier || 'All');
      }
      fetchReceipts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCashier, useApiIntegration, canMakeApiCalls]);

  return (
    <ReceiptContext.Provider value={{
      receiptItems,
      customerName,
      paymentMethod,
      receiptType,
      receipts,
      loading,
      error,
      submitting,
      setCustomerName,
      setPaymentMethod,
      setReceiptType,
      addItemToReceipt,
      removeItemFromReceipt,
      updateReceiptItemQuantity,
      calculateTotal,
      calculateTax,
      handleSubmitReceipt,
      clearReceipt,
      refreshReceipts,
      useApiIntegration,
      setUseApiIntegration,
      selectedCashier,
      setSelectedCashier,
      cashierStats,
      loadCashierStats,
    }}>
      {children}
    </ReceiptContext.Provider>
  );
}

export function useReceipt() {
  const context = useContext(ReceiptContext);
  if (context === undefined) {
    throw new Error('useReceipt must be used within a ReceiptProvider');
  }
  return context;
}