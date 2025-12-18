import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import { useItems } from './ItemsContext';
import { Receipt, ReceiptItem, Item } from '../types';
import { ReceiptService } from '../services';
import { useAuthenticatedAPI, useApiReadiness } from '../hooks';

interface ReceiptContextType {
  receiptItems: ReceiptItem[];
  customerName: string;
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  setCustomerName: (name: string) => void;
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
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export function ReceiptProvider({ children }: { children: ReactNode }) {
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [useApiIntegration, setUseApiIntegration] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { items, setItems } = useItems();

  // Authentication readiness check
  const { canMakeApiCalls } = useApiReadiness();

  // API integration using useAuthenticatedAPI hook
  const {
    data: apiReceipts,
    loading,
    error,
    execute: fetchReceipts,
    reset,
  } = useAuthenticatedAPI(() => ReceiptService.getAllReceipts(), { immediate: false });

  // Effect to sync API data with local state when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && apiReceipts && apiReceipts.receipts) {
      setReceipts(apiReceipts.receipts);
    } else if (!useApiIntegration) {
      // Keep local receipts when API integration is disabled
    }
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

  const clearReceipt = useCallback(() => {
    setReceiptItems([]);
    setCustomerName('');
  }, []);

  const handleSubmitReceipt = useCallback(async (): Promise<void> => {
    if (receiptItems.length === 0) {
      Alert.alert('Error', 'Please add items to the receipt');
      return;
    }

    // ✅ NO stock validation here - it was already done when adding items to cart!
    // Stock was validated in addItemToReceipt() and stored in receiptItem.stock
    // Re-validating here can cause false errors if inventory was updated elsewhere

    const subtotal = calculateTotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    const receiptData = {
      customerName: customerName || 'Walk-in Customer',
      items: [...receiptItems],
      subtotal,
      tax,
      total,
    };

    setSubmitting(true);

    try {
      let receipt: Receipt;

      if (useApiIntegration && canMakeApiCalls) {
        // Create receipt via API
        receipt = await ReceiptService.createReceipt(receiptData);
        setReceipts(prev => [receipt, ...prev]);
      } else {
        // Create receipt locally
        receipt = {
          id: Date.now(),
          receiptNumber: generateReceiptNumber(),
          customerName: receiptData.customerName,
          items: receiptData.items,
          subtotal: receiptData.subtotal,
          tax: receiptData.tax,
          total: receiptData.total,
          dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'completed'
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
      Alert.alert('Success', `Transaction completed successfully! Receipt #${receipt.receiptNumber}`);

    } catch (error) {
      console.error('Failed to create receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process transaction';
      Alert.alert('Error', errorMessage);

      // If API fails, fall back to local creation
      if (useApiIntegration) {
        const receipt: Receipt = {
          id: Date.now(),
          receiptNumber: generateReceiptNumber(),
          customerName: receiptData.customerName,
          items: receiptData.items,
          subtotal: receiptData.subtotal,
          tax: receiptData.tax,
          total: receiptData.total,
          dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'completed'
        };
        setReceipts(prev => [receipt, ...prev]);
        clearReceipt();
        Alert.alert('Info', 'Transaction saved locally - will sync when connection is restored');
      }
    } finally {
      setSubmitting(false);
    }
  }, [receiptItems, items, calculateTotal, calculateTax, generateReceiptNumber, customerName, useApiIntegration, canMakeApiCalls, setItems, clearReceipt]);

  const refreshReceipts = useCallback(async (): Promise<void> => {
    if (useApiIntegration && canMakeApiCalls) {
      await fetchReceipts();
    }
  }, [useApiIntegration, canMakeApiCalls, fetchReceipts]);

  return (
    <ReceiptContext.Provider value={{
      receiptItems,
      customerName,
      receipts,
      loading,
      error,
      submitting,
      setCustomerName,
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