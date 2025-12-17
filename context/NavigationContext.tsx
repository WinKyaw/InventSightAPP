import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { navigationService, NavigationPreferences } from '../services/api/navigationService';
import { useAuth } from './AuthContext';
import { canManageEmployees } from '../utils/permissions';

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
  const { isAuthenticated, user } = useAuth();
  
  // ✅ FIX: Check if user is GM+ (can manage employees/team)
  const canAccessTeam = canManageEmployees(user?.role);
  
  // ✅ FIX: Filter available options based on user permissions
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
  
  // ✅ FIX: Filter out Team option for non-GM users
  const availableOptions: NavigationOption[] = allOptions.filter(option => {
    if (option.key === 'employees') {
      return canAccessTeam;
    }
    return true;
  });

  // ✅ FIX: Default to first available options, excluding Team for non-GM users
  const getDefaultNavItems = (): NavigationOption[] => {
    // For GM+ users: Items, Receipt, Team
    // For non-GM users: Items, Receipt, Calendar
    if (canAccessTeam && availableOptions.length >= 3) {
      return [
        availableOptions.find(o => o.key === 'items')!,
        availableOptions.find(o => o.key === 'receipt')!,
        availableOptions.find(o => o.key === 'employees')!
      ].filter(Boolean);
    }
    // Non-GM users get first 3 available options (which won't include Team)
    return availableOptions.slice(0, 3);
  };

  const [selectedNavItems, setSelectedNavItems] = useState<NavigationOption[]>(getDefaultNavItems());

  const [showNavigationSettings, setShowNavigationSettings] = useState(false);
  const [preferences, setPreferences] = useState<NavigationPreferences | null>(null);
  const [loading, setLoading] = useState(false);

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
      
      // ✅ FIX: Filter out Team option if user doesn't have permission
      const filteredOptions = mappedOptions.filter(option => {
        if (option.key === 'employees') {
          return canAccessTeam;
        }
        return true;
      });
      
      // Validate we have exactly 3 tabs, or use defaults
      if (filteredOptions.length === 3) {
        setSelectedNavItems(filteredOptions);
        console.log('✅ Navigation preferences loaded:', filteredOptions.map(o => o.key));
      } else if (filteredOptions.length > 0) {
        // If we have some options but not exactly 3, fill with available options
        const needed = 3 - filteredOptions.length;
        const additionalOptions = availableOptions
          .filter(opt => !filteredOptions.find(fo => fo.key === opt.key))
          .slice(0, needed);
        const finalOptions = [...filteredOptions, ...additionalOptions].slice(0, 3);
        setSelectedNavItems(finalOptions);
        console.log('⚠️ Navigation preferences loaded with adjustment:', finalOptions.map(o => o.key));
      } else {
        console.log('⚠️ No valid navigation options mapped, using defaults');
        setSelectedNavItems(getDefaultNavItems());
      }
    } catch (error: any) {
      // ✅ Don't throw - just use defaults
      console.log('ℹ️ Using default navigation preferences');
      setSelectedNavItems(getDefaultNavItems());
    } finally {
      setLoading(false);
    }
  };

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
  }, [isAuthenticated]);

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
    // ✅ FIX: Don't include Team in default options (for safety)
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