import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { HamburgerMenu } from '../../components/shared/HamburgerMenu';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import { SyncStatus } from '../../components/SyncStatus';
import { useAuth } from '../../context/AuthContext';

// Import with error boundary
let useNavigation: any = null;
try {
  const NavigationModule = require('../../context/NavigationContext');
  useNavigation = NavigationModule.useNavigation;
} catch (error) {
  console.error('Failed to import NavigationContext:', error);
}

// Fallback navigation items (3 tabs for middle section)
const FALLBACK_NAV_ITEMS = [
  { key: 'items', title: 'Items', icon: 'cube', screen: '/(tabs)/items', color: '#10B981' },
  { key: 'receipt', title: 'Receipt', icon: 'receipt', screen: '/(tabs)/receipt', color: '#F59E0B' },
  { key: 'calendar', title: 'Calendar', icon: 'calendar', screen: '/(tabs)/calendar', color: '#F59E0B' }
];

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const router = useRouter();
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedNavItems, setSelectedNavItems] = useState(FALLBACK_NAV_ITEMS);

  // All possible tab screens that can be hidden
  const allTabScreens = ['items', 'receipt', 'employees', 'calendar', 'reports', 'warehouse', 'setting', 'item-setup', 'customers'];
  
  // Get keys of currently selected tabs to avoid duplicates
  const selectedTabKeys = selectedNavItems.map(item => item.key);
  
  // Filter screens to hide only those not in selectedNavItems
  const screensToHide = allTabScreens.filter(screen => !selectedTabKeys.includes(screen));

  // ✅ Auth guard: Redirect to login if not authenticated
  // This protects the tabs from unauthorized access
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      console.log('🔐 TabsLayout: User not authenticated, redirecting to login');
      // Increase delay from 50ms to 200ms to ensure AuthContext updates
      // This prevents race conditions where we redirect before auth state updates
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isInitialized, isLoading, router]);

  // ✅ SOLUTION 1: Call hook at component top level with error handling
  let navContext = null;
  try {
    navContext = useNavigation ? useNavigation() : null;
  } catch (error) {
    console.warn('Failed to get navigation context:', error);
    navContext = null;
  }

  // ✅ Update selected items when navigation context changes or when loading completes
  useEffect(() => {
    if (navContext && !navContext.loading && Array.isArray(navContext.selectedNavItems) && navContext.selectedNavItems.length > 0) {
      setSelectedNavItems(navContext.selectedNavItems);
    }
    setIsReady(true);
  }, [navContext, navContext?.loading]);

  // ✅ SECURITY FIX: Show loading while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.gray }}>{t('dashboard.verifyingAuth')}</Text>
      </View>
    );
  }
  
  // ✅ SECURITY FIX: If not authenticated after initialization, don't render tabs
  if (!isAuthenticated) {
    return null; // Router will handle redirect
  }

  // Show loading state while initializing navigation
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.gray }}>{t('dashboard.loading')}</Text>
      </View>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <SyncStatus />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.gray,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            height: 80,
            paddingVertical: 8,
          },
          tabBarLabelStyle: {
            fontSize: 9,
            marginTop: 2,
          },
        }}
      >
        {/* Fixed Tab 1: Dashboard (far left) */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: t('tabs.dashboard'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="analytics" size={size} color={color} />
            ),
          }}
        />

        {/* Dynamic Tab 2: User's Pick 1 (from API) */}
        <Tabs.Screen
          name={selectedNavItems[0]?.key || 'items'}
          options={{
            title: selectedNavItems[0]?.title || 'Items',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name={(selectedNavItems[0]?.icon || 'cube') as any} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />

        {/* Dynamic Tab 3: User's Pick 2 (from API) */}
        <Tabs.Screen
          name={selectedNavItems[1]?.key || 'receipt'}
          options={{
            title: selectedNavItems[1]?.title || 'Receipt',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name={(selectedNavItems[1]?.icon || 'receipt') as any} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />

        {/* Dynamic Tab 4: User's Pick 3 (from API) */}
        <Tabs.Screen
          name={selectedNavItems[2]?.key || 'calendar'}
          options={{
            title: selectedNavItems[2]?.title || 'Calendar',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name={(selectedNavItems[2]?.icon || 'calendar') as any} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />

        {/* Fixed Tab 5: Menu (far right) */}
        <Tabs.Screen
          name="menu"
          options={{
            title: t('tabs.menu'),
            tabBarButton: (props) => (
              <TouchableOpacity
                onPress={() => setShowHamburgerMenu(true)}
                style={[
                  props.style, 
                  { 
                    flex: 1, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    paddingVertical: 4 
                  }
                ]}
              >
                <Ionicons name="menu" size={20} color={Colors.gray} />
                <Text style={{ fontSize: 9, marginTop: 2, color: Colors.gray }}>
                  {t('tabs.menu')}
                </Text>
              </TouchableOpacity>
            ),
          }}
        />

        {/* Hidden screens accessible via menu or when not in preferredTabs */}
        {/* Only hide screens that are NOT currently visible in the dynamic tabs */}
        {screensToHide.map(screenName => (
          <Tabs.Screen 
            key={screenName} 
            name={screenName} 
            options={{ href: null }} 
          />
        ))}
      </Tabs>

      <HamburgerMenu
        visible={showHamburgerMenu}
        onClose={() => setShowHamburgerMenu(false)}
      />
    </>
  );
}