import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useItems } from './ItemsContext';
import { Receipt, ReceiptItem, Item, CreateReceiptRequest, UpdateReceiptRequest } from '../types';
import { ReceiptService } from '../services/api/receiptService';
import { useApi, useApiWithParams } from '../hooks/useApi';

interface ReceiptContextType {
  receiptItems: ReceiptItem[];
  customerName: string;
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  setCustomerName: (name: string) => void;
  addItemToReceipt: (item: Item, quantity?: number) => void;
  removeItemFromReceipt: (itemId: number) => void;
  updateReceiptItemQuantity: (itemId: number, quantity: number) => void;
  calculateTotal: () => number;
  calculateTax: (subtotal: number) => number;
  handleSubmitReceipt: () => Promise<void>;
  clearReceipt: () => void;
  fetchReceipts: () => Promise<void>;
  deleteReceipt: (receiptId: string) => Promise<void>;
  searchReceipts: (query: string) => Promise<void>;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export function ReceiptProvider({ children }: { children: ReactNode }) {
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const { items, setItems } = useItems();

  // API hooks for receipt operations
  const {
    data: fetchedReceipts,
    loading: fetchingReceipts,
    error: fetchError,
    execute: executeFetchReceipts,
  } = useApi(() => ReceiptService.getAllReceipts());

  const {
    loading: creatingReceipt,
    error: createError,
    execute: executeCreateReceipt,
  } = useApiWithParams((receiptData: CreateReceiptRequest) => ReceiptService.createReceipt(receiptData));

  const {
    loading: deletingReceipt,
    error: deleteError,
    execute: executeDeleteReceipt,
  } = useApiWithParams((receiptId: string) => ReceiptService.deleteReceipt(receiptId));

  const {
    data: searchResults,
    loading: searchingReceipts,
    error: searchError,
    execute: executeSearchReceipts,
  } = useApiWithParams((query: string) => ReceiptService.searchReceipts({ query }));

  // Combine all loading states
  const loading = fetchingReceipts || creatingReceipt || deletingReceipt || searchingReceipts;
  // Combine all error states
  const error = fetchError || createError || deleteError || searchError;

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

    try {
      // Check inventory availability
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

      // Prepare receipt data for API
      const receiptData: CreateReceiptRequest = {
        customerName: customerName || 'Walk-in Customer',
        vendor: 'InventSight Store', // Default vendor
        items: receiptItems.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        tax,
        total,
      };

      // Create receipt via API
      const createdReceipt = await executeCreateReceipt(receiptData);

      // Update local state
      setReceipts([createdReceipt, ...receipts]);
      
      // Update items inventory and sales count locally
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
      Alert.alert('Success', 'Transaction completed successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete transaction');
    }
  };

  const fetchReceipts = async (): Promise<void> => {
    try {
      const fetchedData = await executeFetchReceipts();
      if (fetchedData) {
        setReceipts(fetchedData);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch receipts');
    }
  };

  const deleteReceipt = async (receiptId: string): Promise<void> => {
    try {
      await executeDeleteReceipt(receiptId);
      setReceipts(receipts.filter(receipt => receipt.id !== receiptId));
      Alert.alert('Success', 'Receipt deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete receipt');
    }
  };

  const searchReceipts = async (query: string): Promise<void> => {
    try {
      const results = await executeSearchReceipts(query);
      if (results) {
        setReceipts(results);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to search receipts');
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
      setCustomerName,
      addItemToReceipt,
      removeItemFromReceipt,
      updateReceiptItemQuantity,
      calculateTotal,
      calculateTax,
      handleSubmitReceipt,
      clearReceipt,
      fetchReceipts,
      deleteReceipt,
      searchReceipts
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