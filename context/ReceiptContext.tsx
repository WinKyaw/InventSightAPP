import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useItems } from './ItemsContext';
import { Receipt, ReceiptItem, Item } from '../types';

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
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export function ReceiptProvider({ children }: { children: ReactNode }) {
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const { items, setItems } = useItems();

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

  const handleSubmitReceipt = () => {
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

    const receipt: Receipt = {
      id: Date.now(),
      receiptNumber: generateReceiptNumber(),
      customerName: customerName || 'Walk-in Customer',
      items: [...receiptItems],
      subtotal,
      tax,
      total,
      dateTime: '2025-08-25 01:34:29',
      status: 'completed'
    };

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

    setReceipts([receipt, ...receipts]);
    clearReceipt();

    Alert.alert('Success', 'Transaction completed successfully!');
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
      setCustomerName,
      addItemToReceipt,
      removeItemFromReceipt,
      updateReceiptItemQuantity,
      calculateTotal,
      calculateTax,
      handleSubmitReceipt,
      clearReceipt
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