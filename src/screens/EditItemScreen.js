import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, Text, Card, Surface, IconButton, Chip, TouchableRipple } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import api, { getImageUrl } from '../api/client';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function EditItemScreen({ setActiveTab, product }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unitId, setUnitId] = useState('6'); 

  // Stock Adjustment State
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [manualQuantity, setManualQuantity] = useState(''); // Can be positive or negative
  const [scannedSerials, setScannedSerials] = useState([]);

  // Image State
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [newImageUri, setNewImageUri] = useState(null);

  // Bulk Carton States
  const [cartonCode, setCartonCode] = useState('');
  const [cartonMultiplier, setCartonMultiplier] = useState('');
  
  // Purchase Details
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // UI States
  const [scannerVisible, setScannerVisible] = useState(false);
  const [activeScannerTarget, setActiveScannerTarget] = useState(null); 
  const [loading, setLoading] = useState(false);

  const unitList = [
    { id: '1', label: 'kg' }, { id: '2', label: 'g' }, { id: '3', label: 'mg' },
    { id: '4', label: 'litre' }, { id: '5', label: 'ml' }, { id: '6', label: 'pcs' },
    { id: '7', label: 'dozen' }, { id: '8', label: 'pack' }
  ];

  // --- 📥 LOAD EXISTING PRODUCT DATA ---
  useEffect(() => {
    if (product) {
      setCode(product.code || '');
      setName(product.name || '');
      setPrice(String(product.price || ''));
      setCostPrice(String(product.cost_price || product.costPrice || ''));
      setUnitId(String(product.unit_id || '6'));
      setCurrentQuantity(Number(product.quantity) || 0);
      
      if (product.carton_code) setCartonCode(product.carton_code);
      if (product.carton_multiplier) setCartonMultiplier(String(product.carton_multiplier));
      if (product.image_url) setExistingImageUrl(getImageUrl(product.image_url));
    }
  }, [product]);

  // --- 📸 IMAGE PICKER LOGIC ---
  const handleImagePick = () => {
    Alert.alert(
      "Update Product Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => pickImage('camera') },
        { text: "Choose from Gallery", onPress: () => pickImage('gallery') },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const pickImage = async (type) => {
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
      setNewImageUri(result.assets[0].uri);
    }
  };

  // --- BARCODE SCANNING ---
  const handleScanSuccess = (scannedCode) => {
    const cleanCode = scannedCode.replace(/[\r\n\t]/g, '').trim();

    if (activeScannerTarget === 'carton') {
      setCartonCode(cleanCode);
      setScannerVisible(false);
      setActiveScannerTarget(null);
    } 
    else if (activeScannerTarget === 'serials') {
      if (!scannedSerials.includes(cleanCode) && cleanCode !== code) {
        setScannedSerials(prev => [...prev, cleanCode]);
      }
    } 
    else {
      setCode(cleanCode);
      setScannerVisible(false);
      setActiveScannerTarget(null);
    }
  };

  const removeSerial = (serialToRemove) => {
    setScannedSerials(prev => prev.filter(s => s !== serialToRemove));
  };

  // --- 🚀 SUBMIT UPDATED DATA ---
  const handleSubmit = async () => {
    const scannedQty = scannedSerials.length;
    const extraQty = parseFloat(manualQuantity) || 0;
    
    // Math: Current + Scanned New + Manual Adjustment (which can be negative)
    const finalQuantity = currentQuantity + scannedQty + extraQty;

    if (!code || !name || !price) {
      Alert.alert("Missing Fields", "Code, Name, and Price are required.");
      return;
    }

    if (finalQuantity < 0) {
      Alert.alert("Invalid Stock", "Stock cannot be negative.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('code', code);
      formData.append('name', name);
      formData.append('price', price);
      formData.append('costPrice', costPrice || '0');
      
      formData.append('quantity', String(finalQuantity));
      formData.append('unit_id', unitId);
      
      formData.append('supplier', supplier.trim());
      formData.append('invoiceNumber', invoiceNumber.trim());
      formData.append('cartonCode', cartonCode.trim());
      formData.append('cartonMultiplier', cartonMultiplier || '1');
      
      if (scannedSerials.length > 0) {
        formData.append('newSerials', JSON.stringify(scannedSerials));
      }

      // Only append image if they selected a NEW one
      if (newImageUri) {
        const filename = newImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri: newImageUri, name: filename, type });
      }

      // Make sure your backend has a PUT or POST route for editing (e.g. /product/:id)
      await api.put(`/product/${product.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert(
        "Success", 
        "Product updated successfully!", 
        [{ text: "OK", onPress: () => setActiveTab('Home') }]
      );
      
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update the product.");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Navigation Back */}
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={() => setActiveTab('Home')} />
          <Text variant="titleLarge" style={styles.headerTitle}>Edit Item</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            
            <Surface style={styles.editBadge}>
              <Text style={styles.editText}>✏️ Editing: {product.name}</Text>
            </Surface>

            {/* 📸 IMAGE UPLOAD UI */}
            <View style={styles.imagePickerContainer}>
              <TouchableRipple onPress={handleImagePick} style={styles.imagePlaceholder}>
                {newImageUri ? (
                  <Image source={{ uri: newImageUri }} style={styles.productImage} />
                ) : existingImageUrl ? (
                  <Image source={{ uri: existingImageUrl }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholderContent}>
                    <IconButton icon="camera-plus" size={30} iconColor="#888" />
                    <Text style={{ color: '#888' }}>Add Photo</Text>
                  </View>
                )}
              </TouchableRipple>
              {(newImageUri || existingImageUrl) && (
                <Button mode="text" onPress={handleImagePick}>
                  Change Photo
                </Button>
              )}
            </View>

            <View style={styles.scanRow}>
              <TextInput label="Parent Barcode / S/N *" value={code} onChangeText={setCode} mode="outlined" style={styles.flexInput} />
              <IconButton icon="barcode-scan" mode="contained" containerColor="#007AFF" iconColor="#fff" size={30} onPress={() => { setActiveScannerTarget('main'); setScannerVisible(true); }} />
            </View>

            <TextInput label="Product Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />

            <View style={styles.row}>
              <TextInput label="Selling Price (₹) *" value={price} onChangeText={setPrice} mode="outlined" keyboardType="numeric" style={[styles.flexInput, { marginRight: 10 }]} />
              <TextInput label="Cost Price (₹)" value={costPrice} onChangeText={setCostPrice} mode="outlined" keyboardType="numeric" style={styles.flexInput} />
            </View>

            {/* 🚨 ADJUSTMENT UI: Current + New = Total */}
            <View style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Stock Adjustment</Text>
            
            <View style={styles.quantityBreakdownRow}>
              <View style={styles.qtyBoxStat}>
                <Text style={styles.qtyBoxLabel}>Current</Text>
                <Text style={styles.qtyBoxValueScanned}>{currentQuantity}</Text>
              </View>
              
              <Text style={styles.mathSymbol}>+</Text>

              <View style={styles.qtyBoxStat}>
                <Text style={styles.qtyBoxLabel}>Scanned</Text>
                <Text style={styles.qtyBoxValueScanned}>{scannedSerials.length}</Text>
              </View>
              
              <Text style={styles.mathSymbol}>+</Text>
              
              <View style={styles.qtyBoxInput}>
                <TextInput 
                  label="Adjustment" 
                  value={manualQuantity} 
                  onChangeText={setManualQuantity} 
                  mode="outlined" 
                  keyboardType="numeric" 
                  style={{ backgroundColor: '#fff' }}
                  placeholder="e.g. 5 or -2"
                />
              </View>
              
              <Text style={styles.mathSymbol}>=</Text>
              
              <View style={styles.qtyBoxStatTotal}>
                <Text style={styles.qtyBoxLabel}>New Total</Text>
                <Text style={styles.qtyBoxValueTotal}>
                  {currentQuantity + scannedSerials.length + (parseFloat(manualQuantity) || 0)}
                </Text>
              </View>
            </View>

            <Text variant="labelMedium" style={[styles.unitLabel, {marginTop: 12}]}>Select Unit *</Text>
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
            <Text variant="titleMedium" style={styles.sectionTitle}>Add New Serialized Stock</Text>
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
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Restock Details</Text>
            <TextInput label="Supplier / Vendor" value={supplier} onChangeText={setSupplier} mode="outlined" style={styles.input} />
            <TextInput label="Invoice Number" value={invoiceNumber} onChangeText={setInvoiceNumber} mode="outlined" style={styles.input} />

            <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.submitBtn} contentStyle={{ paddingVertical: 8 }}>
              Save Changes
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
  container: { padding: 16, paddingBottom: 80, backgroundColor: '#f4f6f8' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontWeight: 'bold', marginLeft: 8 },
  card: { backgroundColor: '#fff', elevation: 3 },
  editBadge: { backgroundColor: '#e3f2fd', padding: 8, borderRadius: 6, marginBottom: 16, alignItems: 'center' },
  editText: { color: '#1565c0', fontWeight: 'bold' },
  
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
  
  // Quantity Breakdown UI Styles
  quantityBreakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  qtyBoxStat: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
  qtyBoxInput: { flex: 1.5 },
  qtyBoxStatTotal: { flex: 1.2, alignItems: 'center', paddingVertical: 10, backgroundColor: '#e8f5e9', borderRadius: 8 },
  qtyBoxLabel: { color: '#555', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  qtyBoxValueScanned: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  qtyBoxValueTotal: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' },
  mathSymbol: { fontSize: 18, marginHorizontal: 6, color: '#888' },

  unitLabel: { marginBottom: 8, color: '#555', fontWeight: 'bold' },
  unitContainer: { marginBottom: 8, flexDirection: 'row' },
  unitChip: { marginRight: 8 },
  serialChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  serialChip: { backgroundColor: '#f0f0f0' },
  submitBtn: { marginTop: 10, borderRadius: 8, backgroundColor: '#007AFF' }
});