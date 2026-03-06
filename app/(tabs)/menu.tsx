import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { NavigationSettingsModal } from '../../components/modals/NavigationSettingsModal';
import { ProfileModal } from '../../components/shared/ProfileModal';
import { Header } from '../../components/shared/Header';

export default function MenuScreen() {
  const { user } = useAuth();
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />
      <Header title="Menu" backgroundColor="#10B981" showProfileButton={false} />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* User Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={() => setShowProfile(true)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Text style={styles.userStatus}>Active User</Text>
          </View>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>

        {/* Navigation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NAVIGATION</Text>
            <TouchableOpacity 
              style={styles.customizeButton}
              onPress={() => setShowCustomizeModal(true)}
            >
              <Text style={styles.customizeButtonText}>⚙️ Customize</Text>
            </TouchableOpacity>
          </View>

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

        <View style={styles.bottomPadding} />
      </ScrollView>

      <NavigationSettingsModal
        visible={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
      />

      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  profileInfo: {
    flex: 1,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 56,
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
    height: 50,
  },
});