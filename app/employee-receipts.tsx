import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ReceiptService from '../services/api/receiptService';
import DatePicker from '../components/ui/DatePicker';
import { Receipt } from '../types';
import { ReceiptDetailsModal } from '../components/modals/ReceiptDetailsModal';

export default function EmployeeReceiptsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const employeeId = params.employeeId as string;
  const employeeName = params.employeeName as string;
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  
  useEffect(() => {
    loadEmployeeReceipts();
  }, [selectedDate]);
  
  const loadEmployeeReceipts = async () => {
    try {
      setLoading(true);
      
      // Format date for API (YYYY-MM-DD)
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Call API to get employee receipts for selected date
      const data = await ReceiptService.getReceiptsByEmployeeAndDate(
        employeeId,
        dateStr
      );
      
      setReceipts(data);
    } catch (error) {
      console.error('Error loading employee receipts:', error);
      // On error, just show empty list
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const renderReceipt = ({ item }: { item: Receipt }) => (
    <TouchableOpacity
      style={styles.receiptCard}
      onPress={() => {
        setSelectedReceipt(item);
        setShowReceiptDetails(true);
      }}
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
          {item.createdAt 
            ? new Date(item.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            : item.dateTime
            ? new Date(item.dateTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'N/A'}
        </Text>
        <Text style={styles.receiptItems}>
          {item.items?.length || 0} items
        </Text>
        <Text style={styles.receiptPayment}>
          {item.paymentMethod || 'N/A'}
        </Text>
      </View>
      
      {item.customerName && (
        <Text style={styles.receiptCustomer}>
          Customer: {item.customerName}
        </Text>
      )}
    </TouchableOpacity>
  );
  
  const getTotalSales = () => {
    return receipts.reduce((sum, receipt) => 
      sum + (receipt.totalAmount || receipt.total || 0), 0
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#8B5CF6" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{employeeName}'s Receipts</Text>
          <Text style={styles.subtitle}>View sales history</Text>
        </View>
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
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      ) : receipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Receipts Found</Text>
          <Text style={styles.emptyText}>
            No receipts found for {selectedDate.toLocaleDateString('en-US', {
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
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        />
      )}
      
      {/* Summary Footer */}
      {!loading && receipts.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>
            {receipts.length} {receipts.length === 1 ? 'receipt' : 'receipts'}
          </Text>
          <Text style={styles.footerTotal}>
            Total: ${getTotalSales().toFixed(2)}
          </Text>
        </View>
      )}

      {/* Receipt Details Modal */}
      <ReceiptDetailsModal
        visible={showReceiptDetails}
        onClose={() => {
          setShowReceiptDetails(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 2,
  },
  dateSelector: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    marginBottom: 12,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  receiptTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  receiptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
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
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
});
