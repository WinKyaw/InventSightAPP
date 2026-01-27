import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import { TransferStatus, TransferFilters as ITransferFilters } from '../../types/transfer';
import { Colors } from '../../constants/Colors';

interface TransferFiltersProps {
  filters: ITransferFilters;
  onApply: (filters: ITransferFilters) => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { label: 'All', value: 'ALL' as const },
  { label: 'Pending', value: TransferStatus.PENDING },
  { label: 'Approved', value: TransferStatus.APPROVED },
  { label: 'In Transit', value: TransferStatus.IN_TRANSIT },
  { label: 'Delivered', value: TransferStatus.DELIVERED },
  { label: 'Received', value: TransferStatus.RECEIVED },
  { label: 'Completed', value: TransferStatus.COMPLETED },
  { label: 'Rejected', value: TransferStatus.REJECTED },
  { label: 'Cancelled', value: TransferStatus.CANCELLED },
];

export function TransferFilters({ filters, onApply, onClear }: TransferFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ITransferFilters>(filters);
  const [startDate, setStartDate] = useState<Date | null>(
    filters.fromDate ? new Date(filters.fromDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    filters.toDate ? new Date(filters.toDate) : null
  );

  const handleStatusChange = (status: TransferStatus | 'ALL') => {
    setLocalFilters({ ...localFilters, status });
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    setLocalFilters({
      ...localFilters,
      fromDate: date ? date.toISOString() : undefined,
    });
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    setLocalFilters({
      ...localFilters,
      toDate: date ? date.toISOString() : undefined,
    });
  };

  const handleSearchChange = (text: string) => {
    setLocalFilters({ ...localFilters, searchQuery: text });
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({
      status: 'ALL',
      searchQuery: '',
    });
    setStartDate(null);
    setEndDate(null);
    onClear();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Search</Text>
          <Input
            placeholder="Search by item name or transfer ID..."
            value={localFilters.searchQuery || ''}
            onChangeText={handleSearchChange}
            showValidationIcon={false}
          />
        </View>

        {/* Status Filter */}
        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusScrollContent}
          >
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusChip,
                  (localFilters.status || 'ALL') === option.value && styles.statusChipActive,
                ]}
                onPress={() => handleStatusChange(option.value)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    (localFilters.status || 'ALL') === option.value &&
                      styles.statusChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Date Range Filter */}
        <View style={styles.section}>
          <Text style={styles.label}>Date Range</Text>
          <View style={styles.dateRow}>
            <View style={styles.datePickerWrapper}>
              <DatePicker
                label="From"
                value={startDate}
                onChange={handleStartDateChange}
                placeholder="Start date"
                maximumDate={endDate || undefined}
              />
            </View>
            <View style={styles.datePickerWrapper}>
              <DatePicker
                label="To"
                value={endDate}
                onChange={handleEndDateChange}
                placeholder="End date"
                minimumDate={startDate || undefined}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="refresh-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <Button
            title="Apply Filters"
            onPress={handleApply}
            color={Colors.primary}
            style={styles.applyButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  scrollView: {
    maxHeight: 500,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  statusScrollContent: {
    paddingVertical: 4,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  statusChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusChipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: Colors.white,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerWrapper: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  applyButton: {
    flex: 2,
  },
});
