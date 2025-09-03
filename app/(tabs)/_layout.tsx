import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useNavigation } from '../../context/NavigationContext';
import { HamburgerMenu } from '../../components/shared/HamburgerMenu';

export default function TabsLayout() {
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  
  // Add error handling for navigation context
  let navigationData;
  try {
    navigationData = useNavigation();
  } catch (error) {
    console.error('Error accessing Navigation context:', error);
    // Provide fallback values
    navigationData = {
      selectedNavItems: [
        { key: 'receipt', title: 'Receipt', icon: 'receipt', screen: '/(tabs)/receipt', color: '#F59E0B' },
        { key: 'employees', title: 'Team', icon: 'people', screen: '/(tabs)/employees', color: '#8B5CF6' }
      ]
    };
  }

  const { selectedNavItems } = navigationData;

  return (
    <>
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
          name={selectedNavItems?.[0]?.key || 'receipt'}
          options={{
            title: selectedNavItems?.[0]?.title || 'Receipt',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name={(selectedNavItems?.[0]?.icon || 'receipt') as any} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />

        {/* Dynamic Tab 4: User's Pick 2 */}
        <Tabs.Screen
          name={selectedNavItems?.[1]?.key || 'employees'}
          options={{
            title: selectedNavItems?.[1]?.title || 'Team',
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name={(selectedNavItems?.[1]?.icon || 'people') as any} 
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