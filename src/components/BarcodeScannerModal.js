// components/BarcodeScannerModal.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Button, Text } from 'react-native-paper';

export default function BarcodeScannerModal({ visible, onClose, onScanSuccess }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarcodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      onScanSuccess(data);
      onClose();
      setTimeout(() => setScanned(false), 1000);
    }
  };

  if (hasPermission === null) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Align Barcode inside Camera View</Text>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "upc_a"] }}
        />
        <Button mode="contained" onPress={onClose} style={styles.closeBtn}>
          Cancel
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, marginBottom: 20 },
  camera: { width: '85%', height: 320, borderRadius: 16, overflow: 'hidden' },
  closeBtn: { marginTop: 30 }
});