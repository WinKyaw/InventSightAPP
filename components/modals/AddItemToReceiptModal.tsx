// components/modals/AddItemToReceiptModal.tsx
import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useItems } from '../../context/ItemsContext';
import { useReceipt } from '../../context/ReceiptContext';
import SearchBar from '../ui/SearchBar';
import { Item } from '../../constants/types';

interface AddItemToReceiptModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddItemToReceiptModal: React.FC<AddItemToReceiptModalProps> = ({
  visible,
  onClose,
}) => {
  const { items } = useItems();
  const { addItemToReceipt, receiptItems } = useReceipt();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // Check if item is already in receipt
  const isItemInReceipt = (itemId: number) => {
    return receiptItems.some(receiptItem => receiptItem.id === itemId);
  };

  // Get quantity of item in receipt
  const getReceiptItemQuantity = (itemId: number) => {
    const receiptItem = receiptItems.find(ri => ri.id === itemId);
    return receiptItem?.quantity || 0;
  };

  const handleAddItem = (item: Item) => {
    if (item.quantity <= 0) {
      Alert.alert('Out of Stock', `${item.name} is currently out of stock.`);
      return;
    }

    const receiptQuantity = getReceiptItemQuantity(item.id);
    if (receiptQuantity >= item.quantity) {
      Alert.alert('Maximum Quantity', `All available ${item.name} are already in the receipt.`);
      return;
    }

    addItemToReceipt(item, 1);
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const renderItem = ({ item }: { item: Item }) => {
    const inReceipt = isItemInReceipt(item.id);
    const receiptQuantity = getReceiptItemQuantity(item.id);
    const availableQuantity = item.quantity - receiptQuantity;
    const isOutOfStock = availableQuantity <= 0;

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDetails}>
            ${item.price.toFixed(2)} • {item.category}
          </Text>
          <Text style={styles.itemDetails}>
            Stock: {item.quantity}
            {inReceipt && (
              <Text style={styles.inReceiptText}>
                {' '} • {receiptQuantity} in receipt
              </Text>
            )}
          </Text>
        </View>
        
        <View style={styles.itemActions}>
          {isOutOfStock ? (
            <View style={styles.outOfStockButton}>
              <Text style={styles.outOfStockText}>No Stock</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddItem(item)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Items to Receipt</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <SearchBar
          placeholder="Search items by name or category..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        <View style={styles.itemCount}>
          <Text style={styles.itemCountText}>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} available
          </Text>
        </View>

        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Items Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? "Try adjusting your search terms"
                  : "No items available in inventory"}
              </Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  itemCount: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemCountText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  inReceiptText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  itemActions: {
    marginLeft: 16,
  },
  addButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 20,
    padding: 8,
  },
  outOfStockButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  outOfStockText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AddItemToReceiptModal;