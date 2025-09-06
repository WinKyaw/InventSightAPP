import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../constants/Styles';

interface OCRScannerProps {
  visible: boolean;
  onClose: () => void;
  onOCRResult: (items: Array<{ name: string; price: number; quantity: number }>) => void;
}

export function OCRScanner({ visible, onClose, onOCRResult }: OCRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);

  // Mock OCR results for demonstration
  const mockReceiptTexts = [
    `COFFEE SHOP RECEIPT
---------------------
Coffee Premium      $4.50
Croissant          $3.75
Orange Juice       $2.99
---------------------
SUBTOTAL          $11.24
TAX                $0.90
TOTAL             $12.14`,

    `GROCERY STORE
---------------------
Milk 2% Gallon     $3.49
Bread Whole Wheat  $2.99  
Eggs Dozen         $2.79
Bananas 2 lbs      $1.98
---------------------
TOTAL              $11.25`,

    `RESTAURANT RECEIPT
---------------------
Burger Deluxe      $12.99
Fries Large        $3.99
Soda Refill        $2.49
Apple Pie          $4.99
---------------------
SUBTOTAL          $24.46
TIP               $4.89
TOTAL             $29.35`
  ];

  const handleStartOCR = () => {
    setIsProcessing(true);
    setPreviewText(null);
    
    // Simulate OCR processing delay
    setTimeout(() => {
      const randomReceipt = mockReceiptTexts[Math.floor(Math.random() * mockReceiptTexts.length)];
      setPreviewText(randomReceipt);
      setIsProcessing(false);
    }, 3000);
  };

  const parseReceiptText = (text: string) => {
    const lines = text.split('\n');
    const items: Array<{ name: string; price: number; quantity: number }> = [];
    
    for (const line of lines) {
      // Look for lines with price patterns ($X.XX)
      const priceMatch = line.match(/(.+?)\s+\$(\d+\.?\d*)/);
      if (priceMatch) {
        const name = priceMatch[1].trim();
        const price = parseFloat(priceMatch[2]);
        
        // Skip common receipt footer items
        if (!['SUBTOTAL', 'TAX', 'TOTAL', 'TIP'].includes(name.toUpperCase())) {
          items.push({
            name: name,
            price: price,
            quantity: 1
          });
        }
      }
    }
    
    return items;
  };

  const handleConfirmOCR = () => {
    if (previewText) {
      const parsedItems = parseReceiptText(previewText);
      onOCRResult(parsedItems);
      onClose();
      setPreviewText(null);
      
      Alert.alert(
        'OCR Complete!',
        `Successfully extracted ${parsedItems.length} items from receipt`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRetakePhoto = () => {
    setPreviewText(null);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.ocrContainer}>
          <View style={styles.ocrHeader}>
            <Text style={styles.ocrTitle}>Receipt OCR Scanner</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.ocrContent}>
            {!previewText && !isProcessing && (
              <View style={styles.ocrInitialState}>
                <View style={styles.ocrViewfinder}>
                  <Ionicons name="document-text-outline" size={80} color="#6B7280" />
                </View>
                
                <Text style={styles.ocrInstructions}>
                  Take a photo of a receipt to automatically extract items and prices
                </Text>
                
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleStartOCR}
                >
                  <Ionicons name="camera" size={20} color="white" />
                  <Text style={styles.buttonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <View style={styles.ocrTips}>
                  <Text style={styles.ocrTipsTitle}>Tips for better OCR:</Text>
                  <Text style={styles.ocrTip}>• Ensure receipt is well-lit</Text>
                  <Text style={styles.ocrTip}>• Keep receipt flat and straight</Text>
                  <Text style={styles.ocrTip}>• Include the entire receipt in frame</Text>
                  <Text style={styles.ocrTip}>• Avoid shadows and reflections</Text>
                </View>
              </View>
            )}
            
            {isProcessing && (
              <View style={styles.ocrProcessingState}>
                <View style={styles.ocrProcessingIndicator}>
                  <Ionicons name="scan" size={60} color="#F59E0B" />
                  <View style={styles.ocrProcessingDots}>
                    <View style={styles.ocrProcessingDot} />
                    <View style={styles.ocrProcessingDot} />
                    <View style={styles.ocrProcessingDot} />
                  </View>
                </View>
                
                <Text style={styles.ocrProcessingText}>
                  Processing receipt image...
                </Text>
                <Text style={styles.ocrProcessingSubtext}>
                  This may take a few moments
                </Text>
              </View>
            )}
            
            {previewText && (
              <View style={styles.ocrPreviewState}>
                <Text style={styles.ocrPreviewTitle}>Extracted Text:</Text>
                
                <View style={styles.ocrTextPreview}>
                  <Text style={styles.ocrPreviewText}>{previewText}</Text>
                </View>
                
                <Text style={styles.ocrConfirmInstructions}>
                  Review the extracted text above. If it looks correct, tap "Add Items" to add them to your receipt.
                </Text>
                
                <View style={styles.ocrPreviewActions}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handleRetakePhoto}
                  >
                    <Ionicons name="camera" size={20} color="#6B7280" />
                    <Text style={styles.buttonSecondaryText}>Retake</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary]}
                    onPress={handleConfirmOCR}
                  >
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.buttonText}>Add Items</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default OCRScanner;