import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserSettingsService } from '../services/api/userSettingsService';

interface Store {
  id: string;
  name: string;
  storeName?: string;
  companyId: string;
}

interface StoreContextType {
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  selectStore: (store: Store) => Promise<void>;
  loadPersistedStore: (availableStores: Store[]) => Promise<void>;
  isStoreReady: boolean;
}

const StoreContext = createContext<StoreContextType>({
  currentStore: null,
  setCurrentStore: () => {},
  selectStore: async () => {},
  loadPersistedStore: async () => {},
  isStoreReady: false,
});

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isStoreReady, setIsStoreReady] = useState(false);

  useEffect(() => {
    console.log('🏪 StoreContext: Current store changed:', currentStore?.name || currentStore?.storeName || 'None');
    setIsStoreReady(!!currentStore);
  }, [currentStore]);

  const selectStore = useCallback(async (store: Store) => {
    setCurrentStore(store);
    await UserSettingsService.saveCurrentStore(store.id);
  }, []);

  const loadPersistedStore = useCallback(async (availableStores: Store[]) => {
    try {
      const settings = await UserSettingsService.getSettings();
      if (settings.currentStoreId) {
        const match = availableStores.find(s => s.id === settings.currentStoreId);
        if (match) {
          console.log('🏪 Restoring persisted store:', match.name || match.storeName);
          setCurrentStore(match);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not restore persisted store', e);
    }
    // Fallback: select first store
    if (availableStores.length > 0) {
      setCurrentStore(availableStores[0]);
    }
  }, []);

  return (
    <StoreContext.Provider value={{ currentStore, setCurrentStore, selectStore, loadPersistedStore, isStoreReady }}>
      {children}
    </StoreContext.Provider>
  );
};
