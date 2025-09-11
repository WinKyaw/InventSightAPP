import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { scanOCR } from 'vision-camera-ocr';
import { runOnJS } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';

interface LiveOCRScannerProps {
  visible: boolean;
  onClose: () => void;
  onOCRResult: (text: string) => void;
}

const LiveOCRScanner: React.FC<LiveOCRScannerProps> = ({ visible, onClose, onOCRResult }) => {
  type OCRResult = { textBlocks?: { value: string }[] };
  
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced frame processor with Myanmar text support
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    try {
      const ocrResult = scanOCR(frame) as OCRResult | undefined;
      
      if (ocrResult && ocrResult.textBlocks && Array.isArray(ocrResult.textBlocks)) {
        const text = ocrResult.textBlocks
          .map((tb: { value: string }) => tb.value)
          .join('\n')
          .trim();
        
        if (text.length > 5) { // Only process if we have substantial text
          runOnJS(setRecognizedText)(text);
          runOnJS(setConfidence)(0.8); // Mock confidence for now
        }
      }
    } catch (error) {
      console.warn('OCR processing error:', error);
    }
  }, []);

  // Auto-save when stable text is detected
  const handleTextStabilization = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    scanTimeoutRef.current = setTimeout(() => {
      if (recognizedText.trim().length > 10 && !isProcessing) {
        setIsProcessing(true);
        onOCRResult(recognizedText);
        setTimeout(() => {
          setIsProcessing(false);
          onClose();
        }, 1000);
      }
    }, 2000); // Wait 2 seconds for text stabilization
  }, [recognizedText, isProcessing, onOCRResult, onClose]);

  // Trigger text stabilization when text changes
  React.useEffect(() => {
    if (recognizedText.trim().length > 0) {
      handleTextStabilization();
    }
  }, [recognizedText, handleTextStabilization]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const handleManualCapture = () => {
    if (recognizedText.trim().length > 0) {
      onOCRResult(recognizedText);
      onClose();
    } else {
      Alert.alert('No Text Found', 'Please point the camera at text to scan.');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.header}>Live OCR Scanner</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraContainer}>
            {device ? (
              <Camera
                style={styles.camera}
                device={device}
                isActive={visible}
                frameProcessor={frameProcessor}
              />
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Ionicons name="camera-outline" size={64} color="#6B7280" />
                <Text style={styles.placeholderText}>Camera not available</Text>
              </View>
            )}
            
            {/* Overlay for scanning indicator */}
            <View style={styles.scanningOverlay}>
              <View style={styles.scanningFrame} />
              <Text style={styles.scanningText}>
                {isProcessing ? 'Processing...' : 'Point camera at text'}
              </Text>
            </View>
          </View>

          {/* Recognition Results */}
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Recognized Text {confidence > 0 && `(${Math.round(confidence * 100)}%)`}:
            </Text>
            <View style={styles.textPreview}>
              <Text style={styles.previewText}>
                {recognizedText || 'No text detected yet...'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                !recognizedText.trim() && styles.buttonDisabled
              ]}
              onPress={handleManualCapture}
              disabled={!recognizedText.trim()}
            >
              <Text style={styles.buttonPrimaryText}>Use Text</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  container: {
    width: '95%', 
    height: '90%',
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center'
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1F2937',
    flex: 1,
  },
  closeButton: { 
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cameraContainer: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  camera: { 
    width: '100%', 
    height: '100%',
  },
  cameraPlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningFrame: {
    width: 200,
    height: 100,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  scanningText: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultsContainer: {
    width: '100%',
    flex: 1,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textPreview: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#F59E0B',
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default LiveOCRScanner;