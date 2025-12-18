import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { navigationService, NavigationPreferences } from '../services/api/navigationService';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated } = useAuth();
  
  // ✅ All possible navigation options (no role filtering - trust backend)
  const allOptions: NavigationOption[] = [
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
      color: '#EC4899'
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
  
  // ✅ Map API tab keys to NavigationOption objects with normalization
  // Handle both 'employees' and 'team' keys from the backend
  const mapTabKeysToOptions = useCallback((tabKeys: string[]): NavigationOption[] => {
    return tabKeys
      .map(key => {
        // Normalize 'team' to 'employees' for consistency
        const normalizedKey = key === 'team' ? 'employees' : key;
        return allOptions.find(opt => opt.key === normalizedKey);
      })
      .filter((opt): opt is NavigationOption => opt !== undefined);
  }, []);

  // ✅ Safe initial state - will be updated when preferences load
  const [selectedNavItems, setSelectedNavItems] = useState<NavigationOption[]>(() => {
    // Initial safe defaults (items, receipt, calendar)
    return allOptions.filter(o => ['items', 'receipt', 'calendar'].includes(o.key));
  });

  const [showNavigationSettings, setShowNavigationSettings] = useState(false);
  const [preferences, setPreferences] = useState<NavigationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableOptions, setAvailableOptions] = useState<NavigationOption[]>([]);

  const loadPreferences = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const prefs = await navigationService.getNavigationPreferences(forceRefresh);
      setPreferences(prefs);
      
      console.log('📱 Navigation preferences loaded:');
      console.log('  - Preferred tabs:', prefs.preferredTabs);
      console.log('  - Available tabs:', prefs.availableTabs);
      
      // ✅ CRITICAL FIX: Trust backend authorization - no client-side filtering
      // Map preferredTabs from API to NavigationOption objects
      const mappedPreferred = mapTabKeysToOptions(prefs.preferredTabs);
      const mappedAvailable = mapTabKeysToOptions(prefs.availableTabs);
      
      console.log('  - Mapped preferred options:', mappedPreferred.map((o: NavigationOption) => o.key));
      console.log('  - Mapped available options:', mappedAvailable.map((o: NavigationOption) => o.key));
      
      // ✅ Set available options from backend response - NO filtering
      setAvailableOptions(mappedAvailable);
      
      // Use backend-provided preferred tabs (up to 3 items)
      if (mappedPreferred.length >= 3) {
        setSelectedNavItems(mappedPreferred.slice(0, 3));
        console.log('✅ Navigation preferences loaded:', mappedPreferred.slice(0, 3).map((o: NavigationOption) => o.key));
      } else if (mappedPreferred.length > 0) {
        // If we have some options but not exactly 3, fill with available options
        const needed = 3 - mappedPreferred.length;
        const additionalOptions = mappedAvailable
          .filter((opt: NavigationOption) => !mappedPreferred.find((fo: NavigationOption) => fo.key === opt.key))
          .slice(0, needed);
        const finalOptions = [...mappedPreferred, ...additionalOptions].slice(0, 3);
        setSelectedNavItems(finalOptions);
        console.log('⚠️ Navigation preferences loaded with adjustment:', finalOptions.map((o: NavigationOption) => o.key));
      } else {
        // Fallback to first 3 available options
        const fallbackOptions = mappedAvailable.slice(0, 3);
        if (fallbackOptions.length > 0) {
          setSelectedNavItems(fallbackOptions);
          console.log('⚠️ Using available tabs as fallback:', fallbackOptions.map((o: NavigationOption) => o.key));
        } else {
          // Ultimate fallback
          const safeDefaults = allOptions.filter(o => ['items', 'receipt', 'calendar'].includes(o.key));
          setSelectedNavItems(safeDefaults);
          console.log('⚠️ Using safe default navigation preferences');
        }
      }
    } catch (error: any) {
      // ✅ Don't throw - just use defaults
      console.log('ℹ️ Using default navigation preferences due to error');
      const safeDefaults = allOptions.filter(o => ['items', 'receipt', 'calendar'].includes(o.key));
      setAvailableOptions(allOptions);
      setSelectedNavItems(safeDefaults);
    } finally {
      setLoading(false);
    }
  }, [mapTabKeysToOptions]);

  // Initialize selectedNavItems when component mounts
  useEffect(() => {
    if (allOptions.length > 0) {
      const safeDefaults = allOptions.filter(o => ['items', 'receipt', 'calendar'].includes(o.key));
      setSelectedNavItems(safeDefaults);
    }
  }, []); // Run once on mount

  useEffect(() => {
    // ✅ Only load preferences if user is authenticated
    if (isAuthenticated) {
      console.log('📱 User authenticated, loading navigation preferences');
      loadPreferences();
    } else {
      console.log('ℹ️ User not authenticated, skipping navigation preferences');
      setPreferences(null);
      setLoading(false);
    }
  }, [isAuthenticated, loadPreferences]);

  const refreshPreferences = useCallback(async () => {
    await loadPreferences(true);
  }, [loadPreferences]);

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
        key: 'calendar',
        title: 'Calendar',
        icon: 'calendar',
        screen: '/(tabs)/calendar',
        color: '#EC4899'
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