import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ChipProps {
  label: string;
  onRemove?: () => void;
  color?: string;
}

export const Chip: React.FC<ChipProps> = ({ label, onRemove, color = '#F59E0B' }) => {
  return (
    <View style={[styles.chip, { backgroundColor: `${color}20`, borderColor: color }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="close-circle" size={18} color={color} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  removeButton: {
    marginLeft: 4,
  },
});
