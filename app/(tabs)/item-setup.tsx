import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { PermissionService } from '../../services/api/permissionService';
import { canManageSupply } from '../../utils/permissions';
import { Header } from '../../components/shared/Header';
import { Colors } from '../../constants/Colors';

export default function ItemSetupScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Check if user is GM+ using the utility function
      const isGMPlus = canManageSupply(user?.role);

      // Check MANAGE_SUPPLY permission from API
      const hasSupplyPermission = await PermissionService.canManageSupply();

      const hasAccess = isGMPlus || hasSupplyPermission;
      setCanAccess(hasAccess);

      if (!hasAccess) {
        Alert.alert(
          'Access Denied',
          'You do not have permission to access New Item Setup. Access is granted through either GM+ role or special supply management permissions.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setCanAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="New Item Setup"
          backgroundColor="#F59E0B"
        />
        <View style={styles.centerContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canAccess) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="New Item Setup"
        subtitle="Manage Predefined Items"
        backgroundColor="#F59E0B"
      />
      <View style={styles.centerContainer}>
        <Text style={styles.placeholderText}>
          📦 New Item Setup Page
        </Text>
        <Text style={styles.placeholderSubtext}>
          This page will allow you to manage predefined items,{'\n'}
          import/export CSV, and perform bulk operations.
        </Text>
        <Text style={styles.infoText}>
          Full implementation coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: Colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
