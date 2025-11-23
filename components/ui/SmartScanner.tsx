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
import { CameraView, CameraType, Camera, BarcodeScanningResult } from "expo-camera";
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

  // Ask permissions when modal opens
  useEffect(() => {
    if (visible) {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(status === "granted");
      })();
    }
  }, [visible]);

  const handleBarcode = useCallback(
    (data: string) => {
      if (barcodeHandled) return;
      setBarcodeHandled(true);
      onBarcodeDetected(data);
      // Allow re-scan after delay
      setTimeout(() => setBarcodeHandled(false), 2000);
    },
    [barcodeHandled, onBarcodeDetected]
  );

  const onBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (!barcodeHandled) {
      handleBarcode(data);
    }
  };

  const handleTakePictureAndOcr = async () => {
    if (!cameraRef.current) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
      });
      const uri = photo.uri;
      setPhotoUri(uri);

      if (uri) {
        const ocrText = await sendImageForOcr(uri);
        onOcrDetected(ocrText);
      }
    } catch (e: any) {
      Alert.alert("OCR Error", e?.message ?? String(e));
    }
    setIsProcessing(false);
  };

  // Stub / existing backend call logic (replace placeholder host)
  const sendImageForOcr = async (imageUri: string): Promise<string> => {
    const apiUrl = "http://<YOUR_BACKEND_IP>:<PORT>/api/ocr/myanmar";
    const filename = imageUri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

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

  if (!visible) return null;

  if (hasCameraPermission === false) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "#333", marginBottom: 12, fontSize: 16, fontWeight: "600" }}>
            Camera permission denied
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={onClose}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Close</Text>
          </TouchableOpacity>
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
          onBarcodeScanned={barcodeHandled ? undefined : onBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
          }}
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
              <Ionicons name="camera" size={26} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 8 }}>Capture & OCR</Text>
            </TouchableOpacity>
          {isProcessing && (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 14 }} />
          )}
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
  },
  previewImage: {
    width: 120,
    height: 140,
    resizeMode: "cover",
  },
  permissionButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
});

export default SmartScanner;