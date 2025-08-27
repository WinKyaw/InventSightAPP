import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useItems } from '../../context/ItemsContext';
import { useReceipt } from '../../context/ReceiptContext';
import { Modal } from '../ui/Modal';
import { styles } from '../../constants/Styles';

interface AddItemToReceiptModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddItemToReceiptModal({ visible, onClose }: AddItemToReceiptModalProps) {
  const { items } = useItems();
  const { receiptItems, addItemToReceipt } = useReceipt();

  const handleAddItem = (item: any) => {
    addItemToReceipt(item, 1);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Add Items to Receipt">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalSubtitle}>Available Items</Text>
        {items.filter(item => item.quantity > 0).length === 0 ? (
          <View style={styles.noItemsContainer}>
            <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
            <Text style={styles.noItemsText}>No items available in inventory</Text>
            <Text style={styles.noItemsSubtext}>Add some items to your inventory first</Text>
          </View>
        ) : (
          items.filter(item => item.quantity > 0).map((item) => {
            const inReceiptQuantity = receiptItems.find(ri => ri.id === item.id)?.quantity || 0;
            const availableQuantity = item.quantity - inReceiptQuantity;
            
            return (
              <View key={item.id} style={styles.addItemRow}>
                <View style={styles.addItemInfo}>
                  <Text style={styles.addItemName}>{item.name}</Text>
                  <Text style={styles.addItemDetails}>
                    ${item.price.toFixed(2)} • {availableQuantity} available
                    {inReceiptQuantity > 0 && (
                      <Text style={styles.inReceiptText}> • {inReceiptQuantity} in receipt</Text>
                    )}
                  </Text>
                </View>
                
                {availableQuantity > 0 ? (
                  <TouchableOpacity 
                    style={styles.addItemButton}
                    onPress={() => handleAddItem(item)}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.outOfStockButton}>
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </Modal>
  );
}