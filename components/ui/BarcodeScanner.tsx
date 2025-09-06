import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../constants/Styles';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanResult: (data: { name: string; price: string }) => void;
}

export function BarcodeScanner({ visible, onClose, onScanResult }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);

  // Mock barcode data for different products
  const mockBarcodes = [
    { name: 'Coffee Premium Blend', price: '4.50' },
    { name: 'Energy Drink 16oz', price: '2.99' },
    { name: 'Protein Bar Chocolate', price: '3.25' },
    { name: 'Sandwich Turkey Club', price: '8.99' },
    { name: 'Fresh Croissant', price: '3.75' },
    { name: 'Organic Green Tea', price: '3.25' },
    { name: 'Blueberry Muffin', price: '2.99' },
    { name: 'Bottled Water 500ml', price: '1.50' },
    { name: 'Granola Yogurt Cup', price: '4.25' },
    { name: 'Fresh Bagel Everything', price: '2.50' },
  ];

  const handleScanBarcode = () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      const randomProduct = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      setIsScanning(false);
      onScanResult(randomProduct);
      onClose();
      
      Alert.alert(
        'Product Scanned!',
        `Found: ${randomProduct.name} - $${randomProduct.price}`,
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  const handleManualEntry = () => {
    // For demonstration, allow manual barcode entry
    Alert.prompt(
      'Manual Barcode Entry',
      'Enter a product code (or leave empty for random product):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: (code) => {
            const randomProduct = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
            onScanResult(randomProduct);
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.scannerContainer}>
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>Barcode Scanner</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.scannerContent}>
              <View style={styles.scannerViewfinder}>
                <Ionicons 
                  name="scan" 
                  size={80} 
                  color={isScanning ? "#F59E0B" : "#6B7280"} 
                />
                {isScanning && (
                  <View style={styles.scanningIndicator}>
                    <View style={styles.scanLine} />
                  </View>
                )}
              </View>
              
              <Text style={styles.scannerInstructions}>
                {isScanning 
                  ? 'Scanning barcode...' 
                  : 'Point the camera at a product barcode to scan'
                }
              </Text>
              
              {!isScanning && (
                <View style={styles.scannerActions}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary]}
                    onPress={handleScanBarcode}
                  >
                    <Ionicons name="camera" size={20} color="white" />
                    <Text style={styles.buttonText}>Start Scan</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handleManualEntry}
                  >
                    <Ionicons name="keypad" size={20} color="#6B7280" />
                    <Text style={styles.buttonSecondaryText}>Manual Entry</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.scannerTips}>
                <Text style={styles.scannerTipsTitle}>Tips for better scanning:</Text>
                <Text style={styles.scannerTip}>• Hold device steady and straight</Text>
                <Text style={styles.scannerTip}>• Ensure good lighting</Text>
                <Text style={styles.scannerTip}>• Keep barcode within the viewfinder</Text>
                <Text style={styles.scannerTip}>• Try different angles if needed</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default BarcodeScanner;