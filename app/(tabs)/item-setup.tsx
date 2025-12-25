import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { PermissionService } from '../../services/api/permissionService';
import { canManageSupply } from '../../utils/permissions';
import { tokenManager } from '../../utils/tokenManager';
import { Header } from '../../components/shared/Header';
import { Colors } from '../../constants/Colors';
import { PredefinedItemsService } from '../../services/api/predefinedItemsService';
import { PredefinedItemRequest } from '../../types/predefinedItems';
import { AddPredefinedItemOptionsModal } from '../../components/modals/AddPredefinedItemOptionsModal';
import { AddSinglePredefinedItemModal } from '../../components/modals/AddSinglePredefinedItemModal';
import { BulkAddPredefinedItemsModal } from '../../components/modals/BulkAddPredefinedItemsModal';

export default function ItemSetupScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);
  const [showSingleItemModal, setShowSingleItemModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);

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

  const handleSaveSingleItem = async (item: PredefinedItemRequest) => {
    try {
      await PredefinedItemsService.createItem(item);
      Alert.alert('Success', 'Item added successfully');
      setShowSingleItemModal(false);
      // TODO: Refresh items list
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add item';
      Alert.alert('Error', errorMessage);
      console.error('Error adding item:', error);
    }
  };

  const handleSaveBulkItems = async (items: PredefinedItemRequest[]) => {
    try {
      // Get company ID from user's companyId or extract from token
      let companyId = user?.companyId;
      
      if (!companyId) {
        // Try to get tenant_id from the JWT token
        try {
          const token = await tokenManager.getAccessToken();
          
          if (token) {
            const decoded: any = jwtDecode(token);
            companyId = decoded.tenant_id;
          }
        } catch (tokenError) {
          console.error('Error decoding token:', tokenError);
        }
      }
      
      if (!companyId) {
        Alert.alert('Error', 'Company ID not found. Please log in again.');
        console.error('Company ID not found');
        return;
      }
      
      console.log('Using company ID for bulk items');
      
      const result = await PredefinedItemsService.bulkCreateItems(
        items,
        companyId
      );
      
      Alert.alert('Success', `Added ${result.created || items.length} items successfully`);
      setShowBulkAddModal(false);
      // TODO: Refresh items list
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add items';
      Alert.alert('Error', errorMessage);
      console.error('Error adding bulk items:', error);
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
        rightComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddOptionsModal(true)}
          >
            <Ionicons name="add-circle" size={28} color="white" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        }
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

      {/* Add Options Modal */}
      <AddPredefinedItemOptionsModal
        visible={showAddOptionsModal}
        onClose={() => setShowAddOptionsModal(false)}
        onSelectSingle={() => {
          setShowAddOptionsModal(false);
          setShowSingleItemModal(true);
        }}
        onSelectBulk={() => {
          setShowAddOptionsModal(false);
          setShowBulkAddModal(true);
        }}
      />

      {/* Single Item Modal */}
      <AddSinglePredefinedItemModal
        visible={showSingleItemModal}
        onClose={() => setShowSingleItemModal(false)}
        onSave={(item) => handleSaveSingleItem(item)}
      />

      {/* Bulk Add Modal */}
      <BulkAddPredefinedItemsModal
        visible={showBulkAddModal}
        onClose={() => setShowBulkAddModal(false)}
        onSave={(items) => handleSaveBulkItems(items)}
      />
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
