import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
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
import { PredefinedItem, PredefinedItemRequest } from '../../types/predefinedItems';
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

  // Items list state
  const [items, setItems] = useState<PredefinedItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [refreshingItems, setRefreshingItems] = useState(false);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Constants
  const PAGE_SIZE = 20;

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

  const fetchItems = async (pageNum: number = 0, append: boolean = false) => {
    if (loadingItems) return;
    
    try {
      setLoadingItems(true);
      
      const companyId = user?.companyId;
      
      if (!companyId) {
        console.error('❌ No company ID available');
        Alert.alert('Error', 'Company ID not found. Please log out and log in again.');
        return;
      }
      
      console.log('🔄 Fetching items for company:', companyId);
      
      const response = await PredefinedItemsService.getAllItems(
        companyId,
        pageNum,
        PAGE_SIZE,
        searchQuery || undefined,
        selectedCategory !== 'All' ? selectedCategory : undefined
      );
      
      if (response.success) {
        if (append) {
          setItems(prev => [...prev, ...response.items]);
        } else {
          setItems(response.items);
        }
        
        setTotalItems(response.totalItems);
        setHasMore(response.items.length === PAGE_SIZE);
        setPage(pageNum);
        
        console.log('✅ Loaded items:', response.items.length);
      }
    } catch (error: any) {
      console.error('Failed to fetch items:', error);
      Alert.alert('Error', 'Failed to load items');
    } finally {
      setLoadingItems(false);
      setRefreshingItems(false);
    }
  };

  const handleRefresh = () => {
    setRefreshingItems(true);
    fetchItems(0, false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingItems) {
      fetchItems(page + 1, true);
    }
  };

  useEffect(() => {
    if (canAccess && user?.companyId) {
      console.log('🎯 Initial load - Company ID:', user.companyId);
      fetchItems(0, false);
    } else if (canAccess && !user?.companyId) {
      console.warn('⚠️ Cannot fetch items - no company ID');
    }
  }, [canAccess, user?.companyId, searchQuery, selectedCategory]);

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
      // Refresh items list
      fetchItems(0, false);
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
      // Refresh items list
      fetchItems(0, false);
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
                // Refresh items list
                fetchItems(0, false);
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
                // Refresh items list
                fetchItems(0, false);
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

      {/* Items List Section */}
      <View style={styles.itemsSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
        >
          {['All', 'Food', 'Beverages', 'Supplies', 'Other'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Items List */}
        {loadingItems && items.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search' : 'Add your first item to get started'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemDetailText}>
                    SKU: {item.sku || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetailText}>
                    Unit: {item.unitType}
                  </Text>
                  {item.defaultPrice && (
                    <Text style={styles.itemDetailText}>
                      Price: ${item.defaultPrice.toFixed(2)}
                    </Text>
                  )}
                </View>
                {item.description && (
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshingItems}
                onRefresh={handleRefresh}
                colors={[Colors.primary]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingItems && items.length > 0 ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : null
            }
            contentContainerStyle={styles.listContainer}
          />
        )}

        {/* Items Count */}
        <View style={styles.itemsCount}>
          <Text style={styles.itemsCountText}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Text>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  itemsSection: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  itemCategory: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  itemDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  itemsCount: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: 'white',
  },
  itemsCountText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
});
