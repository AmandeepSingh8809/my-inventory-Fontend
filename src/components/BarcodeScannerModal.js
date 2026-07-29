import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, Vibration } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Button, Text } from 'react-native-paper';

// 🚨 NEW: Added 'isContinuous' to the props
export default function BarcodeScannerModal({ visible, onClose, onScanSuccess, isContinuous }) {
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
      
      // Bonus: Vibrate the phone so the user knows it successfully scanned!
      Vibration.vibrate(100); 
      
      onScanSuccess(data);

      if (isContinuous) {
        // 🟢 CONTINUOUS MODE: Do NOT call onClose(). 
        // Just wait 1.2 seconds before unlocking the camera for the next item.
        setTimeout(() => setScanned(false), 1200);
      } else {
        // 🔴 NORMAL MODE: Close the camera immediately.
        onClose();
        setTimeout(() => setScanned(false), 500);
      }
    }
  };

  // Ensure the camera unlocks if the user manually hits the Cancel button
  const handleManualClose = () => {
    setScanned(false);
    onClose();
  };

  if (hasPermission === null) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>
          {isContinuous ? "Continuous Scan Mode Active" : "Align Barcode inside Camera View"}
        </Text>
        
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "code128", "code39"] }}
        />
        
        <Button mode="contained" onPress={handleManualClose} style={styles.closeBtn}>
          {isContinuous ? "Done Scanning" : "Cancel"}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, marginBottom: 20 },
  camera: { width: '85%', height: 320, borderRadius: 16, overflow: 'hidden' },
  closeBtn: { marginTop: 30, backgroundColor: '#d32f2f' }
});