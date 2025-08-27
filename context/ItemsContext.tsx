import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Item } from '../types';
import { initialItems } from '../constants/Data';

interface ItemsContextType {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  addItem: (item: Omit<Item, 'id' | 'salesCount' | 'expanded'>) => void;
  updateItem: (id: number, updates: Partial<Item>) => void;
  deleteItem: (id: number) => void;
  calculateDynamicSalesData: () => any;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(initialItems);

  const addItem = (newItem: Omit<Item, 'id' | 'salesCount' | 'expanded'>) => {
    const item: Item = {
      ...newItem,
      id: Date.now(),
      salesCount: 0,
      expanded: false,
      total: newItem.price * newItem.quantity,
    };
    setItems(prev => [...prev, item]);
  };

  const updateItem = (id: number, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateDynamicSalesData = () => {
    const totalSalesCount = items.reduce((sum, item) => sum + item.salesCount, 0);
    const totalRevenue = items.reduce((sum, item) => sum + (item.price * item.salesCount), 0);
    
    const sortedItems = [...items].sort((a, b) => b.salesCount - a.salesCount);
    const topItems = sortedItems.slice(0, 4).map(item => ({
      name: item.name,
      sales: Math.floor(item.price * item.salesCount),
      quantity: item.salesCount,
      trend: Math.random() * 20 - 5
    }));

    return {
      monthly: {
        current: Math.floor(totalRevenue * 0.8),
        previous: Math.floor(totalRevenue * 0.7),
        target: Math.floor(totalRevenue)
      },
      topItems,
      kpis: {
        totalRevenue: Math.floor(totalRevenue * 0.8),
        totalOrders: Math.floor(totalSalesCount * 0.3),
        avgOrderValue: totalRevenue > 0 ? (totalRevenue * 0.8) / (totalSalesCount * 0.3) : 0,
      }
    };
  };

  return (
    <ItemsContext.Provider value={{
      items,
      setItems,
      addItem,
      updateItem,
      deleteItem,
      calculateDynamicSalesData
    }}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (context === undefined) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
}