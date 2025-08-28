import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../context/ProfileContext';
import { Header } from '../../components/shared/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/Colors';
import { styles as globalStyles } from '../../constants/Styles';

export default function MenuScreen() {
  const { 
    profile, 
    loading, 
    error, 
    updateProfile, 
    changePassword, 
    updateSettings,
    refreshProfile,
    getUserStats,
    logout 
  } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
  });
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showSettings, setShowSettings] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  // Update edited profile when profile changes
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone || '',
        department: profile.department || '',
      });
    }
  }, [profile]);

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getUserStats();
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to load user stats:', error);
      }
    };
    loadStats();
  }, [getUserStats]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await changePassword(passwordData);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation would be handled by auth context/router
            } catch (error) {
              // Error is handled in context
            }
          }
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => setIsEditing(true),
    },
    {
      icon: 'key-outline',
      title: 'Change Password',
      subtitle: 'Update your account password',
      onPress: () => setShowChangePassword(true),
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'App preferences and notifications',
      onPress: () => setShowSettings(true),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Help', 'Contact support at support@inventsight.com'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => Alert.alert('About', 'InventSight v1.0.0'),
    },
    {
      icon: 'log-out-outline',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#6B7280" barStyle="light-content" />
        <Header 
          title="Profile"
          backgroundColor="#6B7280"
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#6B7280" barStyle="light-content" />
        <Header 
          title="Profile"
          backgroundColor="#6B7280"
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <Button
            title="Retry"
            onPress={refreshProfile}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#6B7280" barStyle="light-content" />
        <Header 
          title="Edit Profile"
          backgroundColor="#6B7280"
        />
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <Input
              value={editedProfile.firstName}
              onChangeText={(value) => setEditedProfile(prev => ({ ...prev, firstName: value }))}
              placeholder="Enter first name"
            />
            <Text style={styles.fieldLabel}>Last Name</Text>
            <Input
              value={editedProfile.lastName}
              onChangeText={(value) => setEditedProfile(prev => ({ ...prev, lastName: value }))}
              placeholder="Enter last name"
            />
            <Text style={styles.fieldLabel}>Phone</Text>
            <Input
              value={editedProfile.phone}
              onChangeText={(value) => setEditedProfile(prev => ({ ...prev, phone: value }))}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            <Text style={styles.fieldLabel}>Department</Text>
            <Input
              value={editedProfile.department}
              onChangeText={(value) => setEditedProfile(prev => ({ ...prev, department: value }))}
              placeholder="Enter department"
            />
            <View style={styles.buttonContainer}>
              <Button
                title="Save Changes"
                onPress={handleSaveProfile}
                style={styles.saveButton}
              />
              <Button
                title="Cancel"
                onPress={() => setIsEditing(false)}
                style={styles.cancelButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showChangePassword) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#6B7280" barStyle="light-content" />
        <Header 
          title="Change Password"
          backgroundColor="#6B7280"
        />
        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <Text style={styles.fieldLabel}>Current Password</Text>
            <Input
              value={passwordData.currentPassword}
              onChangeText={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
              placeholder="Enter current password"
              secureTextEntry
            />
            <Text style={styles.fieldLabel}>New Password</Text>
            <Input
              value={passwordData.newPassword}
              onChangeText={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
              placeholder="Enter new password"
              secureTextEntry
            />
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <Input
              value={passwordData.confirmPassword}
              onChangeText={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
              placeholder="Confirm new password"
              secureTextEntry
            />
            <View style={styles.buttonContainer}>
              <Button
                title="Change Password"
                onPress={handleChangePassword}
                style={styles.saveButton}
              />
              <Button
                title="Cancel"
                onPress={() => setShowChangePassword(false)}
                style={styles.cancelButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6B7280" barStyle="light-content" />
      
      <Header 
        title="Profile & Settings"
        backgroundColor="#6B7280"
        rightComponent={
          <TouchableOpacity onPress={refreshProfile}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color={Colors.textSecondary} />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>
            {profile?.firstName} {profile?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
          <Text style={styles.profileRole}>{profile?.role} • {profile?.department}</Text>
        </View>

        {/* User Stats */}
        {userStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Your Activity</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userStats.totalReceipts}</Text>
                <Text style={styles.statLabel}>Receipts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${userStats.totalRevenue.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${userStats.averageOrderValue.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Avg Order</Text>
              </View>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                item.isDestructive && styles.menuItemDestructive
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={item.isDestructive ? Colors.danger : Colors.primary} 
                />
                <View style={styles.menuItemText}>
                  <Text style={[
                    styles.menuItemTitle,
                    item.isDestructive && styles.menuItemTitleDestructive
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.lightGray,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  menuItemDestructive: {
    // Add specific styling for destructive items if needed
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  menuItemTitleDestructive: {
    color: Colors.danger,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    borderColor: Colors.textSecondary,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
});