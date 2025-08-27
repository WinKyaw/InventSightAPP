import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationOption {
  key: string;
  title: string;
  icon: string;
  screen: string;
  color: string;
}

interface NavigationContextType {
  availableOptions: NavigationOption[];
  selectedNavItems: NavigationOption[];
  updateNavigationPreferences: (item1: NavigationOption, item2: NavigationOption) => void;
  showNavigationSettings: boolean;
  setShowNavigationSettings: (show: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const availableOptions: NavigationOption[] = [
    {
      key: 'receipt',
      title: 'Receipt',
      icon: 'receipt',
      screen: '/(tabs)/receipt',
      color: '#F59E0B'
    },
    {
      key: 'employees',
      title: 'Team',
      icon: 'people',
      screen: '/(tabs)/employees',
      color: '#8B5CF6'
    },
    {
      key: 'calendar',
      title: 'Calendar',
      icon: 'calendar',
      screen: '/(tabs)/calendar',
      color: '#F59E0B'
    },
    {
      key: 'reports',
      title: 'Reports',
      icon: 'bar-chart',
      screen: '/(tabs)/reports',
      color: '#10B981'
    },
    {
      key: 'setting',
      title: 'Settings',
      icon: 'settings',
      screen: '/(tabs)/setting',
      color: '#6B7280'
    }
  ];

  const [selectedNavItems, setSelectedNavItems] = useState<NavigationOption[]>([
    availableOptions[0], // Receipt
    availableOptions[1]  // Team
  ]);

  const [showNavigationSettings, setShowNavigationSettings] = useState(false);

  const updateNavigationPreferences = (item1: NavigationOption, item2: NavigationOption) => {
    setSelectedNavItems([item1, item2]);
  };

  return (
    <NavigationContext.Provider value={{
      availableOptions,
      selectedNavItems,
      updateNavigationPreferences,
      showNavigationSettings,
      setShowNavigationSettings
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}