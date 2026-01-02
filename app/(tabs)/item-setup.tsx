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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
// Using legacy API for compatibility with writeAsStringAsync in Expo SDK 54+
import * as FileSystem from 'expo-file-system/legacy';
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
import { LocationAssociationModal } from '../../components/modals/LocationAssociationModal';
import { FilterSortModal } from '../../components/modals/FilterSortModal';

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

  // Selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [managingItemId, setManagingItemId] = useState<string | null>(null);

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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
      
      // ✅ Access nested data with null safety
      if (response.success && response.data) {
        const itemsList = response.data.items || [];
        
        if (append) {
          setItems(prev => [...prev, ...itemsList]);
        } else {
          setItems(itemsList);
        }
        
        setTotalItems(response.data.totalElements || 0);
        setHasMore(itemsList.length === PAGE_SIZE);
        setPage(pageNum);
        
        console.log('✅ Loaded items:', itemsList.length);
      } else {
        console.warn('⚠️ Response missing data:', response);
        setItems([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch items:', error);
      Alert.alert('Error', 'Failed to load items');
      setItems([]);  // ✅ Set empty array on error
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
      
      // Note: Using string 'utf8' instead of FileSystem.EncodingType.UTF8 
      // because EncodingType is undefined in expo-file-system v19+ (SDK 54)
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: 'utf8',
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

  // Selection mode functions
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    setSelectedItems(items.map(item => item.id));
  };

  const unselectAll = () => {
    setSelectedItems([]);
  };

  const cancelSelection = () => {
    setSelectedItems([]);
    setSelectionMode(false);
  };

  const handleBulkAssign = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Selection', 'Please select at least one item');
      return;
    }
    setShowLocationModal(true);
  };

  const handleManageLocations = (itemId: string) => {
    setManagingItemId(itemId);
    setSelectedItems([itemId]);
    setShowLocationModal(true);
  };

  const handleLocationAssignSuccess = () => {
    fetchItems(0, false);  // Refresh items
    if (!managingItemId) {
      // Bulk assign completed
      setSelectionMode(false);
      setSelectedItems([]);
    }
    setManagingItemId(null);
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
        title={selectionMode ? `${selectedItems.length} selected` : "New Item Setup"}
        subtitle={selectionMode ? undefined : "Manage Predefined Items"}
        backgroundColor="#F59E0B"
        leftComponent={
          selectionMode ? (
            <TouchableOpacity onPress={cancelSelection}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          ) : undefined
        }
        rightComponent={
          selectionMode ? (
            <View style={styles.selectionActions}>
              <TouchableOpacity onPress={selectAll} style={styles.selectionButton}>
                <Text style={styles.selectionButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={unselectAll} style={styles.selectionButton}>
                <Text style={styles.selectionButtonText}>Unselect All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleBulkAssign}
                style={[styles.selectionButton, styles.assignButton]}
              >
                <Ionicons name="location" size={20} color="white" />
                <Text style={styles.selectionButtonText}>Assign</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setSelectionMode(true)}
              >
                <Ionicons name="checkbox-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddOptionsModal(true)}
              >
                <Ionicons name="add-circle" size={28} color="white" />
                <Text style={styles.addButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
      
      {/* Multi-Select Helper Text */}
      {!selectionMode && (
        <View style={styles.helperBanner}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.helperText}>
            Tap the checkbox icon to select multiple items and assign them to stores/warehouses
          </Text>
        </View>
      )}
      
      {/* CSV Import/Export Section */}
      <View style={styles.csvSection}>
        <Text style={styles.sectionTitle}>Bulk Operations</Text>
        
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
      </View>

      {/* Items List Section */}
      <View style={styles.itemsSection}>
        {/* Search Bar with Filter */}
        <View style={styles.searchRow}>
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
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Items List */}
        {loadingItems && (!items || items.length === 0) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        ) : (!items || items.length === 0) ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search' : 'Add your first item to get started'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items || []}  // ✅ Fallback to empty array
            keyExtractor={(item, index) => item.id?.toString() || `item-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.itemCard,
                  selectionMode && selectedItems.includes(item.id) && styles.itemCardSelected
                ]}
                onPress={() => {
                  if (selectionMode) {
                    toggleItemSelection(item.id);
                  }
                }}
                onLongPress={() => {
                  if (!selectionMode) {
                    setSelectionMode(true);
                    toggleItemSelection(item.id);
                  }
                }}
              >
                {selectionMode && (
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      selectedItems.includes(item.id) && styles.checkboxActive
                    ]}>
                      {selectedItems.includes(item.id) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </View>
                )}
                
                <View style={[styles.itemContent, selectionMode && styles.itemContentWithCheckbox]}>
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
                  
                  {/* Location Management Section */}
                  {!selectionMode && (
                    <View style={styles.locationsSection}>
                      <View style={styles.locationBadges}>
                        {/* Placeholder badges - actual counts would come from API */}
                        <View style={styles.locationBadge}>
                          <Ionicons name="storefront" size={12} color={Colors.primary} />
                          <Text style={styles.locationBadgeText}>Stores</Text>
                        </View>
                        <View style={styles.locationBadge}>
                          <Ionicons name="business" size={12} color={Colors.primary} />
                          <Text style={styles.locationBadgeText}>Warehouses</Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.manageButton}
                        onPress={() => handleManageLocations(item.id)}
                      >
                        <Ionicons name="location-outline" size={16} color={Colors.primary} />
                        <Text style={styles.manageButtonText}>Manage</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
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
        
        {/* Items Count at Bottom - Always Visible */}
        {items && items.length > 0 && (
          <View style={styles.itemsCountFooter}>
            <Text style={styles.itemsCountText}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Text>
          </View>
        )}
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

      {/* Location Association Modal */}
      <LocationAssociationModal
        visible={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setManagingItemId(null);
          if (!managingItemId) {
            setSelectedItems([]);
          }
        }}
        itemIds={managingItemId ? [managingItemId] : selectedItems}
        itemNames={
          managingItemId
            ? [items.find(i => i.id === managingItemId)?.name || '']
            : selectedItems.map(id => items.find(i => i.id === id)?.name || '')
        }
        onSuccess={handleLocationAssignSuccess}
      />

      {/* Filter Sort Modal */}
      <FilterSortModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={(category) => setSelectedCategory(category)}
        categories={['All', 'Food', 'Beverages', 'Supplies', 'Other']}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSelectSort={(sort) => setSortBy(sort)}
        onToggleSortOrder={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
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
  helperBanner: {
    backgroundColor: Colors.lightBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
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
  csvButtons: {
    flexDirection: 'row',
    gap: 12,
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
  itemsSection: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
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
  filterButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
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
  itemsCountFooter: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemsCountText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  // Selection mode styles
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  itemCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemContent: {
    flex: 1,
  },
  itemContentWithCheckbox: {
    marginLeft: 40,
  },
  locationsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationBadges: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  locationBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  manageButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});
