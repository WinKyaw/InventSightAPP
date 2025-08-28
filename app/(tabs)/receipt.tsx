import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReceipt } from '../../context/ReceiptContext';
import { useItems } from '../../context/ItemsContext';
import { Header } from '../../components/shared/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AddItemToReceiptModal } from '../../components/modals/AddItemToReceiptModal';
import { styles } from '../../constants/Styles';

export default function ReceiptScreen() {
  const { 
    receiptItems, 
    customerName, 
    loading,
    error,
    submitting,
    setCustomerName,
    updateReceiptItemQuantity, 
    removeItemFromReceipt,
    calculateTotal,
    calculateTax,
    handleSubmitReceipt,
    useApiIntegration,
    setUseApiIntegration
  } = useReceipt();
  
  const [showAddToReceipt, setShowAddToReceipt] = useState(false);
  const [customerNameError, setCustomerNameError] = useState('');

  const subtotal = calculateTotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  const validateCustomerName = (name: string): boolean => {
    if (name.length > 50) {
      setCustomerNameError('Customer name must be less than 50 characters');
      return false;
    }
    if (name.trim() !== name) {
      setCustomerNameError('Customer name cannot start or end with spaces');
      return false;
    }
    setCustomerNameError('');
    return true;
  };

  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    if (name.length > 0) {
      validateCustomerName(name);
    } else {
      setCustomerNameError('');
    }
  };

  const getCurrentDateTime = () => {
    return '2025-08-25 01:34:29';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F59E0B" barStyle="light-content" />
      
      <Header 
        title="Create Receipt"
        subtitle="Point of Sale Transaction"
        backgroundColor="#F59E0B"
      />

      <ScrollView style={styles.receiptContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.receiptInfoCard}>
          <View style={styles.receiptInfoRow}>
            <View style={styles.receiptInfoItem}>
              <Ionicons name="calendar-outline" size={16} color="#F59E0B" />
              <Text style={styles.receiptInfoLabel}>Date & Time (UTC)</Text>
            </View>
            <Text style={styles.receiptInfoValue}>{getCurrentDateTime()}</Text>
          </View>

          <View style={styles.receiptInfoRow}>
            <View style={styles.receiptInfoItem}>
              <Ionicons name="person-outline" size={16} color="#F59E0B" />
              <Text style={styles.receiptInfoLabel}>Cashier</Text>
            </View>
            <Text style={styles.receiptInfoValue}>WinKyaw</Text>
          </View>

          <View style={styles.customerInputSection}>
            <Text style={styles.customerInputLabel}>Customer Name (Optional)</Text>
            <Input
              placeholder="Enter customer name or leave blank for walk-in"
              value={customerName}
              onChangeText={handleCustomerNameChange}
              style={styles.customerInput}
              maxLength={50}
            />
            {customerNameError ? (
              <View style={styles.fieldErrorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.fieldErrorText}>{customerNameError}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.addItemToReceiptButton}
          onPress={() => setShowAddToReceipt(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addItemToReceiptText}>Add Items to Receipt</Text>
        </TouchableOpacity>

        {receiptItems.length > 0 && (
          <View style={styles.receiptItemsCard}>
            <Text style={styles.receiptItemsTitle}>Items in Receipt</Text>
            
            {receiptItems.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.receiptItem}>
                <View style={styles.receiptItemInfo}>
                  <Text style={styles.receiptItemName}>{item.name}</Text>
                  <Text style={styles.receiptItemPrice}>${item.price.toFixed(2)} each</Text>
                </View>
                
                <View style={styles.receiptItemControls}>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateReceiptItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color="#F59E0B" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateReceiptItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color="#F59E0B" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.receiptItemTotal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.removeItemButton}
                    onPress={() => removeItemFromReceipt(item.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.receiptTotals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (8%):</Text>
                <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            <Button
              title={submitting ? "Processing..." : "Complete Transaction"}
              onPress={handleSubmitReceipt}
              disabled={submitting || receiptItems.length === 0}
              color="#10B981"
              style={styles.submitReceiptButton}
            />

            {/* API Integration Toggle for Development */}
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.apiToggleButton}
                onPress={() => setUseApiIntegration(!useApiIntegration)}
              >
                <Text style={styles.apiToggleText}>
                  API Integration: {useApiIntegration ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        )}

        {receiptItems.length === 0 && (
          <View style={styles.emptyReceiptCard}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyReceiptTitle}>No Items Added</Text>
            <Text style={styles.emptyReceiptText}>
              Tap "Add Items to Receipt" to start creating a transaction
            </Text>
          </View>
        )}
      </ScrollView>

      <AddItemToReceiptModal 
        visible={showAddToReceipt}
        onClose={() => setShowAddToReceipt(false)}
      />
    </SafeAreaView>
  );
}