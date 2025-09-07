import React, { useCallback, useRef, useState } from "react";
import { View, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert, Text } from "react-native";
import { Camera, useCameraDevices, useFrameProcessor } from "react-native-vision-camera";
import { scanBarcodes, BarcodeFormat } from "vision-camera-code-scanner";
import { runOnJS } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  visible: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
  onOcrDetected: (ocrText: string) => void;
};

const SmartScanner: React.FC<Props> = ({ visible, onClose, onBarcodeDetected, onOcrDetected }) => {
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [barcodeHandled, setBarcodeHandled] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Barcode scanning
  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    const barcodes = scanBarcodes(frame, [BarcodeFormat.ALL_FORMATS]);
    if (barcodes.length > 0 && !barcodeHandled) {
      runOnJS(handleBarcode)(barcodes[0].rawValue || "");
    }
  }, [barcodeHandled]);

  const handleBarcode = useCallback((barcode: string) => {
    setBarcodeHandled(true);
    onBarcodeDetected(barcode);
    setTimeout(() => setBarcodeHandled(false), 2000); // Allow re-scan after 2s
  }, [onBarcodeDetected]);

  // Take picture for OCR
  const handleTakePictureAndOcr = async () => {
    if (!cameraRef.current) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePhoto();
    //   const uri = photo.path ? `file://${photo.path}` : undefined;
      const uri = photo.path ? `file://${photo.path}` : null;
      setPhotoUri(uri);

      if (uri) {
        const ocrText = await sendImageForOcr(uri);
        onOcrDetected(ocrText);
      }
    } catch (e: any) {
      Alert.alert("OCR Error", e.message ?? String(e));
    }
    setIsProcessing(false);
  };

  // OCR backend call
  const sendImageForOcr = async (imageUri: string): Promise<string> => {
    const apiUrl = "http://<YOUR_BACKEND_IP>:<PORT>/api/ocr/myanmar"; // Replace with your backend
    let filename = imageUri.split("/").pop() || "photo.jpg";
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image/jpeg`;
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) throw new Error("OCR failed");
    return await response.text();
  };

  if (!device) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={visible && !isProcessing}
          photo={true}
          frameProcessor={frameProcessor}
        />
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePictureAndOcr}
            disabled={isProcessing}
          >
            <Ionicons name="camera" size={28} color="#fff" />
            <Text style={{ color: "#fff", marginLeft: 8 }}>Capture & OCR</Text>
          </TouchableOpacity>
          {isProcessing && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 12 }} />}
        </View>
        {photoUri && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  captureButton: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 12,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 30,
    backgroundColor: "#000a",
    borderRadius: 16,
    padding: 6,
  },
  previewContainer: {
    position: "absolute",
    bottom: 120,
    left: 16,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 50,
  },
  previewImage: {
    width: 120,
    height: 140,
    resizeMode: "cover",
  },
});
export default SmartScanner;