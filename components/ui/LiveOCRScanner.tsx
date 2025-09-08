import React, { useState, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Button } from 'react-native';
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
    type ocrResult = { textBlocks?: { value: string }[] };
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [recognizedText, setRecognizedText] = useState('');

  // Frame processor using scanOCR
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const ocrResult = scanOCR(frame) as { textBlocks?: { value: string }[] } | undefined;
    const text =
    ocrResult && ocrResult.textBlocks && Array.isArray(ocrResult.textBlocks)
    ? ocrResult.textBlocks.map((tb: { value: string }) => tb.value).join('\n')
    : '';
    runOnJS(setRecognizedText)(text);
  }, []);

  const handleSave = () => {
    if (recognizedText) {
      onOCRResult(recognizedText);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.header}>Live OCR Scanner</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#444" />
          </TouchableOpacity>
          {device ? (
            <Camera
              style={styles.camera}
              device={device}
              isActive={true}
              frameProcessor={frameProcessor}
            />
          ) : (
            <Text>Loading camera...</Text>
          )}
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Recognized Text:</Text>
            <Text style={styles.resultText}>{recognizedText || 'Point camera at receipt or text...'}</Text>
          </View>
          <View style={styles.actionRow}>
            <Button title="Save" onPress={handleSave} disabled={!recognizedText} />
            <Button title="Cancel" onPress={onClose} color="#888" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center'
  },
  container: {
    width: '90%', backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center'
  },
  header: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  closeButton: { position: 'absolute', top: 12, right: 12, zIndex: 10 },
  camera: { width: '100%', height: 270, borderRadius: 12, marginVertical: 8 },
  resultBox: { width: '100%', backgroundColor: '#f6f6f6', borderRadius: 6, padding: 10, marginVertical: 8 },
  resultLabel: { fontWeight: 'bold', marginBottom: 3 },
  resultText: { fontSize: 14, color: '#333' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' }
});

export default LiveOCRScanner;