import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Button, Alert } from 'react-native';
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
    marginBottom: 16,
  },
  cameraPlaceholderText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
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
    width: '80%',
    height: '60%',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanningHint: {
    position: 'absolute',
    bottom: 20,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusContainer: {
    width: '100%',
    marginBottom: 12,
  },
  confidenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  resultBox: { 
    width: '100%', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: { 
    fontWeight: '700', 
    fontSize: 14,
    color: '#1F2937',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  resultText: { 
    fontSize: 14, 
    color: '#374151',
    lineHeight: 20,
    textAlign: 'left',
  },
  textPreview: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 12,
    color: '#374151',
    fontStyle: 'italic',
  },
  actionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 48,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  captureButton: {
    backgroundColor: '#3B82F6',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  processingIndicator: {
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default LiveOCRScanner;
  
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Enhanced frame processor with Myanmar text support
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    try {
      const ocrResult = scanOCR(frame, {
        language: 'mya+eng', // Support both Myanmar and English
        recognitionLevel: 'accurate'
      }) as OCRResult | undefined;
      
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
      if (recognizedText && recognizedText.length > 10 && confidence > 0.7) {
        handleAutoSave();
      }
    }, 2000); // Wait 2 seconds for text to stabilize
  }, [recognizedText, confidence]);

  React.useEffect(() => {
    if (recognizedText) {
      handleTextStabilization();
    }
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [recognizedText, handleTextStabilization]);

  const handleAutoSave = () => {
    Alert.alert(
      'Text Detected!',
      'Receipt text has been detected. Would you like to use this text?',
      [
        {
          text: 'Continue Scanning',
          style: 'cancel',
        },
        {
          text: 'Use This Text',
          onPress: handleSave,
        },
      ]
    );
  };

  const handleSave = () => {
    if (recognizedText) {
      setIsProcessing(true);
      
      // Clean up the text for better parsing
      const cleanedText = recognizedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      
      onOCRResult(cleanedText);
      onClose();
      
      // Reset state
      setRecognizedText('');
      setConfidence(0);
      setIsProcessing(false);
    }
  };

  const handleManualCapture = () => {
    if (recognizedText) {
      handleSave();
    } else {
      Alert.alert(
        'No Text Detected',
        'Please point the camera at text or a receipt to scan.',
        [{ text: 'OK' }]
      );
    }
  };

  const getConfidenceColor = () => {
    if (confidence > 0.8) return '#10B981'; // Green
    if (confidence > 0.6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getConfidenceText = () => {
    if (confidence > 0.8) return 'High';
    if (confidence > 0.6) return 'Medium';
    return 'Low';
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.header}>Live Myanmar OCR Scanner</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#444" />
            </TouchableOpacity>
          </View>

          {/* Camera View */}
          {device ? (
            <View style={styles.cameraContainer}>
              <Camera
                style={styles.camera}
                device={device}
                isActive={visible}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
              />
              
              {/* Overlay for scanning area */}
              <View style={styles.scanningOverlay}>
                <View style={styles.scanningFrame} />
                <Text style={styles.scanningHint}>
                  Point camera at receipt text
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="camera" size={48} color="#9CA3AF" />
              <Text style={styles.cameraPlaceholderText}>Loading camera...</Text>
            </View>
          )}

          {/* Status Indicator */}
          {recognizedText && (
            <View style={styles.statusContainer}>
              <View style={styles.confidenceIndicator}>
                <View 
                  style={[
                    styles.confidenceDot, 
                    { backgroundColor: getConfidenceColor() }
                  ]} 
                />
                <Text style={styles.confidenceText}>
                  Accuracy: {getConfidenceText()}
                </Text>
              </View>
            </View>
          )}

          {/* Result Display */}
          <View style={styles.resultBox}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>Detected Text:</Text>
              {recognizedText && (
                <Text style={styles.characterCount}>
                  {recognizedText.length} chars
                </Text>
              )}
            </View>
            
            <Text style={[
              styles.resultText,
              { minHeight: 80 } // Ensure minimum height
            ]}>
              {recognizedText || 'Point camera at receipt or text to start scanning...'}
            </Text>
            
            {recognizedText && (
              <View style={styles.textPreview}>
                <Text style={styles.previewLabel}>Preview (first 3 lines):</Text>
                <Text style={styles.previewText}>
                  {recognizedText.split('\n').slice(0, 3).join('\n')}
                  {recognizedText.split('\n').length > 3 && '\n...'}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.captureButton]}
              onPress={handleManualCapture}
              disabled={!recognizedText || isProcessing}
            >
              <Ionicons 
                name="camera-outline" 
                size={20} 
                color={recognizedText ? "#FFFFFF" : "#9CA3AF"} 
              />
              <Text style={[
                styles.actionButtonText,
                { color: recognizedText ? "#FFFFFF" : "#9CA3AF" }
              ]}>
                Capture
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={!recognizedText || isProcessing}
            >
              <Ionicons 
                name="checkmark-outline" 
                size={20} 
                color={recognizedText ? "#FFFFFF" : "#9CA3AF"} 
              />
              <Text style={[
                styles.actionButtonText,
                { color: recognizedText ? "#FFFFFF" : "#9CA3AF" }
              ]}>
                Use Text
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Ionicons name="close-outline" size={20} color="#6B7280" />
              <Text style={[styles.actionButtonText, { color: "#6B7280" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          {/* Processing Indicator */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingIndicator}>
                <Ionicons name="scan" size={32} color="#F59E0B" />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};