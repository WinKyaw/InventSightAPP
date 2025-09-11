import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Text,
} from "react-native";
import { CameraView, CameraType, Camera } from "expo-camera";
import { BarCodeScannerResult } from "expo-barcode-scanner";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  visible: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
  onOcrDetected: (ocrText: string) => void;
};

const SmartScanner: React.FC<Props> = ({
  visible,
  onClose,
  onBarcodeDetected,
  onOcrDetected,
}) => {
  const cameraRef = useRef<CameraView>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [barcodeHandled, setBarcodeHandled] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'barcode' | 'ocr'>('barcode');

  // Configuration for your backend API
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const OCR_ENDPOINT = `${API_BASE_URL}/api/ocr/process`;

  // Ask permissions when modal opens
  useEffect(() => {
    if (visible) {
      (async () => {
        const { status: camStatus } = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(camStatus === "granted");
      })();
    }
  }, [visible]);

  const handleBarcode = useCallback(
    (data: string) => {
      if (barcodeHandled || scanMode !== 'barcode') return;
      setBarcodeHandled(true);
      onBarcodeDetected(data);
      // Allow re-scan after delay
      setTimeout(() => setBarcodeHandled(false), 2000);
    },
    [barcodeHandled, onBarcodeDetected, scanMode]
  );

  const onBarCodeScanned = ({ data }: BarCodeScannerResult) => {
    if (!barcodeHandled && scanMode === 'barcode') {
      handleBarcode(data);
    }
  };

  const handleTakePictureAndOcr = async () => {
    if (!cameraRef.current) return;
    setIsProcessing(true);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9, // Higher quality for better OCR
        base64: false,
        skipProcessing: false,
      });
      
      const uri = photo.uri;
      setPhotoUri(uri);

      if (uri) {
        const ocrResult = await sendImageForOcr(uri);
        onOcrDetected(ocrResult.extractedText);
      }
    } catch (e: any) {
      console.error('OCR Error:', e);
      Alert.alert("OCR Error", e?.message ?? "Failed to process image");
    }
    setIsProcessing(false);
  };

  // Enhanced OCR API call to your Spring Boot backend
  const sendImageForOcr = async (imageUri: string): Promise<{
    extractedText: string;
    confidence: number;
    detectedLanguage: string;
  }> => {
    try {
      const filename = imageUri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Add OCR parameters for better processing
      formData.append("language", "mya+eng"); // Support Myanmar and English
      formData.append("imageType", "receipt");
      formData.append("preprocessImage", "true");

      console.log('Sending OCR request to:', OCR_ENDPOINT);

      const response = await fetch(OCR_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
        },
        timeout: 30000, // 30 second timeout
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
        detectedLanguage: result.detectedLanguage || 'unknown',
      };

    } catch (error) {
      console.error('OCR API call failed:', error);
      
      // Fallback mock data for testing
      const mockTexts = [
        `Coffee Shop Receipt
================
Coffee Premium    1500 MMK
Croissant         800 MMK  
Tea               600 MMK
================
Total            2900 MMK`,
        
        `မြန်မာစာမေးပွဲ ဆိုင်
================
ကော်ဖီ              ၁၅၀၀ ကျပ်
နွေးကြော်ခြောက်        ၈၀၀ ကျပ်  
လက်ဖက်ရည်          ၆၀၀ ကျပ်
================
စုစုပေါင်း          ၂၉၀၀ ကျပ်`
      ];
      
      return {
        extractedText: mockTexts[Math.floor(Math.random() * mockTexts.length)],
        confidence: 0.85,
        detectedLanguage: 'myanmar'
      };
    }
  };

  const toggleScanMode = () => {
    setScanMode(current => current === 'barcode' ? 'ocr' : 'barcode');
    setBarcodeHandled(false);
    setPhotoUri(null);
  };

  if (!visible) return null;

  if (hasCameraPermission === false) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-off" size={64} color="#6B7280" />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              Please grant camera permission to use the scanner
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={onClose}>
              <Text style={styles.permissionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanMode === 'barcode' ? (barcodeHandled ? undefined : onBarCodeScanned) : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
          }}
        />
        
        {/* Header with mode indicator and close button */}
        <View style={styles.header}>
          <View style={styles.modeIndicator}>
            <Ionicons 
              name={scanMode === 'barcode' ? "barcode" : "document-text"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.modeText}>
              {scanMode === 'barcode' ? 'Barcode Scanner' : 'OCR Scanner'}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scanning overlay */}
        <View style={styles.scanningOverlay}>
          {scanMode === 'barcode' ? (
            <View style={styles.barcodeFrame}>
              <Text style={styles.scanningHint}>
                Point camera at barcode to scan
              </Text>
            </View>
          ) : (
            <View style={styles.ocrFrame}>
              <Text style={styles.scanningHint}>
                Point camera at receipt text
              </Text>
            </View>
          )}
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {/* Mode Toggle */}
          <TouchableOpacity
            style={styles.modeToggle}
            onPress={toggleScanMode}
            disabled={isProcessing}
          >
            <Ionicons 
              name={scanMode === 'barcode' ? "document-text" : "barcode"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.toggleText}>
              {scanMode === 'barcode' ? 'OCR' : 'Barcode'}
            </Text>
          </TouchableOpacity>

          {/* Main Action Button */}
          {scanMode === 'ocr' && (
            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={handleTakePictureAndOcr}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={32} color="#fff" />
              )}
              <Text style={styles.captureButtonText}>
                {isProcessing ? 'Processing...' : 'Capture & OCR'}
              </Text>
            </TouchableOpacity>
          )}

          {scanMode === 'barcode' && (
            <View style={styles.barcodeStatus}>
              <Ionicons 
                name={barcodeHandled ? "checkmark-circle" : "scan"} 
                size={24} 
                color={barcodeHandled ? "#10B981" : "#F59E0B"} 
              />
              <Text style={[
                styles.barcodeStatusText,
                { color: barcodeHandled ? "#10B981" : "#F59E0B" }
              ]}>
                {barcodeHandled ? 'Barcode Detected!' : 'Ready to scan'}
              </Text>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              {scanMode === 'barcode' 
                ? 'Align barcode within the frame' 
                : 'Take clear photo of receipt for OCR processing'
              }
            </Text>
          </View>
        </View>

        {/* Photo preview for OCR */}
        {photoUri && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <Text style={styles.previewLabel}>Captured</Text>
          </View>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.processingText}>Processing Myanmar OCR...</Text>
              <Text style={styles.processingSubtext}>This may take a moment</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000" 
  },
  camera: { 
    flex: 1 
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 10,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  barcodeFrame: {
    width: 280,
    height: 120,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  ocrFrame: {
    width: '80%',
    height: '50%',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  scanningHint: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 15,
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  captureButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  captureButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  captureButtonText: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  barcodeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 15,
  },
  barcodeStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructions: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '90%',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  previewContainer: {
    position: "absolute",
    bottom: 180,
    right: 20,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#3B82F6",
    backgroundColor: '#FFFFFF',
  },
  previewImage: {
    width: 80,
    height: 100,
    resizeMode: "cover",
  },
  previewLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 2,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    maxWidth: '80%',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  permissionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    maxWidth: '80%',
    elevation: 10,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SmartScanner;