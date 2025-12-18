import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function MenuScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      {/* User Profile Header - Fixed at top */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Text style={styles.userStatus}>Active User</Text>
          </View>
        </View>
      </View>

      {/* ✅ CRITICAL FIX: Wrap navigation items in ScrollView */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* System Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SYSTEM INFORMATION</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Current DateTime (UTC)</Text>
            <Text style={styles.infoValue}>
              {new Date().toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Current User</Text>
            <Text style={styles.infoValue}>{user?.name || 'User'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Navigation Bar</Text>
            <Text style={styles.infoValue}>Dashboard | Items | Receipt | Menu</Text>
          </View>
        </View>

        {/* Navigation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NAVIGATION</Text>
            <TouchableOpacity style={styles.customizeButton}>
              <Text style={styles.customizeButtonText}>⚙️ Customize</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Items */}
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📊</Text>
            <Text style={styles.navLabel}>Sales Dashboard</Text>
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>In Nav</Text>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={styles.navLabel}>Inventory Items</Text>
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>In Nav</Text>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={styles.navLabel}>Items</Text>
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>In Nav</Text>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🧾</Text>
            <Text style={styles.navLabel}>Receipt</Text>
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>In Nav</Text>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📅</Text>
            <Text style={styles.navLabel}>Calendar</Text>
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>In Nav</Text>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>📈</Text>
            <Text style={styles.navLabel}>Reports</Text>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>🏭</Text>
            <Text style={styles.navLabel}>Warehouse</Text>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={styles.navLabel}>Settings</Text>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Add extra padding at bottom for easier scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  // ✅ CRITICAL: ScrollView container must have flex: 1
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32, // Extra padding for comfortable scrolling
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  customizeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
  },
  customizeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  infoItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 56, // Ensure touch target is large enough
  },
  navIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  navLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  navBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  navBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  navArrow: {
    fontSize: 24,
    color: '#CCC',
  },
  bottomPadding: {
    height: 32, // Extra space at bottom for comfortable scrolling
  },
});