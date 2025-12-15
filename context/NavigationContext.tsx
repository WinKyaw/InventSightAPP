import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { navigationService, NavigationPreferences } from '../services/api/navigationService';

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
  updateNavigationPreferences: (item1: NavigationOption, item2: NavigationOption, item3?: NavigationOption) => Promise<void>;
  showNavigationSettings: boolean;
  setShowNavigationSettings: (show: boolean) => void;
  preferences: NavigationPreferences | null;
  loading: boolean;
  refreshPreferences: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const availableOptions: NavigationOption[] = [
    {
      key: 'items',
      title: 'Items',
      icon: 'cube',
      screen: '/(tabs)/items',
      color: '#10B981'
    },
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
      key: 'warehouse',
      title: 'Warehouse',
      icon: 'cube',
      screen: '/(tabs)/warehouse',
      color: '#6366F1'
    },
    {
      key: 'setting',
      title: 'Settings',
      icon: 'settings',
      screen: '/(tabs)/setting',
      color: '#6B7280'
    }
  ];

  // Default to first 3 options (items, receipt, employees)
  const [selectedNavItems, setSelectedNavItems] = useState<NavigationOption[]>([
    availableOptions[0], // Items
    availableOptions[1], // Receipt
    availableOptions[2]  // Team
  ]);

  const [showNavigationSettings, setShowNavigationSettings] = useState(false);
  const [preferences, setPreferences] = useState<NavigationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Map API tab keys to NavigationOption objects
  const mapTabKeysToOptions = (tabKeys: string[]): NavigationOption[] => {
    return tabKeys
      .map(key => availableOptions.find(opt => opt.key === key))
      .filter((opt): opt is NavigationOption => opt !== undefined);
  };

  const loadPreferences = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const prefs = await navigationService.getNavigationPreferences(forceRefresh);
      setPreferences(prefs);
      
      // Map preferredTabs from API to NavigationOption objects
      const mappedOptions = mapTabKeysToOptions(prefs.preferredTabs);
      
      // Only update if we have valid mapped options
      if (mappedOptions.length > 0) {
        setSelectedNavItems(mappedOptions);
        console.log('✅ Navigation preferences loaded:', mappedOptions.map(o => o.key));
      }
    } catch (error) {
      console.error('Failed to load navigation preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const refreshPreferences = async () => {
    await loadPreferences(true);
  };

  const updateNavigationPreferences = async (item1: NavigationOption, item2: NavigationOption, item3?: NavigationOption) => {
    try {
      const newItems = item3 ? [item1, item2, item3] : [item1, item2];
      const tabKeys = newItems.map(item => item.key);
      
      // Update API
      await navigationService.updateNavigationPreferences(tabKeys);
      
      // Update local state
      setSelectedNavItems(newItems);
      
      // Refresh from API to ensure sync
      await refreshPreferences();
    } catch (error) {
      console.error('Failed to update navigation preferences:', error);
      throw error;
    }
  };

  // Ensure the context value is always properly constructed
  const contextValue: NavigationContextType = {
    availableOptions,
    selectedNavItems: selectedNavItems || [],
    updateNavigationPreferences,
    showNavigationSettings: showNavigationSettings || false,
    setShowNavigationSettings,
    preferences,
    loading,
    refreshPreferences
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    console.error('useNavigation must be used within a NavigationProvider');
    // Return a more complete default context to prevent crashes
    const defaultOptions: NavigationOption[] = [
      {
        key: 'items',
        title: 'Items',
        icon: 'cube',
        screen: '/(tabs)/items',
        color: '#10B981'
      },
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
      }
    ];
    
    return {
      availableOptions: defaultOptions,
      selectedNavItems: defaultOptions,
      updateNavigationPreferences: async () => {
        console.warn('NavigationContext not available - updateNavigationPreferences called');
      },
      showNavigationSettings: false,
      setShowNavigationSettings: () => {
        console.warn('NavigationContext not available - setShowNavigationSettings called');
      },
      preferences: null,
      loading: false,
      refreshPreferences: async () => {
        console.warn('NavigationContext not available - refreshPreferences called');
      }
    };
  }
  return context;
}