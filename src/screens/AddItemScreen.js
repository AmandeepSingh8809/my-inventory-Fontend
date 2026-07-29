import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, Card, Surface, IconButton, Chip, TouchableRipple } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/client';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function AddItemScreen({ setActiveTab }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitId, setUnitId] = useState('6'); 

  // Image State
  const [imageUri, setImageUri] = useState(null);

  // Bulk Carton States
  const [cartonCode, setCartonCode] = useState('');
  const [cartonMultiplier, setCartonMultiplier] = useState('');
  
  // Serialized Inventory State
  const [scannedSerials, setScannedSerials] = useState([]);
  
  // Purchase Details
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // UI States
  const [scannerVisible, setScannerVisible] = useState(false);
  const [activeScannerTarget, setActiveScannerTarget] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [isExistingItem, setIsExistingItem] = useState(false);

  const unitList = [
    { id: '1', label: 'kg' }, { id: '2', label: 'g' }, { id: '3', label: 'mg' },
    { id: '4', label: 'litre' }, { id: '5', label: 'ml' }, { id: '6', label: 'pcs' },
    { id: '7', label: 'dozen' }, { id: '8', label: 'pack' }
  ];

  // --- 📸 IMAGE PICKER LOGIC ---
  const handleImagePick = () => {
    Alert.alert(
      "Product Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => pickImage('camera') },
        { text: "Choose from Gallery", onPress: () => pickImage('gallery') },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const pickImage = async (type) => {
    // Compress the image to keep uploads blazing fast (quality: 0.5)
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    };

    let result;
    if (type === 'camera') {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // --- BARCODE LOOKUP ---
  const lookupBarcode = async (searchCode) => {
    try {
      const response = await api.get(`/search?query=${searchCode}`);
      const results = response.data;
      const exactMatch = results.find(item => item.code === searchCode || item.carton_code === searchCode);
      
      if (exactMatch) {
        setName(exactMatch.name);
        setPrice(String(exactMatch.price || ''));
        setCostPrice(String(exactMatch.costPrice || exactMatch.cost_price || '')); 
        if (exactMatch.unit_id) setUnitId(String(exactMatch.unit_id));
        if (exactMatch.carton_code === searchCode && exactMatch.carton_multiplier) setQuantity(String(exactMatch.carton_multiplier));
        if (exactMatch.carton_code) setCartonCode(exactMatch.carton_code);
        if (exactMatch.carton_multiplier) setCartonMultiplier(String(exactMatch.carton_multiplier));
        setIsExistingItem(true);
      } else {
        setIsExistingItem(false);
      }
    } catch (error) {
      setIsExistingItem(false);
    }
  };

  const handleScanSuccess = (scannedCode) => {
    const cleanCode = scannedCode.replace(/[\r\n\t]/g, '').trim();

    if (activeScannerTarget === 'carton') {
      setCartonCode(cleanCode);
      setScannerVisible(false);
      setActiveScannerTarget(null);
    } 
    else if (activeScannerTarget === 'serials') {
      if (!scannedSerials.includes(cleanCode) && cleanCode !== code) {
        setScannedSerials(prev => {
          const newList = [...prev, cleanCode];
          setQuantity(String(newList.length)); 
          return newList;
        });
      }
    } 
    else {
      setCode(cleanCode);
      lookupBarcode(cleanCode);
      setScannerVisible(false);
      setActiveScannerTarget(null);
    }
  };

  const removeSerial = (serialToRemove) => {
    setScannedSerials(prev => {
      const newList = prev.filter(s => s !== serialToRemove);
      setQuantity(String(newList.length || '')); 
      return newList;
    });
  };

  // --- 🚀 SUBMIT DATA ---
  const handleSubmit = async () => {
    if (!code || !name || !price || (!quantity && scannedSerials.length === 0)) {
      Alert.alert("Missing Fields", "Code, Name, Price, and Quantity are required.");
      return;
    }

    const integerOnlyUnits = ['6', '7', '8']; 
    if (integerOnlyUnits.includes(String(unitId)) && !Number.isInteger(parseFloat(quantity))) {
      Alert.alert("Invalid Quantity", "Pieces, dozens, and packs must be whole numbers.");
      return;
    }

    setLoading(true);

    try {
      const finalQuantity = scannedSerials.length > 0 ? scannedSerials.length : parseFloat(quantity);

      // 🚨 NEW: Create FormData instead of JSON!
      const formData = new FormData();
      formData.append('code', code);
      formData.append('name', name);
      formData.append('price', price);
      formData.append('costPrice', costPrice || '0');
      formData.append('quantity', String(finalQuantity));
      formData.append('unit_id', unitId);
      formData.append('supplier', supplier.trim() || 'Walk-in / Unknown');
      formData.append('invoiceNumber', invoiceNumber.trim() || '');
      formData.append('cartonCode', cartonCode.trim() || '');
      formData.append('cartonMultiplier', cartonMultiplier || '1');
      
      // Convert arrays to string so FormData can send them
      formData.append('serials', JSON.stringify(scannedSerials));

      // Append Image File if it exists
      if (imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('image', { uri: imageUri, name: filename, type });
      }

      // Send via Axios using multipart/form-data headers
      await api.post('/addProduct', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert("Success", isExistingItem ? "Stock updated successfully!" : "New product created successfully!");
      
      // Reset Form
      setCode(''); setName(''); setPrice(''); setCostPrice(''); setQuantity('');
      setUnitId('6'); setCartonCode(''); setCartonMultiplier('');
      setSupplier(''); setInvoiceNumber(''); setIsExistingItem(false);
      setScannedSerials([]); setImageUri(null);
      
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to save the product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            
            {isExistingItem ? (
              <Surface style={styles.restockBadge}><Text style={styles.restockText}>📦 Restocking Existing Item</Text></Surface>
            ) : (
              <Surface style={styles.newBadge}><Text style={styles.newText}>✨ Creating New Item</Text></Surface>
            )}

            {/* 📸 IMAGE UPLOAD UI */}
            <View style={styles.imagePickerContainer}>
              <TouchableRipple onPress={handleImagePick} style={styles.imagePlaceholder}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholderContent}>
                    <IconButton icon="camera-plus" size={30} iconColor="#888" />
                    <Text style={{ color: '#888' }}>Add Product Photo</Text>
                  </View>
                )}
              </TouchableRipple>
              {imageUri && (
                <Button mode="text" onPress={() => setImageUri(null)} textColor="#d32f2f">
                  Remove Photo
                </Button>
              )}
            </View>

            <View style={styles.scanRow}>
              <TextInput label="Parent Barcode / S/N *" value={code} onChangeText={(t) => { setCode(t); if(t.length>2) lookupBarcode(t); }} mode="outlined" style={styles.flexInput} />
              <IconButton icon="barcode-scan" mode="contained" containerColor="#007AFF" iconColor="#fff" size={30} onPress={() => { setActiveScannerTarget('main'); setScannerVisible(true); }} />
            </View>

            <TextInput label="Product Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />

            <View style={styles.row}>
              <TextInput label="Selling Price (₹) *" value={price} onChangeText={setPrice} mode="outlined" keyboardType="numeric" style={[styles.flexInput, { marginRight: 10 }]} />
              <TextInput label="Cost Price (₹)" value={costPrice} onChangeText={setCostPrice} mode="outlined" keyboardType="numeric" style={styles.flexInput} />
            </View>

            <TextInput 
              label={scannedSerials.length > 0 ? `Quantity (Auto: ${scannedSerials.length})` : "Quantity Added *"} 
              value={quantity} onChangeText={setQuantity} mode="outlined" keyboardType="numeric" style={styles.input} 
              disabled={scannedSerials.length > 0} 
            />

            <Text variant="labelMedium" style={styles.unitLabel}>Select Unit *</Text>
            <View style={styles.unitContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {unitList.map((u) => (
                  <Chip key={u.id} selected={unitId === u.id} onPress={() => setUnitId(u.id)} style={[styles.unitChip, { backgroundColor: unitId === u.id ? '#007AFF' : '#e0e0e0' }]} textStyle={{ color: unitId === u.id ? '#fff' : '#333' }}>
                    {u.label}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            {/* SERIALIZED SECTION */}
            <View style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Loose Items (Serialized)</Text>
            <Button icon="barcode-scan" mode="outlined" onPress={() => { setActiveScannerTarget('serials'); setScannerVisible(true); }} style={{ marginBottom: 10 }}>
              Start Continuous Scan
            </Button>
            {scannedSerials.length > 0 && (
              <View style={styles.serialChipsContainer}>
                {scannedSerials.map((serial) => (
                  <Chip key={serial} onClose={() => removeSerial(serial)} style={styles.serialChip}>{serial}</Chip>
                ))}
              </View>
            )}

            {/* CARTON SECTION */}
            <View style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Bulk / Carton Settings</Text>
            <View style={styles.scanRow}>
              <TextInput label="Carton Barcode" value={cartonCode} onChangeText={setCartonCode} mode="outlined" style={styles.flexInput} />
              <IconButton icon="barcode-scan" mode="contained" containerColor="#007AFF" iconColor="#fff" size={30} onPress={() => { setActiveScannerTarget('carton'); setScannerVisible(true); }} />
            </View>
            <TextInput label="Units inside" value={cartonMultiplier} onChangeText={setCartonMultiplier} mode="outlined" keyboardType="numeric" style={styles.input} />

            {/* PURCHASE DETAILS */}
            <View style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Purchase Details</Text>
            <TextInput label="Supplier / Vendor" value={supplier} onChangeText={setSupplier} mode="outlined" style={styles.input} />
            <TextInput label="Invoice Number" value={invoiceNumber} onChangeText={setInvoiceNumber} mode="outlined" style={styles.input} />

            <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.submitBtn} contentStyle={{ paddingVertical: 8 }}>
              {isExistingItem ? "Update Stock" : "Save New Product"}
            </Button>

          </Card.Content>
        </Card>
      </ScrollView>

      <BarcodeScannerModal 
        visible={scannerVisible} 
        isContinuous={activeScannerTarget === 'serials'} 
        onClose={() => { setScannerVisible(false); setActiveScannerTarget(null); }} 
        onScanSuccess={handleScanSuccess} 
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#fff', elevation: 3 },
  restockBadge: { backgroundColor: '#e8f5e9', padding: 8, borderRadius: 6, marginBottom: 16, alignItems: 'center' },
  restockText: { color: '#2e7d32', fontWeight: 'bold' },
  newBadge: { backgroundColor: '#e3f2fd', padding: 8, borderRadius: 6, marginBottom: 16, alignItems: 'center' },
  newText: { color: '#1565c0', fontWeight: 'bold' },
  
  // Image Styles
  imagePickerContainer: { alignItems: 'center', marginBottom: 20 },
  imagePlaceholder: { width: 120, height: 120, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', borderStyle: 'dashed', overflow: 'hidden', backgroundColor: '#f9f9f9' },
  imagePlaceholderContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '100%', height: '100%' },

  scanRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  flexInput: { flex: 1, backgroundColor: '#fff', marginRight: 8 },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 16 },
  sectionTitle: { marginBottom: 12, color: '#555', fontWeight: 'bold' },
  unitLabel: { marginBottom: 8, color: '#555', fontWeight: 'bold' },
  unitContainer: { marginBottom: 8, flexDirection: 'row' },
  unitChip: { marginRight: 8 },
  serialChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  serialChip: { backgroundColor: '#f0f0f0' },
  submitBtn: { marginTop: 10, borderRadius: 8, backgroundColor: '#007AFF' }
});