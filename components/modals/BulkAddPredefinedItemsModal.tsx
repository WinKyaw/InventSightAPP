import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../constants/Colors';
import { PredefinedItemRequest } from '../../types/predefinedItems';
import { useAuth } from '../../context/AuthContext';
import { StoreService, Store } from '../../services/api/storeService';
import { WarehouseService } from '../../services/api/warehouse';
import { WarehouseSummary } from '../../types/warehouse';

interface BulkAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (items: PredefinedItemRequest[]) => void;
}

const CATEGORIES = ['Food', 'Beverages', 'Electronics', 'Clothing', 'Supplies', 'Other'];
const UNIT_TYPES = ['pcs', 'kg', 'lb', 'liters', 'gal', 'oz', 'boxes'];

export function BulkAddPredefinedItemsModal({ visible, onClose, onSave }: BulkAddModalProps) {
  const { user } = useAuth();
  const [bulkText, setBulkText] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('Food');
  const [defaultUnitType, setDefaultUnitType] = useState('pcs');
  
  // Location selection states
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  
  // Load stores and warehouses when modal opens
  useEffect(() => {
    if (visible) {
      loadLocations();
    } else {
      // Reset form when modal closes
      resetForm();
    }
  }, [visible]);
  
  const loadLocations = async () => {
    try {
      const [storesData, warehousesData] = await Promise.all([
        StoreService.getUserStores(),
        WarehouseService.getWarehouses(),
      ]);
      setStores(storesData);
      setWarehouses(warehousesData);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };
  
  const handleSelectStores = () => {
    const storeOptions = stores.map((s: Store) => s.storeName).join('\n');
    Alert.alert(
      'Select Stores',
      `Available stores:\n${storeOptions}\n\nCurrently selected: ${selectedStores.length} store(s)`,
      [
        {
          text: 'Clear Selection',
          onPress: () => setSelectedStores([]),
          style: 'destructive'
        },
        {
          text: 'Select All',
          onPress: () => setSelectedStores(stores.map((s: Store) => s.id))
        },
        { text: 'OK' }
      ]
    );
  };
  
  const handleSelectWarehouses = () => {
    const warehouseOptions = warehouses.map((w: WarehouseSummary) => w.name).join('\n');
    Alert.alert(
      'Select Warehouses',
      `Available warehouses:\n${warehouseOptions}\n\nCurrently selected: ${selectedWarehouses.length} warehouse(s)`,
      [
        {
          text: 'Clear Selection',
          onPress: () => setSelectedWarehouses([]),
          style: 'destructive'
        },
        {
          text: 'Select All',
          onPress: () => setSelectedWarehouses(warehouses.map((w: WarehouseSummary) => w.id))
        },
        { text: 'OK' }
      ]
    );
  };

  const handleSave = () => {
    if (!bulkText.trim()) {
      Alert.alert('Error', 'Please enter at least one item');
      return;
    }

    const lines = bulkText.split('\n').filter((line: string) => line.trim());
    
    // Backend expects array of objects with string values
    const items = lines.map((line: string) => {
      const parts = line.split(',').map((p: string) => p.trim());
      
      const item: any = {
        name: parts[0] || '',
        category: parts[1] || defaultCategory,
        unitType: parts[2] || defaultUnitType,
      };
      
      // Optional fields
      if (parts[3]) item.sku = parts[3];
      if (parts[4]) item.defaultPrice = parts[4]; // Keep as string
      if (parts[5]) item.description = parts[5];
      
      // Add location associations to each item
      if (useCurrentLocation) {
        if (user?.currentStoreId) item.storeIds = [user.currentStoreId];
        if (user?.currentWarehouseId) item.warehouseIds = [user.currentWarehouseId];
      } else {
        if (selectedStores.length > 0) item.storeIds = selectedStores;
        if (selectedWarehouses.length > 0) item.warehouseIds = selectedWarehouses;
      }
      
      return item;
    }).filter((item: any) => item.name); // Remove empty items

    if (items.length === 0) {
      Alert.alert('Error', 'No valid items found');
      return;
    }

    onSave(items);
    // Note: Form will be reset when modal closes via useEffect
  };
  
  const resetForm = () => {
    setBulkText('');
    setUseCurrentLocation(true);
    setSelectedStores([]);
    setSelectedWarehouses([]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Bulk Add Items</Text>
          </View>
          <View style={styles.spacer} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Enter one item per line. Formats:{'\n'}
              • Name{'\n'}
              • Name, Category, Unit{'\n'}
              • Name, Category, Unit, SKU, Price
            </Text>
          </View>

          {/* Location Association Section - Applies to All Items */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Apply to All Items</Text>
            <Text style={styles.sectionSubtitle}>
              Location association will be applied to all items below
            </Text>
            
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabel}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <Text style={styles.toggleText}>Use my current location</Text>
              </View>
              <Switch
                value={useCurrentLocation}
                onValueChange={setUseCurrentLocation}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>
            
            {!useCurrentLocation && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Stores (Optional)</Text>
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={handleSelectStores}
                  >
                    <Text style={styles.selectButtonText}>
                      {selectedStores.length > 0 
                        ? `${selectedStores.length} store(s) selected` 
                        : 'Select stores'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Warehouses (Optional)</Text>
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={handleSelectWarehouses}
                  >
                    <Text style={styles.selectButtonText}>
                      {selectedWarehouses.length > 0 
                        ? `${selectedWarehouses.length} warehouse(s) selected` 
                        : 'Select warehouses'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.hint}>
              {useCurrentLocation 
                ? '💡 Items will be added to your current store/warehouse' 
                : '💡 Leave empty to add without location association'}
            </Text>
          </View>

          {/* Bulk Text Input */}
          <Text style={styles.label}>Items (one per line)</Text>
          <TextInput
            style={styles.textArea}
            value={bulkText}
            onChangeText={setBulkText}
            placeholder={'Apples, Food, lb, APL-001, 2.99\nBananas, Food, lb, BAN-001, 1.49\nMilk, Beverages, gal, MLK-001, 4.99'}
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={8}
          />

          {/* Default Values */}
          <Text style={styles.sectionTitle}>Default Values</Text>
          <Text style={styles.sectionSubtitle}>
            Used for items without category/unit specified
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Default Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={defaultCategory}
                onValueChange={setDefaultCategory}
                style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                itemStyle={styles.pickerItem}
              >
                {CATEGORIES.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Default Unit Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={defaultUnitType}
                onValueChange={setDefaultUnitType}
                style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                itemStyle={styles.pickerItem}
              >
                {UNIT_TYPES.map((unit) => (
                  <Picker.Item key={unit} label={unit} value={unit} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Bottom padding for fixed buttons */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Fixed bottom buttons */}
        <View style={styles.bottomActions}>
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
}

const styles = StyleSheet.create({
  // Full-screen container
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Header with back button
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  
  spacer: {
    width: 40,
  },
  
  // Scrollable content area
  content: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  
  // Info box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.lightBlue,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
  },
  
  // Form fields
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: 'white',
    minHeight: 150,
    maxHeight: 250,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 4,
  },
  
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  
  inputGroup: {
    marginBottom: 16,
  },
  
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 4,
  },
  
  // For Android
  pickerAndroid: {
    height: 50,
    width: '100%',
    color: Colors.text,
  },
  
  // For iOS
  pickerIOS: {
    height: 150,
    width: '100%',
  },
  
  pickerItem: {
    fontSize: 16,
    color: Colors.text,
  },
  
  // Location section styles
  locationSection: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
    marginBottom: 12,
  },
  
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  toggleText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginTop: 4,
  },
  
  selectButtonText: {
    fontSize: 15,
    color: Colors.text,
  },
  
  hint: {
    fontSize: 13,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  // Fixed bottom action buttons
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: 'center',
  },
  
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
