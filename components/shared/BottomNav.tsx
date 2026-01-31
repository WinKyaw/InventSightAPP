import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { HamburgerMenu } from './HamburgerMenu';

/**
 * Bottom Navigation Component
 * Provides navigation bar for standalone screens outside of tabs
 */
export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'analytics',
      route: '/(tabs)/dashboard',
    },
    {
      key: 'items',
      label: 'Items',
      icon: 'cube',
      route: '/(tabs)/items',
    },
    {
      key: 'transfers',
      label: 'Transfers',
      icon: 'swap-horizontal',
      route: '/transfer-requests',
    },
    {
      key: 'receipt',
      label: 'Receipt',
      icon: 'receipt',
      route: '/(tabs)/receipt',
    },
    {
      key: 'menu',
      label: 'More',
      icon: 'menu',
      route: null, // Opens hamburger menu
    },
  ];

  const handleNavPress = (item: typeof navItems[0]) => {
    if (item.key === 'menu') {
      setShowMenu(true);
    } else if (item.route) {
      router.push(item.route);
    }
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.route) {
      return pathname === item.route || pathname.startsWith(item.route);
    }
    return false;
  };

  return (
    <>
      <View style={styles.container}>
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              onPress={() => handleNavPress(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={active ? Colors.primary : Colors.gray}
              />
              <Text
                style={[
                  styles.navLabel,
                  active && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <HamburgerMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 2,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
