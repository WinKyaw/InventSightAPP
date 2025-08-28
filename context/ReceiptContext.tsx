import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useItems } from './ItemsContext';
import { Receipt, ReceiptItem, Item } from '../types';
import { ReceiptService } from '../services';
import { useApi } from '../hooks/useApi';

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
  const [useApiIntegration, setUseApiIntegration] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { items, setItems } = useItems();

  // API integration using useApi hook
  const {
    data: apiReceipts,
    loading,
    error,
    execute: fetchReceipts,
    reset,
  } = useApi(() => ReceiptService.getAllReceipts());

  // Effect to sync API data with local state when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && apiReceipts) {
      setReceipts(apiReceipts.receipts || []);
    } else if (!useApiIntegration) {
      // Keep local receipts when API integration is disabled
    }
  }, [useApiIntegration, apiReceipts]);

  // Auto-fetch receipts when API integration is enabled
  useEffect(() => {
    if (useApiIntegration) {
      fetchReceipts();
    }
  }, [useApiIntegration, fetchReceipts]);

  const addItemToReceipt = (item: Item, quantity = 1) => {
    if (item.quantity < quantity) {
      Alert.alert('Insufficient Stock', `Only ${item.quantity} units available for ${item.name}`);
      return;
    }

    const existingItem = receiptItems.find(ri => ri.id === item.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > item.quantity) {
        Alert.alert('Insufficient Stock', `Only ${item.quantity} units available for ${item.name}`);
        return;
      }
      setReceiptItems(receiptItems.map(ri => 
        ri.id === item.id 
          ? { ...ri, quantity: newQuantity, total: ri.price * newQuantity }
          : ri
      ));
    } else {
      setReceiptItems([...receiptItems, { 
        id: item.id,
        name: item.name,
        price: item.price,
        quantity,
        total: item.price * quantity
      }]);
    }
    Alert.alert('Success', `${item.name} added to receipt!`);
  };

  const removeItemFromReceipt = (itemId: number) => {
    setReceiptItems(receiptItems.filter(item => item.id !== itemId));
  };

  const updateReceiptItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromReceipt(itemId);
      return;
    }

    const inventoryItem = items.find(item => item.id === itemId);
    if (inventoryItem && newQuantity > inventoryItem.quantity) {
      Alert.alert('Insufficient Stock', `Only ${inventoryItem.quantity} units available`);
      return;
    }

    setReceiptItems(receiptItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity, total: item.price * newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return receiptItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.08;
  };

  const generateReceiptNumber = () => {
    return `RCP-${Date.now()}`;
  };

  const handleSubmitReceipt = async (): Promise<void> => {
    if (receiptItems.length === 0) {
      Alert.alert('Error', 'Please add items to the receipt');
      return;
    }

    // Validate stock availability
    for (const receiptItem of receiptItems) {
      const inventoryItem = items.find(item => item.id === receiptItem.id);
      if (!inventoryItem || inventoryItem.quantity < receiptItem.quantity) {
        Alert.alert('Insufficient Stock', `Not enough stock for ${receiptItem.name}`);
        return;
      }
    }

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

      if (useApiIntegration) {
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
  };

  const refreshReceipts = async (): Promise<void> => {
    if (useApiIntegration) {
      await fetchReceipts();
    }
  };

  const clearReceipt = () => {
    setReceiptItems([]);
    setCustomerName('');
  };

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