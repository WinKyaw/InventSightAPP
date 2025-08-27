import React, { ReactNode, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileModal } from './ProfileModal';

interface HeaderProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  rightComponent?: ReactNode;
  style?: ViewStyle;
  showProfileButton?: boolean;
}

export function Header({ 
  title, 
  subtitle, 
  backgroundColor = '#3B82F6', 
  rightComponent,
  style,
  showProfileButton = false
}: HeaderProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <View style={[styles.header, { backgroundColor }, style]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.headerRight}>
            {rightComponent}
            {showProfileButton && (
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => setShowProfileModal(true)}
              >
                <Ionicons name="person-circle" size={28} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  profileButton: {
    padding: 4,
  },
});