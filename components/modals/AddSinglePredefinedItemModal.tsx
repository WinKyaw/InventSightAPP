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

interface SingleItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: PredefinedItemRequest) => void;
}

const CATEGORIES = ['Food', 'Beverages', 'Electronics', 'Clothing', 'Supplies', 'Other'];
const UNIT_TYPES = ['pcs', 'kg', 'lb', 'liters', 'gal', 'oz', 'boxes'];

export function AddSinglePredefinedItemModal({ visible, onClose, onSave }: SingleItemModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [unitType, setUnitType] = useState('pcs');
  const [sku, setSku] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [description, setDescription] = useState('');
  
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
    // Simple alert-based multi-select
    const storeOptions = stores.map(s => s.storeName).join('\n');
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
          onPress: () => setSelectedStores(stores.map(s => s.id))
        },
        { text: 'OK' }
      ]
    );
  };
  
  const handleSelectWarehouses = () => {
    // Simple alert-based multi-select
    const warehouseOptions = warehouses.map(w => w.name).join('\n');
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
          onPress: () => setSelectedWarehouses(warehouses.map(w => w.id))
        },
        { text: 'OK' }
      ]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    // Validate price if provided
    let price: number | undefined = undefined;
    if (defaultPrice) {
      const parsedPrice = parseFloat(defaultPrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        Alert.alert('Error', 'Please enter a valid price (must be a positive number)');
        return;
      }
      price = parsedPrice;
    }

    const item: PredefinedItemRequest = {
      name: name.trim(),
      category,
      unitType,
      sku: sku.trim() || undefined,
      defaultPrice: price,
      description: description.trim() || undefined,
      
      // Add location associations
      storeIds: useCurrentLocation 
        ? (user?.currentStoreId ? [user.currentStoreId] : undefined)
        : (selectedStores.length > 0 ? selectedStores : undefined),
        
      warehouseIds: useCurrentLocation
        ? (user?.currentWarehouseId ? [user.currentWarehouseId] : undefined)
        : (selectedWarehouses.length > 0 ? selectedWarehouses : undefined),
    };

    onSave(item);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCategory('Food');
    setUnitType('pcs');
    setSku('');
    setDefaultPrice('');
    setDescription('');
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
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Single Item</Text>
          <View style={{ width: 24 }} /> {/* Spacer */}
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Item Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Item Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Apples, Milk, Coffee"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                itemStyle={styles.pickerItem}
              >
                {CATEGORIES.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Unit Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Unit Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={unitType}
                onValueChange={setUnitType}
                style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                itemStyle={styles.pickerItem}
              >
                {UNIT_TYPES.map((unit) => (
                  <Picker.Item key={unit} label={unit} value={unit} />
                ))}
              </Picker>
            </View>
          </View>

          {/* SKU (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKU (Optional)</Text>
            <TextInput
              style={styles.input}
              value={sku}
              onChangeText={setSku}
              placeholder="e.g., APL-001"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Default Price (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Default Price (Optional)</Text>
            <TextInput
              style={styles.input}
              value={defaultPrice}
              onChangeText={setDefaultPrice}
              placeholder="e.g., 2.99"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Description (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes or description"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Location Association Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location Association (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Specify where this item will be available
            </Text>
          </View>

          {/* Use Current Location Toggle */}
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
              {/* Store Selection */}
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

              {/* Warehouse Selection */}
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
              ? '💡 Item will be added to your current store/warehouse' 
              : '💡 Leave empty to add without location association'}
          </Text>
        </ScrollView>

        {/* Fixed bottom buttons */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Item</Text>
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
  
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  
  // Scrollable content area
  content: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  
  inputGroup: {
    marginBottom: 16,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  
  required: {
    color: Colors.error,
  },
  
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: 'white',
  },
  
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: 'white',
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
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    marginBottom: 16,
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
  },
  
  selectButtonText: {
    fontSize: 15,
    color: Colors.text,
  },
  
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 16,
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
