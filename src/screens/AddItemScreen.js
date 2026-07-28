import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, Surface, IconButton, Chip } from 'react-native-paper';
import api from '../api/client';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function AddItemScreen({ setActiveTab }) {
  // Core Product States
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // Unit State (Defaults to '6' which is 'pcs')
  const [unitId, setUnitId] = useState('6'); 

  // Bulk Carton States
  const [cartonCode, setCartonCode] = useState('');
  const [cartonMultiplier, setCartonMultiplier] = useState('');
  
  // Purchase Detail States
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // UI States
  const [scannerVisible, setScannerVisible] = useState(false);
  const [activeScannerTarget, setActiveScannerTarget] = useState(null); // 🚨 NEW: Tracks 'main' or 'carton'
  const [loading, setLoading] = useState(false);
  const [isExistingItem, setIsExistingItem] = useState(false);

  // Unit Master List mapped to your database IDs
  const unitList = [
    { id: '1', label: 'kg' },
    { id: '2', label: 'g' },
    { id: '3', label: 'mg' },
    { id: '4', label: 'litre' },
    { id: '5', label: 'ml' },
    { id: '6', label: 'pcs' },
    { id: '7', label: 'dozen' },
    { id: '8', label: 'pack' }
  ];

  // 1. Lookup Logic for Barcodes
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

        if (exactMatch.carton_code === searchCode && exactMatch.carton_multiplier) {
          setQuantity(String(exactMatch.carton_multiplier));
        }
        if (exactMatch.carton_code) setCartonCode(exactMatch.carton_code);
        if (exactMatch.carton_multiplier) setCartonMultiplier(String(exactMatch.carton_multiplier));

        setIsExistingItem(true);
      } else {
        setIsExistingItem(false);
      }
    } catch (error) {
      console.log("Lookup failed, assuming new item.");
      setIsExistingItem(false);
    }
  };

  // 2. Scanner Handlers (🚨 UPDATED)
  const handleScanSuccess = (scannedCode) => {
    setScannerVisible(false);
    const cleanCode = scannedCode.replace(/[\r\n\t]/g, '').trim();

    // Check which scanner button was pressed
    if (activeScannerTarget === 'carton') {
      setCartonCode(cleanCode);
    } else {
      setCode(cleanCode);
      lookupBarcode(cleanCode);
    }
    
    // Reset the target
    setActiveScannerTarget(null);
  };

  // 3. Manual Text Input Handler
  const handleCodeChange = (text) => {
    const cleanText = text.replace(/[\r\n\t]/g, '').trim();
    setCode(cleanText);
    if (cleanText.length > 2) {
      lookupBarcode(cleanText);
    } else {
      setIsExistingItem(false);
    }
  };

  // 4. Submit to Backend
 const handleSubmit = async () => {
    if (!code || !name || !price || !quantity) {
      Alert.alert("Missing Fields", "Code, Name, Price, and Quantity are required.");
      return;
    }

    // 🚨 NEW: Strict Decimal Validation
    const integerOnlyUnits = ['6', '7', '8']; // pcs, dozen, pack
    if (integerOnlyUnits.includes(String(unitId)) && !Number.isInteger(parseFloat(quantity))) {
      Alert.alert(
        "Invalid Quantity", 
        "Pieces, dozens, and packs must be whole numbers (e.g., 1, 2, 5). Decimals are not allowed for this unit."
      );
      return; // Stop the submission!
    }

    setLoading(true);

    try {
      await api.post('/addProduct', {
        code,
        name,
        price: parseFloat(price),
        costPrice: parseFloat(costPrice || 0),
        quantity: parseInt(quantity),
        unit_id: parseInt(unitId), 
        supplier: supplier.trim() || 'Walk-in / Unknown',
        invoiceNumber: invoiceNumber.trim() || null,
        cartonCode: cartonCode.trim() || null,
        cartonMultiplier: cartonMultiplier ? parseInt(cartonMultiplier) : 1
      });

      Alert.alert(
        "Success", 
        isExistingItem ? "Stock updated successfully!" : "New product created successfully!"
      );
      
      // Reset the form
      setCode('');
      setName('');
      setPrice('');
      setCostPrice('');
      setQuantity('');
      setUnitId('6');
      setCartonCode('');
      setCartonMultiplier('');
      setSupplier('');
      setInvoiceNumber('');
      setIsExistingItem(false);
      
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save the product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        
        <Card style={styles.card}>
          <Card.Content>
            
            {/* STATUS BADGE */}
            {isExistingItem ? (
              <Surface style={styles.restockBadge}>
                <Text style={styles.restockText}>📦 Restocking Existing Item</Text>
              </Surface>
            ) : (
              <Surface style={styles.newBadge}>
                <Text style={styles.newText}>✨ Creating New Item</Text>
              </Surface>
            )}

            <View style={styles.scanRow}>
              <TextInput 
                label="Barcode / S/N *"
                value={code}
                onChangeText={handleCodeChange}
                mode="outlined"
                style={styles.flexInput}
                autoFocus
              />
              <IconButton 
                icon="barcode-scan" 
                mode="contained"
                containerColor="#007AFF"
                iconColor="#fff"
                size={30}
                onPress={() => {
                  setActiveScannerTarget('main');
                  setScannerVisible(true);
                }} 
              />
            </View>

            <TextInput 
              label="Product Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.row}>
              <TextInput 
                label="Selling Price (₹) *"
                value={price}
                onChangeText={setPrice}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.flexInput, { marginRight: 10 }]}
              />
              <TextInput 
                label="Cost Price (₹)"
                value={costPrice}
                onChangeText={setCostPrice}
                mode="outlined"
                keyboardType="numeric"
                style={styles.flexInput}
              />
            </View>

            <TextInput 
              label="Quantity Added *"
              value={quantity}
              onChangeText={setQuantity}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            {/* UNIT SELECTOR */}
            <Text variant="labelMedium" style={styles.unitLabel}>Select Unit *</Text>
            <View style={styles.unitContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {unitList.map((u) => (
                  <Chip
                    key={u.id}
                    selected={unitId === u.id}
                    onPress={() => setUnitId(u.id)}
                    style={[styles.unitChip, { backgroundColor: unitId === u.id ? '#007AFF' : '#e0e0e0' }]}
                    textStyle={{ color: unitId === u.id ? '#fff' : '#333' }}
                    showSelectedOverlay={true}
                  >
                    {u.label}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            <View style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Bulk / Carton Settings (Optional)</Text>

            {/* 🚨 NEW: CARTON SCANNER ROW */}
            <View style={styles.scanRow}>
              <TextInput 
                label="Carton Barcode"
                value={cartonCode}
                onChangeText={setCartonCode}
                mode="outlined"
                style={styles.flexInput}
              />
              <IconButton 
                icon="barcode-scan" 
                mode="contained"
                containerColor="#007AFF"
                iconColor="#fff"
                size={30}
                onPress={() => {
                  setActiveScannerTarget('carton');
                  setScannerVisible(true);
                }} 
              />
            </View>

            <TextInput 
              label="Units inside"
              value={cartonMultiplier}
              onChangeText={setCartonMultiplier}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>Purchase Details (Optional)</Text>

            <TextInput 
              label="Supplier / Vendor"
              value={supplier}
              onChangeText={setSupplier}
              mode="outlined"
              style={styles.input}
            />

            <TextInput 
              label="Invoice / Bill Number"
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              mode="outlined"
              style={styles.input}
            />

            <Button 
              mode="contained" 
              onPress={handleSubmit} 
              loading={loading}
              disabled={loading}
              style={styles.submitBtn}
              contentStyle={{ paddingVertical: 8 }}
            >
              {isExistingItem ? "Update Stock" : "Save New Product"}
            </Button>

          </Card.Content>
        </Card>

      </ScrollView>

      <BarcodeScannerModal 
        visible={scannerVisible} 
        onClose={() => {
          setScannerVisible(false);
          setActiveScannerTarget(null);
        }} 
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
  scanRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  flexInput: { flex: 1, backgroundColor: '#fff', marginRight: 8 },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 16 },
  sectionTitle: { marginBottom: 12, color: '#555', fontWeight: 'bold' },
  
  // Unit Styles
  unitLabel: { marginBottom: 8, color: '#555', fontWeight: 'bold' },
  unitContainer: { marginBottom: 8, flexDirection: 'row' },
  unitChip: { marginRight: 8 },

  submitBtn: { marginTop: 10, borderRadius: 8, backgroundColor: '#007AFF' }
});