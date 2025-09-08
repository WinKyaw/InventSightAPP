import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../../constants/Styles';

interface OCRScannerProps {
  visible: boolean;
  onClose: () => void;
  onOCRResult: (items: Array<{ name: string; price: number; quantity: number }>) => void;
}

export function OCRScanner({ visible, onClose, onOCRResult }: OCRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to select images.');
      return false;
    }

    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera permissions to take photos.');
      return false;
    }

    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        await processImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', error);
    }
  };

  const handlePickFromGallery = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        await processImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
      console.error('Gallery error:', error);
    }
  };

  const processImage = async (imageUri: string) => {
    setIsProcessing(true);
    setPreviewText(null);
    
    try {
      const ocrText = await sendImageForOCR(imageUri);
      setPreviewText(ocrText);
    } catch (error) {
      Alert.alert('OCR Error', 'Failed to process image. Please try again.');
      console.error('OCR error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendImageForOCR = async (imageUri: string): Promise<string> => {
    // Create form data for the image
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'receipt.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    // Make the API call to Myanmar OCR endpoint
    const response = await fetch('/api/ocr/myanmar', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status}`);
    }

    const ocrText = await response.text();
    return ocrText;
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
    setSelectedImage(null);
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
                  Take a photo of a receipt or select from gallery to automatically extract items and prices
                </Text>
                
                <View style={styles.scannerOptionsContainer}>
                  <TouchableOpacity
                    style={[styles.scannerOptionButton]}
                    onPress={handleTakePhoto}
                  >
                    <Ionicons name="camera" size={20} color="#6B7280" />
                    <Text style={styles.scannerOptionText}>Take Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.scannerOptionButton]}
                    onPress={handlePickFromGallery}
                  >
                    <Ionicons name="images" size={20} color="#6B7280" />
                    <Text style={styles.scannerOptionText}>From Gallery</Text>
                  </TouchableOpacity>
                </View>
                
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
                {selectedImage && (
                  <View style={{ marginBottom: 16, alignItems: 'center' }}>
                    <Image 
                      source={{ uri: selectedImage }} 
                      style={{ 
                        width: '100%', 
                        height: 200, 
                        borderRadius: 8, 
                        resizeMode: 'contain',
                        backgroundColor: '#f5f5f5'
                      }} 
                    />
                  </View>
                )}
                
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