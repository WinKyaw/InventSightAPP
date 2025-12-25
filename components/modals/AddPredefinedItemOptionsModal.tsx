import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface AddOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSingle: () => void;
  onSelectBulk: () => void;
}

export function AddPredefinedItemOptionsModal({ visible, onClose, onSelectSingle, onSelectBulk }: AddOptionsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Items</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Choose how to add items</Text>

          {/* Single Item Option */}
          <TouchableOpacity style={styles.option} onPress={onSelectSingle}>
            <View style={styles.optionIcon}>
              <Ionicons name="add-circle-outline" size={32} color={Colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Single Item</Text>
              <Text style={styles.optionDescription}>
                Add one item with full details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Bulk Add Option */}
          <TouchableOpacity style={styles.option} onPress={onSelectBulk}>
            <View style={styles.optionIcon}>
              <Ionicons name="list-outline" size={32} color={Colors.success} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Bulk Add Items</Text>
              <Text style={styles.optionDescription}>
                Add multiple items at once
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContainer: {
    height: '98%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
