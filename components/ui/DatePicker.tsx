import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../constants/Styles';

interface DatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  mode?: 'date' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  mode = 'date',
  minimumDate,
  maximumDate
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());

  const formatDate = (date: Date | null) => {
    if (!date) return placeholder;
    
    if (mode === 'date') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value || new Date());
    setShowPicker(false);
  };

  // Simple date selector for cross-platform compatibility
  const renderDateSelector = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const selectedYear = tempDate.getFullYear();
    const selectedMonth = tempDate.getMonth();
    const selectedDay = tempDate.getDate();

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const validDays = days.slice(0, daysInMonth);

    return (
      <View style={styles.datePickerContainer}>
        <Text style={styles.datePickerTitle}>Select {mode === 'date' ? 'Date' : 'Date & Time'}</Text>
        
        <View style={styles.datePickerSelectors}>
          {/* Year Selector */}
          <View style={styles.datePickerSelector}>
            <Text style={styles.datePickerSelectorLabel}>Year</Text>
            <View style={styles.datePickerOptions}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.datePickerOption,
                    selectedYear === year && styles.datePickerOptionSelected
                  ]}
                  onPress={() => setTempDate(new Date(year, selectedMonth, selectedDay))}
                >
                  <Text style={[
                    styles.datePickerOptionText,
                    selectedYear === year && styles.datePickerOptionTextSelected
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Month Selector */}
          <View style={styles.datePickerSelector}>
            <Text style={styles.datePickerSelectorLabel}>Month</Text>
            <View style={styles.datePickerOptions}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.datePickerOption,
                    selectedMonth === index && styles.datePickerOptionSelected
                  ]}
                  onPress={() => setTempDate(new Date(selectedYear, index, selectedDay))}
                >
                  <Text style={[
                    styles.datePickerOptionText,
                    selectedMonth === index && styles.datePickerOptionTextSelected
                  ]}>
                    {month.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Day Selector */}
          <View style={styles.datePickerSelector}>
            <Text style={styles.datePickerSelectorLabel}>Day</Text>
            <View style={styles.datePickerOptions}>
              {validDays.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.datePickerOption,
                    selectedDay === day && styles.datePickerOptionSelected
                  ]}
                  onPress={() => setTempDate(new Date(selectedYear, selectedMonth, day))}
                >
                  <Text style={[
                    styles.datePickerOptionText,
                    selectedDay === day && styles.datePickerOptionTextSelected
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.datePickerActions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleCancel}
          >
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleConfirm}
          >
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, styles.datePickerInput]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[
          styles.datePickerInputText,
          !value && styles.datePickerInputPlaceholder
        ]}>
          {formatDate(value)}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {renderDateSelector()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default DatePicker;