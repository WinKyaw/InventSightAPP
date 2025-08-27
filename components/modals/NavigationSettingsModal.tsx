import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../context/NavigationContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Colors } from '../../constants/Colors';

interface NavigationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NavigationSettingsModal({ visible, onClose }: NavigationSettingsModalProps) {
  const { 
    availableOptions, 
    selectedNavItems, 
    updateNavigationPreferences 
  } = useNavigation();
  
  const [selectedItem1, setSelectedItem1] = useState(selectedNavItems[0]);
  const [selectedItem2, setSelectedItem2] = useState(selectedNavItems[1]);

  const handleSave = () => {
    if (selectedItem1.key === selectedItem2.key) {
      Alert.alert('Error', 'Please select two different navigation items');
      return;
    }

    updateNavigationPreferences(selectedItem1, selectedItem2);
    Alert.alert('Success', 'Navigation preferences updated!');
    onClose();
  };

  const getCurrentDateTime = () => {
    return '2025-08-25 08:59:34';
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Customize Navigation">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Navigation Bar Layout</Text>
            <Text style={styles.infoDescription}>
              Choose which 2 screens to display in your navigation bar.{'\n'}
              Layout: Dashboard | Items | Pick 1 | Pick 2 | Menu
            </Text>
          </View>
        </View>

        {/* Current Selection Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Current Navigation Preview</Text>
          <View style={styles.navigationPreview}>
            <View style={[styles.navItem, styles.fixedNavItem]}>
              <Ionicons name="analytics" size={20} color={Colors.primary} />
              <Text style={styles.navItemText}>Dashboard</Text>
            </View>
            <View style={[styles.navItem, styles.fixedNavItem]}>
              <Ionicons name="cube" size={20} color={Colors.success} />
              <Text style={styles.navItemText}>Items</Text>
            </View>
            <View style={[styles.navItem, styles.dynamicNavItem]}>
              <Ionicons name={selectedItem1.icon as any} size={20} color={selectedItem1.color} />
              <Text style={styles.navItemText}>{selectedItem1.title}</Text>
            </View>
            <View style={[styles.navItem, styles.dynamicNavItem]}>
              <Ionicons name={selectedItem2.icon as any} size={20} color={selectedItem2.color} />
              <Text style={styles.navItemText}>{selectedItem2.title}</Text>
            </View>
            <View style={[styles.navItem, styles.fixedNavItem]}>
              <Ionicons name="menu" size={20} color={Colors.gray} />
              <Text style={styles.navItemText}>Menu</Text>
            </View>
          </View>
        </View>

        {/* Selection Section */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Select Position 1 (3rd position)</Text>
          <View style={styles.optionsList}>
            {availableOptions.map((option) => (
              <TouchableOpacity
                key={`pos1-${option.key}`}
                style={[
                  styles.optionItem,
                  selectedItem1.key === option.key && styles.selectedOption
                ]}
                onPress={() => setSelectedItem1(option)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={selectedItem1.key === option.key ? Colors.primary : option.color} 
                />
                <Text style={[
                  styles.optionTitle,
                  selectedItem1.key === option.key && styles.selectedOptionText
                ]}>
                  {option.title}
                </Text>
                {selectedItem1.key === option.key && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Select Position 2 (4th position)</Text>
          <View style={styles.optionsList}>
            {availableOptions.map((option) => (
              <TouchableOpacity
                key={`pos2-${option.key}`}
                style={[
                  styles.optionItem,
                  selectedItem2.key === option.key && styles.selectedOption,
                  selectedItem1.key === option.key && styles.disabledOption
                ]}
                onPress={() => {
                  if (selectedItem1.key !== option.key) {
                    setSelectedItem2(option);
                  }
                }}
                disabled={selectedItem1.key === option.key}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={
                    selectedItem1.key === option.key 
                      ? Colors.lightGray 
                      : selectedItem2.key === option.key 
                        ? Colors.primary 
                        : option.color
                  } 
                />
                <Text style={[
                  styles.optionTitle,
                  selectedItem2.key === option.key && styles.selectedOptionText,
                  selectedItem1.key === option.key && styles.disabledOptionText
                ]}>
                  {option.title}
                  {selectedItem1.key === option.key && ' (Selected for Position 1)'}
                </Text>
                {selectedItem2.key === option.key && selectedItem1.key !== option.key && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* System Info */}
        <View style={styles.systemInfo}>
          <Text style={styles.systemInfoText}>
            🕐 Current Time: {getCurrentDateTime()}{'\n'}
            👤 User: WinKyaw{'\n'}
            🎯 Status: Customizing Navigation
          </Text>
        </View>

        <View style={styles.modalButtons}>
          <Button 
            title="Cancel" 
            onPress={onClose} 
            color="#F3F4F6" 
            textStyle={{ color: '#374151' }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <Button 
            title="Save Changes" 
            onPress={handleSave} 
            color={Colors.success}
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = {
  infoCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  previewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  navigationPreview: {
    flexDirection: 'row' as const,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navItem: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  fixedNavItem: {
    backgroundColor: '#E5E7EB',
  },
  dynamicNavItem: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  navItemText: {
    fontSize: 10,
    marginTop: 4,
    color: Colors.text,
    textAlign: 'center' as const,
  },

  selectionSection: {
    marginBottom: 20,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  disabledOption: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
    marginLeft: 12,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  disabledOptionText: {
    color: Colors.lightGray,
  },

  systemInfo: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  systemInfoText: {
    fontSize: 12,
    color: '#166534',
    textAlign: 'center' as const,
    fontFamily: 'monospace',
    lineHeight: 16,
  },

  modalButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 8,
  },
};