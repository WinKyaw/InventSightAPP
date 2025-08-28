import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Colors } from '../../constants/Colors';
import { styles as globalStyles } from '../../constants/Styles';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth();
  const { 
    profile, 
    settings, 
    loading, 
    error, 
    fetchUserProfile, 
    updateUserProfile,
    fetchUserSettings,
    updateUserSettings 
  } = useProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || user?.name || 'WinKyaw',
    lastName: profile?.lastName || '',
    email: profile?.email || user?.email || 'winkyaw@example.com',
    phoneNumber: profile?.phoneNumber || '(555) 123-4567',
    department: profile?.department || 'Store Manager',
  });

  // Auto-fetch profile data when modal opens
  useEffect(() => {
    if (visible) {
      fetchUserProfile();
      fetchUserSettings();
    }
  }, [visible]);

  // Update form data when profile data is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber || '(555) 123-4567',
        department: profile.department || 'Store Manager',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
      });
      setIsEditing(false);
    } catch (error) {
      // Error is handled in context
    }
  };
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            onClose();
            setTimeout(() => {
              logout();
            }, 300);
          },
        },
      ]
    );
  };

  const profileStats = [
    {
      label: 'Total Transactions',
      value: '1,247',
      icon: 'receipt-outline',
      color: Colors.primary
    },
    {
      label: 'Revenue Generated',
      value: '$45,678',
      icon: 'trending-up-outline',
      color: Colors.success
    },
    {
      label: 'Items Processed',
      value: '3,456',
      icon: 'cube-outline',
      color: Colors.accent
    },
    {
      label: 'Active Days',
      value: '89',
      icon: 'calendar-outline',
      color: Colors.purple
    }
  ];

  return (
    <Modal visible={visible} onClose={onClose} title="User Profile">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="white" />
            </View>
            <TouchableOpacity style={styles.avatarEditButton}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{formData.name}</Text>
            <Text style={styles.userRole}>{formData.role}</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        </View>

        {/* Profile Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons name={isEditing ? "close" : "create-outline"} size={20} color={Colors.primary} />
              <Text style={styles.editButtonText}>{isEditing ? "Cancel" : "Edit"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <Input
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                editable={isEditing}
                style={[styles.profileInput, !isEditing && styles.disabledInput]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <Input
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                editable={isEditing}
                style={[styles.profileInput, !isEditing && styles.disabledInput]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <Input
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                editable={false}
                keyboardType="email-address"
                style={[styles.profileInput, styles.disabledInput]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <Input
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                editable={isEditing}
                keyboardType="phone-pad"
                style={[styles.profileInput, !isEditing && styles.disabledInput]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Department</Text>
              <Input
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
                editable={isEditing}
                style={[styles.profileInput, !isEditing && styles.disabledInput]}
              />
            </View>
          </View>

          {isEditing && (
            <View style={styles.saveButtonContainer}>
              <Button
                title={loading ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                color={Colors.success}
                style={styles.saveButton}
                disabled={loading}
              />
              {loading && (
                <ActivityIndicator 
                  size="small" 
                  color={Colors.success} 
                  style={{ marginTop: 8 }} 
                />
              )}
            </View>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionSubtitle}>Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="notifications-outline" size={24} color={Colors.accent} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Notifications</Text>
              <Text style={styles.actionSubtitle}>Manage notification preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="download-outline" size={24} color={Colors.success} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Export Data</Text>
              <Text style={styles.actionSubtitle}>Download your activity data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, styles.dangerAction]} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: Colors.danger }]}>Sign Out</Text>
              <Text style={styles.actionSubtitle}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primary,
    borderRadius: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarEditButton: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: Colors.success,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  
  statsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  statCard: {
    width: '47%' as any,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  
  infoSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  profileInput: {
    marginBottom: 0,
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: Colors.textSecondary,
  },
  
  saveButtonContainer: {
    marginTop: 20,
  },
  saveButton: {
    marginTop: 0,
  },
  
  actionsSection: {
    marginTop: 20,
  },
  actionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dangerAction: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
});