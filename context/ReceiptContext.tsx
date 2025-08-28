import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { useItems } from './ItemsContext';
import { Receipt, ReceiptItem, Item } from '../types';
import { ReceiptService, CreateReceiptRequest } from '../services';
import { useApi } from '../hooks';

interface ReceiptContextType {
  receiptItems: ReceiptItem[];
  customerName: string;
  receipts: Receipt[];
  setCustomerName: (name: string) => void;
  addItemToReceipt: (item: Item, quantity?: number) => void;
  removeItemFromReceipt: (itemId: number) => void;
  updateReceiptItemQuantity: (itemId: number, quantity: number) => void;
  calculateTotal: () => number;
  calculateTax: (subtotal: number) => number;
  handleSubmitReceipt: () => void;
  clearReceipt: () => void;
  // New API-related properties
  loading: boolean;
  error: string | null;
  refreshReceipts: () => Promise<void>;
  deleteReceipt: (id: number) => Promise<void>;
  useApiIntegration: boolean;
  setUseApiIntegration: (use: boolean) => void;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export function ReceiptProvider({ children }: { children: ReactNode }) {
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [useApiIntegration, setUseApiIntegration] = useState<boolean>(true);
  const { items, setItems } = useItems();

  // API integration using useApi hook
  const {
    data: apiReceipts,
    loading,
    error,
    execute: fetchReceipts,
    reset,
  } = useApi(() => ReceiptService.getAllReceipts(1, 100));

  // API for creating receipts
  const {
    loading: createLoading,
    execute: createReceiptApi,
  } = useApi(async () => {
    // This will be called with data later
    throw new Error('Use executeCreate instead');
  });

  // Helper function to create receipt with data
  const executeCreateReceipt = async (receiptData: CreateReceiptRequest): Promise<Receipt> => {
    try {
      return await ReceiptService.createReceipt(receiptData);
    } catch (error) {
      console.error('Failed to create receipt:', error);
      throw error;
    }
  };

  // Effect to sync API data with local state when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && apiReceipts) {
      setReceipts(apiReceipts.receipts as Receipt[]);
    } else if (!useApiIntegration) {
      setReceipts([]);
    }
  }, [useApiIntegration, apiReceipts]);

  // Auto-fetch receipts when API integration is enabled
  useEffect(() => {
    if (useApiIntegration) {
      fetchReceipts().catch(console.error);
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

  const handleSubmitReceipt = async () => {
    if (receiptItems.length === 0) {
      Alert.alert('Error', 'Please add items to the receipt');
      return;
    }

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

    if (useApiIntegration) {
      try {
        // Create receipt via API
        const receiptData: CreateReceiptRequest = {
          customerName: customerName || 'Walk-in Customer',
          items: receiptItems.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total
          })),
          subtotal,
          tax,
          total,
          dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        const newReceipt = await executeCreateReceipt(receiptData);
        
        // Update local inventory
        const updatedItems = items.map(item => {
          const receiptItem = receiptItems.find(ri => ri.id === item.id);
          if (receiptItem) {
            return { ...item, quantity: item.quantity - receiptItem.quantity };
          }
          return item;
        });
        setItems(updatedItems);

        // Add receipt to local state
        setReceipts(prev => [newReceipt, ...prev]);
        
        Alert.alert('Success', 'Receipt created successfully!');
        clearReceipt();
        
      } catch (error) {
        console.error('Failed to create receipt:', error);
        Alert.alert('Error', 'Failed to create receipt. Please try again.');
      }
    } else {
      // Fallback to local storage (original implementation)
      const receipt: Receipt = {
        id: Date.now(),
        receiptNumber: generateReceiptNumber(),
        customerName: customerName || 'Walk-in Customer',
        items: [...receiptItems],
        subtotal,
        tax,
        total,
        dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'completed'
      };

      setReceipts(prev => [receipt, ...prev]);

      const updatedItems = items.map(item => {
        const receiptItem = receiptItems.find(ri => ri.id === item.id);
        if (receiptItem) {
          return { ...item, quantity: item.quantity - receiptItem.quantity };
        }
        return item;
      });
      setItems(updatedItems);

      Alert.alert('Success', `Receipt ${receipt.receiptNumber} has been created!`);
      clearReceipt();
    }
  };

  const clearReceipt = () => {
    setReceiptItems([]);
    setCustomerName('');
  };

  // New API-related functions
  const refreshReceipts = async () => {
    if (useApiIntegration) {
      await fetchReceipts();
    }
  };

  const deleteReceiptFunction = async (id: number) => {
    if (useApiIntegration) {
      try {
        await ReceiptService.deleteReceipt(id);
        setReceipts(prev => prev.filter(receipt => receipt.id !== id));
        Alert.alert('Success', 'Receipt deleted successfully');
      } catch (error) {
        console.error('Failed to delete receipt:', error);
        Alert.alert('Error', 'Failed to delete receipt. Please try again.');
      }
    } else {
      setReceipts(prev => prev.filter(receipt => receipt.id !== id));
      Alert.alert('Success', 'Receipt deleted successfully');
    }
  };

  return (
    <ReceiptContext.Provider value={{
      receiptItems,
      customerName,
      receipts,
      setCustomerName,
      addItemToReceipt,
      removeItemFromReceipt,
      updateReceiptItemQuantity,
      calculateTotal,
      calculateTax,
      handleSubmitReceipt,
      clearReceipt,
      loading: loading,
      error,
      refreshReceipts,
      deleteReceipt: deleteReceiptFunction,
      useApiIntegration,
      setUseApiIntegration
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