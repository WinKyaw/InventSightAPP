import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

// Fallback navigation items
const FALLBACK_NAV_ITEMS = [
  { key: 'receipt', title: 'Receipt', icon: 'receipt', screen: '/(tabs)/receipt', color: '#F59E0B' },
  { key: 'employees', title: 'Team', icon: 'people', screen: '/(tabs)/employees', color: '#8B5CF6' }
];

export default function TabsLayout() {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();
  const router = useRouter();
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedNavItems, setSelectedNavItems] = useState(FALLBACK_NAV_ITEMS);

  // ✅ SECURITY FIX: Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      console.log('🔐 TabsLayout: User not authenticated, redirecting to login');
      router.replace('/(auth)/login');
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

  // ✅ Update selected items when navigation context changes
  useEffect(() => {
    if (navContext && Array.isArray(navContext.selectedNavItems)) {
      setSelectedNavItems(navContext.selectedNavItems);
    }
    setIsReady(true);
  }, [navContext]);

  // ✅ SECURITY FIX: Show loading while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: Colors.gray }}>Verifying authentication...</Text>
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
        <Text style={{ marginTop: 10, color: Colors.gray }}>Loading...</Text>
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
        {/* Fixed Tab 1: Dashboard */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="analytics" size={size} color={color} />
            ),
          }}
        />

        {/* Fixed Tab 2: Items */}
        <Tabs.Screen
          name="items"
          options={{
            title: 'Items',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube" size={size} color={color} />
            ),
          }}
        />

        {/* Dynamic Tab 3: User's Pick 1 */}
        <Tabs.Screen
          name={selectedNavItems[0]?.key || 'receipt'}
          options={{
            title: selectedNavItems[0]?.title || 'Receipt',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name={(selectedNavItems[0]?.icon || 'receipt') as any} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />

        {/* Dynamic Tab 4: User's Pick 2 */}
        <Tabs.Screen
          name={selectedNavItems[1]?.key || 'employees'}
          options={{
            title: selectedNavItems[1]?.title || 'Team',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name={(selectedNavItems[1]?.icon || 'people') as any} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />

        {/* Fixed Tab 5: Menu */}
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
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
                  Menu
                </Text>
              </TouchableOpacity>
            ),
          }}
        />

        {/* Hidden screens accessible via menu */}
        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="reports" options={{ href: null }} />
        <Tabs.Screen name="setting" options={{ href: null }} />
      </Tabs>

      <HamburgerMenu
        visible={showHamburgerMenu}
        onClose={() => setShowHamburgerMenu(false)}
      />
    </>
  );
}