import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Item } from '../types';
import { initialItems } from '../constants/Data';
import { useAuthenticatedAPI, useApiReadiness } from '../hooks';

interface ItemsContextType {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  addItem: (item: Omit<Item, 'id' | 'salesCount' | 'expanded'>) => void;
  updateItem: (id: number, updates: Partial<Item>) => void;
  deleteItem: (id: number) => void;
  calculateDynamicSalesData: () => any;
  // New API integration properties
  useApiIntegration: boolean;
  setUseApiIntegration: (use: boolean) => void;
  loading: boolean;
  error: string | null;
  refreshItems: () => Promise<void>;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [useApiIntegration, setUseApiIntegration] = useState<boolean>(false);

  // Authentication readiness check
  const { canMakeApiCalls } = useApiReadiness();

  // Optional API integration for items - similar to other contexts
  // This could be connected to a different service in the future
  const {
    data: apiItems,
    loading,
    error,
    execute: fetchItems,
  } = useAuthenticatedAPI(
    async () => {
      // Placeholder for potential future API integration
      // For now, return the local data structure to maintain compatibility
      return initialItems;
    },
    { immediate: false }
  );

  // Effect to sync API data with local state when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && apiItems && Array.isArray(apiItems)) {
      setItems(apiItems);
    } else if (!useApiIntegration) {
      setItems(initialItems);
    }
  }, [useApiIntegration, apiItems]);

  // Auto-fetch items when API integration is enabled
  useEffect(() => {
    if (useApiIntegration && canMakeApiCalls) {
      fetchItems();
    }
  }, [useApiIntegration, canMakeApiCalls]);

  const addItem = useCallback((newItem: Omit<Item, 'id' | 'salesCount' | 'expanded'>) => {
    const item: Item = {
      ...newItem,
      id: Date.now(),
      salesCount: 0,
      expanded: false,
      total: newItem.price * newItem.quantity,
    };
    setItems(prev => [...prev, item]);
  }, []);

  const updateItem = useCallback((id: number, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const deleteItem = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const calculateDynamicSalesData = useCallback(() => {
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
  }, [items]);

  const refreshItems = useCallback(async (): Promise<void> => {
    if (useApiIntegration && canMakeApiCalls) {
      await fetchItems();
    }
  }, [useApiIntegration, canMakeApiCalls, fetchItems]);

  return (
    <ItemsContext.Provider value={{
      items,
      setItems,
      addItem,
      updateItem,
      deleteItem,
      calculateDynamicSalesData,
      useApiIntegration,
      setUseApiIntegration,
      loading: loading || false,
      error: error || null,
      refreshItems,
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