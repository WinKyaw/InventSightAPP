import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Colors } from '../../constants/Colors';
import { ProfileService } from '../../services/api/profileService';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { NavigationSettingsModal } from '../modals/NavigationSettingsModal';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNavSettings, setShowNavSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Load fresh profile data when modal opens
  useEffect(() => {
    if (visible) {
      loadProfile();
    }
  }, [visible]);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const profile = await ProfileService.getMyProfile();
      setProfileData(profile);
      setFormData({
        email: profile.email || '',
        phone: profile.phone || '',
      });
    } catch (error: any) {
      // Fallback to auth context user
      setFormData({
        email: user?.email || '',
        phone: (user as any)?.phone || '',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email address is required');
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);
      const result = await ProfileService.updateProfile({
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
      });
      // Update local profile state from response to avoid hitting /api/auth/profile
      if (result?.user) {
        setProfileData(result.user);
      }
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Restore original values
    setFormData({
      email: profileData?.email || user?.email || '',
      phone: profileData?.phone || (user as any)?.phone || '',
    });
    setIsEditing(false);
  };

  const currentProfile = profileData || user;
  const displayName = currentProfile
    ? `${(currentProfile as any).firstName || ''} ${(currentProfile as any).lastName || ''}`.trim() || (currentProfile as any).name || 'User'
    : 'User';
  const roleLabel = (currentProfile as any)?.role || (user as any)?.role || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <Modal visible={visible} onClose={onClose} title="My Profile">
        {loadingProfile ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: '#6B7280', marginTop: 12 }}>Loading profile...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar & Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.displayName}>{displayName}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{roleLabel}</Text>
                </View>
                {(currentProfile as any)?.storeName && (
                  <Text style={styles.storeText}>📍 {(currentProfile as any).storeName}</Text>
                )}
              </View>
            </View>

            {/* Edit / Cancel buttons */}
            <View style={styles.editRow}>
              {!isEditing ? (
                <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                  <Text style={[styles.editButtonText, { color: Colors.primary }]}>Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Profile Fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <Text style={styles.fieldValue}>{displayName}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                {isEditing ? (
                  <Input
                    value={formData.email}
                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="your@email.com"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{formData.email || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChangeText={(t) => setFormData({ ...formData, phone: t })}
                    keyboardType="phone-pad"
                    placeholder="(555) 123-4567"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{formData.phone || 'Not set'}</Text>
                )}
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Role</Text>
                <Text style={styles.fieldValue}>{roleLabel}</Text>
              </View>

              {(currentProfile as any)?.employeeTitle && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Title</Text>
                  <Text style={styles.fieldValue}>{(currentProfile as any).employeeTitle}</Text>
                </View>
              )}

              {(currentProfile as any)?.department && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Department</Text>
                  <Text style={styles.fieldValue}>{(currentProfile as any).department}</Text>
                </View>
              )}
            </View>

            {/* Account Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Security</Text>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  // Close ProfileModal first to avoid React Native modal stacking issues
                  onClose();
                  setShowPasswordModal(true);
                }}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Change Password</Text>
                  <Text style={styles.actionSubtitle}>Update your login password securely</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {/* App Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Settings</Text>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => setShowNavSettings(true)}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="navigate-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Customize Navigation</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/setting');
                }}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="settings-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>App Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Ionicons name="help-circle-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Help & Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Ionicons name="information-circle-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>About POS App</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Modal>

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          Alert.alert('Security Update', 'Your password has been changed. Please log in again next time with your new password.');
        }}
      />

      <NavigationSettingsModal
        visible={showNavSettings}
        onClose={() => setShowNavSettings(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  displayName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: '#EFF6FF',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4
  },
  roleText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  storeText: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  editRow: { paddingHorizontal: 20, paddingBottom: 12 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editButtonText: { fontSize: 14, fontWeight: '600' },
  editActions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
  cancelButtonText: { color: '#374151', fontWeight: '600' },
  saveButton: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  fieldGroup: { marginBottom: 12 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  fieldLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  fieldValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  actionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  actionSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});