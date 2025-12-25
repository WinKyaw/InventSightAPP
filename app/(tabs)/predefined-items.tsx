import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Header } from '../../components/shared/Header';
import { SearchBar } from '../../components/shared/SearchBar';
import { PredefinedItemsService } from '../../services/api/predefinedItemsService';
import { PermissionService } from '../../services/api/permissionService';
import { useAuth } from '../../context/AuthContext';
import { canManageSupply } from '../../utils/permissions';
import { Colors } from '../../constants/Colors';
import { styles as commonStyles } from '../../constants/Styles';
import {
  PredefinedItem,
  PredefinedItemRequest,
  ImportResponse,
} from '../../types/predefinedItems';

export default function PredefinedItemsScreen() {
  // ✅ SECURITY FIX: Add authentication check
  const { isAuthenticated, isInitialized, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      console.log('🔐 Predefined Items: Unauthorized access blocked, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const [canManage, setCanManage] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  // State
  const [items, setItems] = useState<PredefinedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportResultModal, setShowImportResultModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<PredefinedItem | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  // Categories list (can be fetched from API or hardcoded)
  const categories = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Meat', 'Bakery', 'Beverages', 'Other'];
  const unitTypes = ['lb', 'kg', 'oz', 'gal', 'l', 'ml', 'pc', 'box', 'case'];

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      // Check both role-based and API-based permissions
      const roleCheck = canManageSupply(user?.role);
      const apiCheck = await PermissionService.canManageSupply();
      
      const hasPermission = roleCheck || apiCheck;
      setCanManage(hasPermission);
      setPermissionChecked(true);

      if (!hasPermission) {
        Alert.alert(
          'Access Denied',
          'You do not have permission to manage predefined items.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        loadItems();
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissionChecked(true);
      setCanManage(false);
      Alert.alert('Error', 'Failed to verify permissions. Please try again.');
    }
  };

  // Load items
  const loadItems = async (pageNum = 0, append = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await PredefinedItemsService.getAllItems(
        pageNum,
        20,
        searchQuery,
        selectedCategory
      );

      if (append) {
        setItems((prev) => [...prev, ...response.items]);
      } else {
        setItems(response.items);
      }

      setHasMore(response.currentPage < response.totalPages - 1);
      setTotalPages(response.totalPages);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Failed to load items:', error);
      
      // Don't show error if it's a 404 (endpoint not implemented yet)
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load predefined items. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    loadItems(0, false);
  }, [searchQuery, selectedCategory]);

  // Load more handler
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadItems(page + 1, true);
    }
  };

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  // Category filter handler
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(0);
  };

  // Trigger search/filter
  useEffect(() => {
    if (canManage && permissionChecked) {
      const timer = setTimeout(() => {
        loadItems(0, false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedCategory]);

  // Add item handler
  const handleAddItem = async (itemData: PredefinedItemRequest) => {
    try {
      await PredefinedItemsService.createItem(itemData);
      setShowAddModal(false);
      setEditingItem(null);
      loadItems(0, false);
      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      console.error('Failed to add item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  // Edit item handler
  const handleEditItem = async (itemData: PredefinedItemRequest) => {
    if (!editingItem) return;

    try {
      await PredefinedItemsService.updateItem(editingItem.id, itemData);
      setShowAddModal(false);
      setEditingItem(null);
      loadItems(page, false);
      Alert.alert('Success', 'Item updated successfully');
    } catch (error) {
      console.error('Failed to update item:', error);
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  // Delete item handler
  const handleDeleteItem = (item: PredefinedItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PredefinedItemsService.deleteItem(item.id);
              loadItems(page, false);
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Bulk add handler
  const handleBulkAdd = async (itemsText: string, defaultCategory: string, defaultUnit: string) => {
    try {
      const lines = itemsText.split('\n').filter((line) => line.trim());
      const items: PredefinedItemRequest[] = lines.map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        return {
          name: parts[0] || '',
          category: parts[1] || defaultCategory,
          unitType: parts[2] || defaultUnit,
          defaultPrice: parts[3] ? parseFloat(parts[3]) : undefined,
        };
      }).filter((item) => item.name);

      const response = await PredefinedItemsService.bulkCreateItems(items);
      setShowBulkAddModal(false);
      loadItems(0, false);
      Alert.alert('Success', `Added ${response.created} items successfully`);
    } catch (error) {
      console.error('Failed to bulk add items:', error);
      Alert.alert('Error', 'Failed to add items. Please try again.');
    }
  };

  // CSV Import handler
  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      // Parse CSV
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim());

      const items: PredefinedItemRequest[] = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(',').map((v) => v.trim());
          return {
            name: values[0] || '',
            sku: values[1] || undefined,
            category: values[2] || 'Other',
            unitType: values[3] || 'pc',
            defaultPrice: values[4] ? parseFloat(values[4]) : undefined,
            description: values[5] || undefined,
          };
        })
        .filter((item) => item.name);

      // Send to API
      const response = await PredefinedItemsService.importCSV(items);

      setImportResult(response);
      setShowImportModal(false);
      setShowImportResultModal(true);
      loadItems(0, false);
    } catch (error) {
      console.error('Failed to import CSV:', error);
      Alert.alert('Error', 'Failed to import CSV. Please check the file format.');
    }
  };

  // CSV Export handler
  const handleExportCSV = async () => {
    try {
      const csvContent = await PredefinedItemsService.exportCSV();

      const filename = `predefined-items-${new Date().toISOString().split('T')[0]}.csv`;
      const baseDir = (FileSystem as any).documentDirectory;
      if (!baseDir) {
        Alert.alert('Error', 'File system not available');
        return;
      }
      const fileUri = baseDir + filename;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
        Alert.alert('Success', 'Items exported successfully');
      } else {
        Alert.alert('Export Complete', `File saved: ${filename}`);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
      Alert.alert('Error', 'Failed to export items. Please try again.');
    }
  };

  // Download CSV Template
  const handleDownloadTemplate = async () => {
    const template = 'name,sku,category,unitType,defaultPrice,description\n' +
      'Apples,APL-001,Fruits,lb,2.99,Fresh red apples\n' +
      'Bananas,BAN-001,Fruits,lb,1.49,Organic bananas\n' +
      'Milk,MLK-001,Dairy,gal,4.99,Whole milk';

    const filename = 'predefined-items-template.csv';
    const baseDir = (FileSystem as any).documentDirectory;
    if (!baseDir) {
      Alert.alert('Error', 'File system not available');
      return;
    }
    const fileUri = baseDir + filename;

    try {
      await FileSystem.writeAsStringAsync(fileUri, template);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Template Downloaded', `File saved: ${filename}`);
      }
    } catch (error) {
      console.error('Failed to download template:', error);
      Alert.alert('Error', 'Failed to download template');
    }
  };

  // Show loading while checking permissions
  if (!permissionChecked) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render if no permission
  if (!canManage) {
    return null;
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="dark-content" />
      <Header
        title="Items Library"
        rightComponent={
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingItem(null);
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowActionMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search items..."
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => handleCategoryChange(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingItem(item);
                    setShowAddModal(true);
                  }}
                >
                  <Ionicons name="pencil" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.deleteButton}>
                  <Ionicons name="trash" size={20} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemDetailText}>
                Category: {item.category} | Unit: {item.unitType}
              </Text>
              {item.sku && (
                <Text style={styles.itemDetailText}>SKU: {item.sku}</Text>
              )}
              {item.defaultPrice && (
                <Text style={styles.itemDetailText}>
                  Price: ${item.defaultPrice.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={Colors.gray} />
              <Text style={styles.emptyText}>No items found</Text>
              <Text style={styles.emptySubtext}>Add items to get started</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && !loading ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : totalPages > 0 ? (
            <View style={styles.paginationInfo}>
              <Text style={styles.paginationText}>
                Page {page + 1} of {totalPages}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Action Menu Modal */}
      <ActionMenuModal
        visible={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        onBulkAdd={() => {
          setShowActionMenu(false);
          setShowBulkAddModal(true);
        }}
        onImportCSV={() => {
          setShowActionMenu(false);
          setShowImportModal(true);
        }}
        onExportCSV={() => {
          setShowActionMenu(false);
          handleExportCSV();
        }}
        onDownloadTemplate={handleDownloadTemplate}
        onRefresh={handleRefresh}
      />

      {/* Add/Edit Item Modal */}
      <AddEditItemModal
        visible={showAddModal}
        item={editingItem}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
        }}
        onSave={editingItem ? handleEditItem : handleAddItem}
        categories={categories.filter((c) => c !== 'All')}
        unitTypes={unitTypes}
      />

      {/* Bulk Add Modal */}
      <BulkAddModal
        visible={showBulkAddModal}
        onClose={() => setShowBulkAddModal(false)}
        onSave={handleBulkAdd}
        categories={categories.filter((c) => c !== 'All')}
        unitTypes={unitTypes}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCSV}
        onDownloadTemplate={handleDownloadTemplate}
      />

      {/* Import Result Modal */}
      <ImportResultModal
        visible={showImportResultModal}
        result={importResult}
        onClose={() => {
          setShowImportResultModal(false);
          setImportResult(null);
        }}
      />
    </SafeAreaView>
  );
}

