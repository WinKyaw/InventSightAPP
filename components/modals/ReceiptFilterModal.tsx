import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import DatePicker from '../ui/DatePicker';

export interface ReceiptFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  createdBy?: { id: string; name: string } | null;
  fulfilledBy?: { id: string; name: string } | null;
  deliveredBy?: { id: string; name: string } | null;
  status?: string[];
  paymentMethod?: string[];
  receiptType?: string[];
  customerFilter?: string;
}

interface ReceiptFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: ReceiptFilters;
  onApply: (filters: ReceiptFilters) => void;
  onClear: () => void;
  onOpenEmployeePicker: (type: 'createdBy' | 'fulfilledBy' | 'deliveredBy') => void;
}

export const ReceiptFilterModal: React.FC<ReceiptFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  onClear,
  onOpenEmployeePicker,
}) => {
  const [localFilters, setLocalFilters] = useState<ReceiptFilters>(filters);

  // Sync local filters with parent filters when visible or filters change
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const toggleArrayFilter = (
    filterKey: 'status' | 'paymentMethod' | 'receiptType',
    value: string
  ) => {
    const currentValues = localFilters[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    
    setLocalFilters({
      ...localFilters,
      [filterKey]: newValues,
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({
      startDate: null,
      endDate: null,
      createdBy: null,
      fulfilledBy: null,
      deliveredBy: null,
      status: [],
      paymentMethod: [],
      receiptType: [],
      customerFilter: '',
    });
    onClear();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter Receipts</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Date Range Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Date Range</Text>
            
            <View style={styles.datePickerContainer}>
              <DatePicker
                label="Start Date"
                value={localFilters.startDate}
                onChange={(date) => setLocalFilters({ ...localFilters, startDate: date })}
                placeholder="Any date"
              />
            </View>
            
            <View style={styles.datePickerContainer}>
              <DatePicker
                label="End Date"
                value={localFilters.endDate}
                onChange={(date) => setLocalFilters({ ...localFilters, endDate: date })}
                placeholder="Any date"
                minimumDate={localFilters.startDate || undefined}
              />
            </View>
          </View>

          {/* Created By Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Created By</Text>
            <TouchableOpacity
              style={styles.employeeSelect}
              onPress={() => onOpenEmployeePicker('createdBy')}
            >
              <Text style={styles.employeeSelectText}>
                {localFilters.createdBy?.name || 'Any Employee'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Fulfilled By Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Fulfilled By</Text>
            <TouchableOpacity
              style={styles.employeeSelect}
              onPress={() => onOpenEmployeePicker('fulfilledBy')}
            >
              <Text style={styles.employeeSelectText}>
                {localFilters.fulfilledBy?.name || 'Any Employee'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Delivered By Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚚 Delivered By</Text>
            <TouchableOpacity
              style={styles.employeeSelect}
              onPress={() => onOpenEmployeePicker('deliveredBy')}
            >
              <Text style={styles.employeeSelectText}>
                {localFilters.deliveredBy?.name || 'Any Employee'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Status Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Status</Text>
            <View style={styles.chipGroup}>
              {['COMPLETED', 'REFUNDED', 'CANCELLED'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.chip,
                    localFilters.status?.includes(status) && styles.chipActive,
                  ]}
                  onPress={() => toggleArrayFilter('status', status)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilters.status?.includes(status) && styles.chipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Method Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Payment Method</Text>
            <View style={styles.chipGroup}>
              {['CASH', 'CARD', 'MOBILE', 'OTHER'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.chip,
                    localFilters.paymentMethod?.includes(method) && styles.chipActive,
                  ]}
                  onPress={() => toggleArrayFilter('paymentMethod', method)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilters.paymentMethod?.includes(method) && styles.chipTextActive,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Receipt Type Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Receipt Type</Text>
            <View style={styles.chipGroup}>
              {['IN_STORE', 'DELIVERY', 'PICKUP'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    localFilters.receiptType?.includes(type) && styles.chipActive,
                  ]}
                  onPress={() => toggleArrayFilter('receiptType', type)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      localFilters.receiptType?.includes(type) && styles.chipTextActive,
                    ]}
                  >
                    {type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Customer Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Customer</Text>
            <TextInput
              style={styles.customerInput}
              placeholder="Search by customer name, email, or phone"
              value={localFilters.customerFilter || ''}
              onChangeText={(text) =>
                setLocalFilters({ ...localFilters, customerFilter: text })
              }
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  datePickerContainer: {
    marginBottom: 12,
  },
  employeeSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  employeeSelectText: {
    fontSize: 15,
    color: '#374151',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#F59E0B',
  },
  customerInput: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    fontSize: 15,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
