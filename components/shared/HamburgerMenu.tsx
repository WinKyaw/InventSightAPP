import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { NavigationSettingsModal } from '../modals/NavigationSettingsModal';
import { Colors } from '../../constants/Colors';
import { navigationService } from '../../services/api/navigationService';
import { canManageSupply } from '../../utils/permissions';

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ visible, onClose }: HamburgerMenuProps) {
  const { user, logout } = useAuth();
  const { availableOptions, selectedNavItems, refreshPreferences } = useNavigation();
  const [showNavSettings, setShowNavSettings] = useState(false);

  const handleSignOut = () => {
    onClose();
    setTimeout(() => {
      logout();
    }, 300);
  };

  const navigateToScreen = (screen: string) => {
    onClose();
    router.push(screen as any);
  };

  const openNavigationSettings = () => {
    setShowNavSettings(true);
  };
  
  const handleRefreshNavigation = async () => {
    try {
      await navigationService.clearCache();
      await refreshPreferences();
      Alert.alert('Success', 'Navigation preferences refreshed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh navigation preferences');
    }
  };

  const getCurrentDateTime = () => {
    return new Date().toLocaleString('en-US', { 
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const fixedMenuItems = [
    {
      icon: 'analytics-outline',
      title: 'Sales Dashboard',
      screen: '/(tabs)/dashboard',
      color: Colors.primary
    },
    {
      icon: 'cube-outline',
      title: 'Inventory Items',
      screen: '/(tabs)/items',
      color: Colors.success
    }
  ];

  const allNavigationItems = [
    ...fixedMenuItems,
    ...availableOptions.map(option => ({
      icon: option.icon + '-outline',
      title: option.title,
      screen: option.screen,
      color: option.color
    }))
  ];

  const appOptions = [
    {
      icon: 'refresh-outline',
      title: 'Refresh Navigation',
      action: handleRefreshNavigation,
      color: Colors.primary
    },
    {
      icon: 'navigate-outline',
      title: 'Customize Navigation',
      action: openNavigationSettings,
      color: Colors.primary
    },
    {
      icon: 'settings-outline',
      title: 'App Settings',
      action: () => {
        onClose();
        navigateToScreen('/(tabs)/setting');
      }
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      action: () => {
        onClose();
      }
    },
    {
      icon: 'information-circle-outline',
      title: 'About POS App',
      action: () => {
        onClose();
      }
    }
  ];

  return (
    <>
      <Modal 
        visible={visible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            onPress={onClose}
            activeOpacity={1}
          />
          <View style={styles.menuContainer}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.header}>
                <Text style={styles.title}>Menu</Text>
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.content} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
                scrollEnabled={true}
                nestedScrollEnabled={true}
              >
                {/* Profile Section */}
                <View style={styles.profileSection}>
                  <View style={styles.profileAvatar}>
                    <Ionicons name="person" size={32} color="white" />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{user?.name || 'WinKyaw'}</Text>
                    <Text style={styles.profileEmail}>{user?.email || 'winkyaw@example.com'}</Text>
                    <Text style={styles.profileStatus}>Active User</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* System Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>SYSTEM INFORMATION</Text>
                  
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={18} color={Colors.primary} />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>Current DateTime (UTC)</Text>
                      <Text style={styles.infoValue}>{getCurrentDateTime()}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="person-circle-outline" size={18} color={Colors.success} />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>Current User</Text>
                      <Text style={styles.infoValue}>WinKyaw</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="navigate-outline" size={18} color={Colors.accent} />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>Navigation Bar</Text>
                      <Text style={styles.infoValue}>
                        Dashboard | Items | {selectedNavItems[0].title} | {selectedNavItems[1].title} | Menu
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Navigation Section */}
                <View style={styles.section}>
                  <View style={styles.navigationHeader}>
                    <Text style={styles.sectionTitle}>NAVIGATION</Text>
                    <TouchableOpacity 
                      style={styles.customizeButton}
                      onPress={openNavigationSettings}
                    >
                      <Ionicons name="settings-outline" size={16} color={Colors.primary} />
                      <Text style={styles.customizeButtonText}>Customize</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {allNavigationItems.map((item, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.menuItem}
                      onPress={() => navigateToScreen(item.screen)}
                    >
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      {(item.title === 'Sales Dashboard' || 
                        item.title === 'Inventory Items' ||
                        selectedNavItems.some(navItem => navItem.title === item.title)) && (
                        <View style={styles.inNavBarIndicator}>
                          <Text style={styles.inNavBarText}>In Nav</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={16} color={Colors.lightGray} />
                    </TouchableOpacity>
                  ))}
                  
                  {/* ✅ New Item Setup - Only in Hamburger Menu (Permission-gated) */}
                  {(() => {
                    // Check if user has GM+ permission
                    const isGMPlus = canManageSupply(user?.role);
                    
                    // Only show to authorized users
                    if (!isGMPlus) {
                      return null;
                    }
                    
                    return (
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigateToScreen('/(tabs)/item-setup')}
                      >
                        <Ionicons name="library-outline" size={20} color="#F59E0B" />
                        <Text style={styles.menuItemText}>New Item Setup</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.lightGray} />
                      </TouchableOpacity>
                    );
                  })()}
                </View>

                <View style={styles.divider} />

                {/* Application Options */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>APPLICATION</Text>
                  
                  {appOptions.map((item, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.menuItem}
                      onPress={item.action}
                    >
                      <Ionicons name={item.icon as any} size={20} color={item.color || Colors.textSecondary} />
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.lightGray} />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Sign Out Button */}
                <TouchableOpacity
                  style={styles.signOutButton}
                  onPress={handleSignOut}
                >
                  <Ionicons name="log-out-outline" size={20} color="white" />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
                
                {/* Bottom padding for safe scrolling */}
                <View style={styles.bottomPadding} />
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      <NavigationSettingsModal
        visible={showNavSettings}
        onClose={() => setShowNavSettings(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '98%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  profileStatus: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 0,
  },
  
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  customizeButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 2,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  inNavBarIndicator: {
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inNavBarText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  
  signOutButton: {
    backgroundColor: Colors.danger,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});