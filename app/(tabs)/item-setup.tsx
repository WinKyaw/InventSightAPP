import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { PermissionService } from '../../services/api/permissionService';
import { canManageSupply } from '../../utils/permissions';
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
  
  // CSV import/export states
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      const companyId = user?.companyId;
      
      if (!companyId) {
        Alert.alert(
          'Error', 
          'Company ID not found. Please log out and log in again.',
          [{ text: 'OK' }]
        );
        console.error('❌ No company ID in user object:', user);
        return;
      }
      
      console.log('🏢 Using company ID:', companyId);
      await PredefinedItemsService.createItem(item);
      Alert.alert('Success', 'Item added successfully');
      setShowSingleItemModal(false);
      // TODO: Refresh items list
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add item';
      Alert.alert('Error', errorMessage);
      console.error('❌ Error adding item:', error);
    }
  };

  const handleSaveBulkItems = async (items: PredefinedItemRequest[]) => {
    try {
      const companyId = user?.companyId;
      
      if (!companyId) {
        Alert.alert(
          'Error', 
          'Company ID not found. Please log out and log in again.',
          [{ text: 'OK' }]
        );
        console.error('❌ No company ID in user object:', user);
        return;
      }
      
      console.log('🏢 Using company ID:', companyId);
      console.log('📦 Bulk adding items:', items);
      
      // Extract location IDs from first item (all items have the same locations)
      const storeIds = items[0]?.storeIds;
      const warehouseIds = items[0]?.warehouseIds;
      
      const result = await PredefinedItemsService.bulkCreateItems(items, companyId, storeIds, warehouseIds);
      
      Alert.alert('Success', `Added ${result.created || items.length} items successfully`);
      setShowBulkAddModal(false);
      // TODO: Refresh items list
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add items';
      Alert.alert('Error', errorMessage);
      console.error('❌ Error adding bulk items:', error);
    }
  };

  // CSV Import Handler
  const handleImportCSV = async () => {
    try {
      setImporting(true);
      
      // Pick CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        setImporting(false);
        return;
      }
      
      const companyId = user?.companyId;
      
      if (!companyId) {
        Alert.alert('Error', 'Company ID not found. Please log out and log in again.');
        setImporting(false);
        return;
      }
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        type: 'text/csv',
      } as any);
      
      // Ask user about location association
      Alert.alert(
        'Location Association',
        'Do you want to associate imported items with your current location?',
        [
          {
            text: 'No',
            onPress: async () => {
              try {
                const response = await PredefinedItemsService.importCSV(formData, companyId);
                Alert.alert(
                  'Import Complete', 
                  `Successfully imported ${response.successful || 0} items.\n${response.failed || 0} failed.`
                );
              } catch (error: any) {
                const errorMessage = error?.response?.data?.message || error?.message || 'Failed to import CSV';
                Alert.alert('Import Error', errorMessage);
                console.error('❌ CSV Import Error:', error);
              } finally {
                setImporting(false);
              }
            }
          },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                // Add current location to import
                const storeId = user?.currentStoreId;
                const warehouseId = user?.currentWarehouseId;
                
                const response = await PredefinedItemsService.importCSV(
                  formData, 
                  companyId,
                  storeId ? [storeId] : undefined,
                  warehouseId ? [warehouseId] : undefined
                );
                Alert.alert(
                  'Import Complete', 
                  `Successfully imported ${response.successful || 0} items.\n${response.failed || 0} failed.`
                );
              } catch (error: any) {
                const errorMessage = error?.response?.data?.message || error?.message || 'Failed to import CSV';
                Alert.alert('Import Error', errorMessage);
                console.error('❌ CSV Import Error:', error);
              } finally {
                setImporting(false);
              }
            }
          }
        ],
        {
          cancelable: true,
          onDismiss: () => setImporting(false)
        }
      );
      
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to import CSV';
      Alert.alert('Import Error', errorMessage);
      console.error('❌ CSV Import Error:', error);
      setImporting(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      
      const companyId = user?.companyId;
      
      if (!companyId) {
        Alert.alert('Error', 'Company ID not found. Please log out and log in again.');
        setExporting(false);
        return;
      }
      
      // Download CSV from backend
      const csvContent = await PredefinedItemsService.exportCSV(companyId);
      
      // Save to file system
      const fileName = `predefined-items-${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `CSV exported to ${fileUri}`);
      }
      
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to export CSV';
      Alert.alert('Export Error', errorMessage);
      console.error('❌ CSV Export Error:', error);
    } finally {
      setExporting(false);
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
      
      {/* CSV Import/Export Section */}
      <View style={styles.csvSection}>
        <Text style={styles.sectionTitle}>Bulk Operations</Text>
        
        {/* CSV Format Info */}
        <View style={styles.csvInfo}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.csvInfoText}>
            CSV Format: name, category, unitType, sku{'\n'}
            Example: Apples, Food, lb, APL-001
          </Text>
        </View>
        
        <View style={styles.csvButtons}>
          <TouchableOpacity 
            style={[styles.csvButton, importing && styles.csvButtonDisabled]}
            onPress={handleImportCSV}
            disabled={importing}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="white" />
            <Text style={styles.csvButtonText}>
              {importing ? 'Importing...' : 'Import CSV'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.csvButton, styles.exportButton, exporting && styles.csvButtonDisabled]}
            onPress={handleExportCSV}
            disabled={exporting}
          >
            <Ionicons name="cloud-download-outline" size={20} color="white" />
            <Text style={styles.csvButtonText}>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.csvHint}>
          💡 Import/export items in bulk using CSV files
        </Text>
      </View>

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
  csvSection: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  csvInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  csvInfoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  csvButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  csvButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  exportButton: {
    backgroundColor: Colors.success,
  },
  csvButtonDisabled: {
    opacity: 0.5,
  },
  csvButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  csvHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
