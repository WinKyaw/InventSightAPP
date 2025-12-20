import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import ReceiptService from '../services/api/receiptService';
import DatePicker from '../components/ui/DatePicker';
import { Receipt } from '../types';

export default function EmployeeReceiptsScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const employeeId = params.employeeId as string;
  const employeeName = params.employeeName as string;
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Check if user is GM+ (case-insensitive)
  const userRoleUpper = user?.role?.toUpperCase();
  const isGMPlus = userRoleUpper === 'OWNER' ||
                   userRoleUpper === 'GENERAL_MANAGER' || 
                   userRoleUpper === 'CEO' || 
                   userRoleUpper === 'FOUNDER' ||
                   userRoleUpper === 'ADMIN';

  // Only GM+ should access this screen
  useEffect(() => {
    if (!isGMPlus) {
      console.log('🔐 Employee Receipts: Access denied for role:', user?.role);
      Alert.alert('Access Denied', 'You do not have permission to view employee receipts');
      router.back();
    }
  }, [isGMPlus, user?.role, router]);

  useEffect(() => {
    console.log('🔍 Employee Receipts Screen mounted');
    console.log('👤 Employee ID:', employeeId);
    console.log('👤 Employee Name:', employeeName);
    
    if (!employeeId) {
      Alert.alert('Error', 'Employee ID is missing');
      router.back();
      return;
    }
    
    loadEmployeeReceipts();
  }, [selectedDate, employeeId]);

  const loadEmployeeReceipts = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading receipts...');
      
      // Format date as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      console.log('📅 Formatted date:', dateStr);
      
      const data = await ReceiptService.getReceiptsByEmployeeAndDate(
        employeeId,
        dateStr
      );
      
      console.log('✅ Loaded receipts:', data.length);
      setReceipts(data);
    } catch (error: any) {
      console.error('❌ Error loading employee receipts:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to load receipts';
      
      Alert.alert('Error', errorMessage);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };
  const getTotalSales = () => {
    return receipts.reduce((sum, receipt) => 
      sum + (receipt.totalAmount || receipt.total || 0), 0
    );
  };

  const handleReceiptPress = (receipt: Receipt) => {
    console.log('🧾 Opening receipt:', receipt.id);
    // Navigate to receipt details
    router.push({
      pathname: '/(tabs)/receipt',
      params: { 
        selectedReceiptId: receipt.id,
        tab: 'history',
      },
    });
  };

  const renderReceipt = ({ item }: { item: Receipt }) => {
    // Safely get the date/time value
    const dateValue = item.createdAt || item.dateTime;
    const timeString = dateValue 
      ? new Date(dateValue).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'N/A';
    
    return (
      <TouchableOpacity
        style={styles.receiptCard}
        onPress={() => handleReceiptPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptNumber}>
            {item.receiptNumber || `#${item.id}`}
          </Text>
          <Text style={styles.receiptTotal}>
            ${(item.totalAmount || item.total || 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.receiptDetails}>
          <Text style={styles.receiptTime}>
            {timeString}
          </Text>
          <Text style={styles.receiptItems}>
            {item.items?.length || 0} items
          </Text>
          <Text style={styles.receiptPayment}>
            {item.paymentMethod || 'CASH'}
          </Text>
        </View>

        {item.customerName && (
          <Text style={styles.receiptCustomer}>
            👤 {item.customerName}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButtonContainer}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{employeeName}'s Receipts</Text>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <View style={styles.datePickerContainer}>
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date || new Date())}
            placeholder="Select Date"
          />
        </View>

        <View style={styles.dateSummary}>
          <Text style={styles.dateSummaryLabel}>Total Sales:</Text>
          <Text style={styles.dateSummaryValue}>
            ${getTotalSales().toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Receipts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      ) : receipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>
            No receipts found for{'\n'}
            {selectedDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          renderItem={renderReceipt}
          keyExtractor={(item, index) => item.id?.toString() || `receipt-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {receipts.length} {receipts.length === 1 ? 'receipt' : 'receipts'} found
            </Text>
          }
        />
      )}

      {/* Summary Footer */}
      {!loading && receipts.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerStat}>
            <Text style={styles.footerLabel}>Receipts</Text>
            <Text style={styles.footerValue}>{receipts.length}</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerStat}>
            <Text style={styles.footerLabel}>Total Sales</Text>
            <Text style={styles.footerValue}>
              ${getTotalSales().toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF9500',
    padding: 16,
    paddingTop: 48,
  },
  backButtonContainer: {
    marginBottom: 8,
  },
  backButton: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  dateSelector: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  datePickerContainer: {
    marginBottom: 12,
  },
  dateSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  listHeader: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  receiptCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  receiptTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  receiptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  receiptTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  receiptItems: {
    fontSize: 14,
    color: '#6B7280',
  },
  receiptPayment: {
    fontSize: 14,
    color: '#6B7280',
  },
  receiptCustomer: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  footerStat: {
    flex: 1,
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  footerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
});