// Action Menu Modal Component
const ActionMenuModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onBulkAdd: () => void;
  onImportCSV: () => void;
  onExportCSV: () => void;
  onDownloadTemplate: () => void;
  onRefresh: () => void;
}> = ({ visible, onClose, onBulkAdd, onImportCSV, onExportCSV, onDownloadTemplate, onRefresh }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.actionMenu}>
        <TouchableOpacity style={styles.actionMenuItem} onPress={onBulkAdd}>
          <Ionicons name="albums-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionMenuText}>Bulk Add Items</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionMenuItem} onPress={onImportCSV}>
          <Ionicons name="cloud-upload-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionMenuText}>Import CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionMenuItem} onPress={onExportCSV}>
          <Ionicons name="cloud-download-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionMenuText}>Export CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionMenuItem} onPress={onDownloadTemplate}>
          <Ionicons name="document-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionMenuText}>Download Template</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionMenuItem} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={24} color={Colors.primary} />
          <Text style={styles.actionMenuText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

// Add/Edit Item Modal Component
const AddEditItemModal: React.FC<{
  visible: boolean;
  item: PredefinedItem | null;
  onClose: () => void;
  onSave: (data: PredefinedItemRequest) => void;
  categories: string[];
  unitTypes: string[];
}> = ({ visible, item, onClose, onSave, categories, unitTypes }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unitType, setUnitType] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSku(item.sku || '');
      setCategory(item.category);
      setUnitType(item.unitType);
      setDefaultPrice(item.defaultPrice?.toString() || '');
      setDescription(item.description || '');
    } else {
      setName('');
      setSku('');
      setCategory(categories[0] || '');
      setUnitType(unitTypes[0] || '');
      setDefaultPrice('');
      setDescription('');
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Category is required');
      return;
    }
    if (!unitType) {
      Alert.alert('Error', 'Unit type is required');
      return;
    }

    onSave({
      name: name.trim(),
      sku: sku.trim() || undefined,
      category,
      unitType,
      defaultPrice: defaultPrice ? parseFloat(defaultPrice) : undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {item ? 'Edit Item' : 'Add Predefined Item'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter item name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>SKU (optional)</Text>
            <TextInput
              style={styles.input}
              value={sku}
              onChangeText={setSku}
              placeholder="Enter SKU"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.selectChip,
                    category === cat && styles.selectChipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.selectChipText,
                      category === cat && styles.selectChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Unit Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {unitTypes.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.selectChip,
                    unitType === unit && styles.selectChipActive,
                  ]}
                  onPress={() => setUnitType(unit)}
                >
                  <Text
                    style={[
                      styles.selectChipText,
                      unitType === unit && styles.selectChipTextActive,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Default Price (optional)</Text>
            <TextInput
              style={styles.input}
              value={defaultPrice}
              onChangeText={setDefaultPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Bulk Add Modal Component
const BulkAddModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (items: string, defaultCategory: string, defaultUnit: string) => void;
  categories: string[];
  unitTypes: string[];
}> = ({ visible, onClose, onSave, categories, unitTypes }) => {
  const [itemsText, setItemsText] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('');

  useEffect(() => {
    if (visible) {
      setItemsText('');
      setDefaultCategory(categories[0] || '');
      setDefaultUnit(unitTypes[0] || '');
    }
  }, [visible]);

  const handleSave = () => {
    if (!itemsText.trim()) {
      Alert.alert('Error', 'Please enter at least one item');
      return;
    }
    onSave(itemsText, defaultCategory, defaultUnit);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Bulk Add Items</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.infoText}>
            Enter items (one per line):
            {'\n\n'}
            Format options:
            {'\n'}• Name
            {'\n'}• Name, Category, Unit
            {'\n'}• Name, Category, Unit, Price
          </Text>

          <TextInput
            style={[styles.input, styles.bulkTextArea]}
            value={itemsText}
            onChangeText={setItemsText}
            placeholder={`Apples, Fruits, lb, 2.99\nBananas, Fruits, lb, 1.49\nMilk, Dairy, gal, 4.99`}
            multiline
            numberOfLines={10}
          />

          <View style={styles.formGroup}>
            <Text style={styles.label}>Default Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.selectChip,
                    defaultCategory === cat && styles.selectChipActive,
                  ]}
                  onPress={() => setDefaultCategory(cat)}
                >
                  <Text
                    style={[
                      styles.selectChipText,
                      defaultCategory === cat && styles.selectChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Default Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {unitTypes.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.selectChip,
                    defaultUnit === unit && styles.selectChipActive,
                  ]}
                  onPress={() => setDefaultUnit(unit)}
                >
                  <Text
                    style={[
                      styles.selectChipText,
                      defaultUnit === unit && styles.selectChipTextActive,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Add All</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Import CSV Modal Component
const ImportCSVModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
}> = ({ visible, onClose, onImport, onDownloadTemplate }) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Import from CSV</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color={Colors.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.modalContent}>
        <Text style={styles.infoText}>
          Select a CSV file to import:
          {'\n\n'}
          Expected format:
          {'\n'}
          name,sku,category,unitType,price,description
        </Text>

        <TouchableOpacity style={styles.importButton} onPress={onImport}>
          <Ionicons name="document-text-outline" size={24} color="white" />
          <Text style={styles.importButtonText}>Choose File</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>Or</Text>

        <TouchableOpacity style={styles.templateButton} onPress={onDownloadTemplate}>
          <Ionicons name="download-outline" size={24} color={Colors.primary} />
          <Text style={styles.templateButtonText}>Download Template</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.fullWidthButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </Modal>
);

// Import Result Modal Component
const ImportResultModal: React.FC<{
  visible: boolean;
  result: ImportResponse | null;
  onClose: () => void;
}> = ({ visible, result, onClose }) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Import Complete</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color={Colors.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.modalContent}>
        {result && (
          <>
            <Text style={styles.resultTitle}>Results:</Text>

            <View style={styles.resultRow}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.resultText}>Imported: {result.imported} items</Text>
            </View>

            <View style={styles.resultRow}>
              <Ionicons name="play-skip-forward" size={24} color={Colors.warning} />
              <Text style={styles.resultText}>Skipped: {result.skipped} duplicates</Text>
            </View>

            <View style={styles.resultRow}>
              <Ionicons name="close-circle" size={24} color={Colors.danger} />
              <Text style={styles.resultText}>Errors: {result.errors.length} items</Text>
            </View>

            {result.errors.length > 0 && (
              <>
                <Text style={styles.errorTitle}>Errors:</Text>
                <ScrollView style={styles.errorList}>
                  {result.errors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>
                      • {error}
                    </Text>
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}
      </View>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.fullWidthButton} onPress={onClose}>
          <Text style={styles.saveButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </Modal>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.gray,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    padding: 4,
  },
  menuButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#F59E0B',
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.gray,
  },
  categoryChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  deleteButton: {
    marginLeft: 8,
  },
  itemDetails: {
    gap: 4,
  },
  itemDetailText: {
    fontSize: 14,
    color: Colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 8,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  paginationInfo: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    color: Colors.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionMenu: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  actionMenuText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  bulkTextArea: {
    height: 200,
    textAlignVertical: 'top',
  },
  selectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    marginRight: 8,
  },
  selectChipActive: {
    backgroundColor: '#F59E0B',
  },
  selectChipText: {
    fontSize: 14,
    color: Colors.gray,
  },
  selectChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  fullWidthButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 20,
    lineHeight: 20,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 20,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  templateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    color: Colors.text,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  errorList: {
    maxHeight: 200,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    marginBottom: 8,
  },
});
