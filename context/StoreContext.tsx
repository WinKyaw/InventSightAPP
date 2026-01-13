import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Store {
  id: string;
  name: string;
  storeName?: string;
  companyId: string;
}

interface StoreContextType {
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  isStoreReady: boolean;
}

const StoreContext = createContext<StoreContextType>({
  currentStore: null,
  setCurrentStore: () => {},
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

  return (
    <StoreContext.Provider value={{ currentStore, setCurrentStore, isStoreReady }}>
      {children}
    </StoreContext.Provider>
  );
};
