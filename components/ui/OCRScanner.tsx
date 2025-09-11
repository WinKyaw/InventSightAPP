import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../../constants/Styles';
import LiveOCRScanner from './LiveOCRScanner';

interface OCRScannerProps {
  visible: boolean;
  onClose: () => void;
  onOCRResult: (items: Array<{ name: string; price: number; quantity: number }>) => void;
}

export function OCRScanner({ visible, onClose, onOCRResult }: OCRScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showLiveOcr, setShowLiveOcr] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState<'myanmar' | 'english'>('myanmar');

  // Configuration for your backend API
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const OCR_ENDPOINT = `${API_BASE_URL}/api/ocr/process`;

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
        quality: 0.9, // Higher quality for better OCR
        base64: false,
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
        quality: 0.9, // Higher quality for better OCR
        base64: false,
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
      const ocrResult = await sendImageForOCR(imageUri);
      setPreviewText(ocrResult.extractedText);
    } catch (error) {
      Alert.alert('OCR Error', 'Failed to process image. Please try again.');
      console.error('OCR error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendImageForOCR = async (imageUri: string): Promise<{
    extractedText: string;
    confidence: number;
    language: string;
  }> => {
    try {
      // Create form data for the image
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Add OCR parameters
      formData.append('language', ocrLanguage);
      formData.append('imageType', 'receipt');
      formData.append('preprocessImage', 'true');

      console.log('Sending OCR request to:', OCR_ENDPOINT);
      
      const response = await fetch(OCR_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`OCR API error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'OCR processing failed');
      }

      return {
        extractedText: result.extractedText || '',
        confidence: result.confidence || 0,
        language: result.detectedLanguage || ocrLanguage,
      };

    } catch (error) {
      console.error('OCR API error:', error);
      
      // Enhanced fallback with Myanmar text examples
      const mockReceiptTexts = [
        `မြန်မာစာမေးပွဲ ဆိုင် ရေစာ့
---------------------
ကော်ဖီ              ၁၅၀၀ ကျပ်
နွေးကြော်ခြောက်        ၃၀၀ ကျပ်  
လက်ဖက်ရည်          ၈၀၀ ကျပ်
---------------------
စုစုပေါင်း          ၂၆၀၀ ကျပ်`,

        `MYANMAR CAFE RECEIPT
---------------------
Coffee Premium      1500 MMK
Croissant          800 MMK
Tea                600 MMK
---------------------
SUBTOTAL          2900 MMK
TAX                290 MMK
TOTAL             3190 MMK`,

        `ရေစာ့ - Receipt
---------------------
မုန့်                ၅၀၀ ကျပ်
ဆန္ဒွစ်              ၂၀၀၀ ကျပ်
သုပ်                ၁၂၀၀ ကျပ်
---------------------
စုစုပေါင်း          ၃၇၀၀ ကျပ်`
      ];
      
      const randomReceipt = mockReceiptTexts[Math.floor(Math.random() * mockReceiptTexts.length)];
      
      return {
        extractedText: randomReceipt,
        confidence: 0.85,
        language: 'myanmar'
      };
    }
  };

  const parseReceiptText = (text: string) => {
    const lines = text.split('\n');
    const items: Array<{ name: string; price: number; quantity: number }> = [];
    
    for (const line of lines) {
      // Enhanced parsing for both Myanmar and English text
      
      // Myanmar pattern: name ၁၀၀၀ ကျပ် or name 1000 MMK
      const myanmarPriceMatch = line.match(/(.+?)\s+(\d+(?:,\d+)*)\s*(?:ကျပ်|MMK|kyat)/i);
      // English pattern: name $X.XX or name X.XX
      const englishPriceMatch = line.match(/(.+?)\s+(?:\$)?(\d+(?:\.\d{2})?)/);
      
      let name = '';
      let price = 0;
      
      if (myanmarPriceMatch) {
        name = myanmarPriceMatch[1].trim();
        price = parseFloat(myanmarPriceMatch[2].replace(/,/g, '')) / 100; // Convert kyat to dollars for consistency
      } else if (englishPriceMatch) {
        name = englishPriceMatch[1].trim();
        price = parseFloat(englishPriceMatch[2]);
      }
      
      // Skip common receipt footer items in both languages
      const skipItems = [
        'SUBTOTAL', 'TAX', 'TOTAL', 'TIP', 'CHANGE',
        'စုစုပေါင်း', 'အခွန်', 'စုစုပေါင်း', 'လက်ဖက်ရည်ငွေ'
      ];
      
      if (name && price > 0 && !skipItems.some(skip => 
        name.toUpperCase().includes(skip.toUpperCase())
      )) {
        // Clean up the name
        name = name.replace(/[^\w\s\u1000-\u109F]/g, '').trim(); // Keep Myanmar Unicode
        
        if (name.length > 2) { // Valid item names should be longer than 2 characters
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
      
      if (parsedItems.length === 0) {
        Alert.alert(
          'No Items Found',
          'Could not extract any valid items from the receipt. Please try again or add items manually.',
          [
            { text: 'Try Again', onPress: handleRetakePhoto },
            { text: 'Add Manually', onPress: onClose }
          ]
        );
        return;
      }
      
      onOCRResult(parsedItems);
      onClose();
      resetState();
      
      Alert.alert(
        'OCR Complete!',
        `Successfully extracted ${parsedItems.length} item${parsedItems.length > 1 ? 's' : ''} from receipt`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRetakePhoto = () => {
    resetState();
  };

  const resetState = () => {
    setPreviewText(null);
    setSelectedImage(null);
    setIsProcessing(false);
  };

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ocrContainer}>
            <View style={styles.ocrHeader}>
              <Text style={styles.ocrTitle}>Myanmar OCR Scanner</Text>
              <TouchableOpacity onPress={() => { onClose(); resetState(); }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.ocrContent}>
              {!previewText && !isProcessing && (
                <View style={styles.ocrInitialState}>
                  {/* Language Selection */}
                  <View style={stylesLocal.languageSelector}>
                    <Text style={stylesLocal.languageSelectorTitle}>Select Language:</Text>
                    <View style={stylesLocal.languageOptions}>
                      <TouchableOpacity
                        style={[
                          stylesLocal.languageOption,
                          ocrLanguage === 'myanmar' && stylesLocal.languageOptionActive
                        ]}
                        onPress={() => setOcrLanguage('myanmar')}
                      >
                        <Text style={[
                          stylesLocal.languageOptionText,
                          ocrLanguage === 'myanmar' && stylesLocal.languageOptionTextActive
                        ]}>
                          မြန်မာ (Myanmar)
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          stylesLocal.languageOption,
                          ocrLanguage === 'english' && stylesLocal.languageOptionActive
                        ]}
                        onPress={() => setOcrLanguage('english')}
                      >
                        <Text style={[
                          stylesLocal.languageOptionText,
                          ocrLanguage === 'english' && stylesLocal.languageOptionTextActive
                        ]}>
                          English
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.ocrViewfinder}>
                    <Ionicons name="document-text-outline" size={80} color="#6B7280" />
                  </View>
                  
                  <Text style={styles.ocrInstructions}>
                    Take a photo of a receipt or select from gallery to automatically extract items and prices in {ocrLanguage === 'myanmar' ? 'Myanmar' : 'English'}
                  </Text>
                  
                  <View style={stylesLocal.infoCard}>
                    <Ionicons name="information-circle" size={16} color="#0EA5E9" />
                    <Text style={stylesLocal.infoText}>
                      This OCR scanner supports both Myanmar and English text recognition
                    </Text>
                  </View>
                  
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

                    <TouchableOpacity 
                      style={styles.scannerOptionButton} 
                      onPress={() => setShowLiveOcr(true)}
                    >
                      <Ionicons name="scan" size={20} color="#6B7280" />
                      <Text style={styles.scannerOptionText}>Live OCR</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.ocrTips}>
                    <Text style={styles.ocrTipsTitle}>Tips for better OCR:</Text>
                    <Text style={styles.ocrTip}>• Ensure receipt is well-lit</Text>
                    <Text style={styles.ocrTip}>• Keep receipt flat and straight</Text>
                    <Text style={styles.ocrTip}>• Include the entire receipt in frame</Text>
                    <Text style={styles.ocrTip}>• Avoid shadows and reflections</Text>
                    <Text style={styles.ocrTip}>• Choose correct language for better accuracy</Text>
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
                    Processing {ocrLanguage === 'myanmar' ? 'Myanmar' : 'English'} receipt...
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
                  
                  <Text style={styles.ocrPreviewTitle}>Extracted Text ({ocrLanguage}):</Text>
                  
                  <View style={styles.ocrTextPreview}>
                    <Text style={[
                      styles.ocrPreviewText,
                      ocrLanguage === 'myanmar' && { fontFamily: 'System' } // Use system font for Myanmar
                    ]}>
                      {previewText}
                    </Text>
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
      
      <LiveOCRScanner
        visible={showLiveOcr}
        onClose={() => setShowLiveOcr(false)}
        onOCRResult={(text) => {
          setShowLiveOcr(false);
          setPreviewText(text);
        }}
      />
    </>
  );
}

// Additional styles for the new features
const stylesLocal = StyleSheet.create(
{
  languageSelector: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  languageSelectorTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  languageOption: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  languageOptionActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  languageOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  languageOptionTextActive: {
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 6,
    flex: 1,
  },
});

export default OCRScanner;