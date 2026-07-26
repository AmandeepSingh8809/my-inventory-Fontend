import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import api from '../api/client';
import BarcodeScannerModal from '../components/BarcodeScannerModal'; 

export default function AddItemScreen({ setActiveTab }) {
  const [name, setName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  
  // NEW: State for the selected unit. Default to 1 (Assuming 1 = 'pcs' in your DB)
  const [unitId, setUnitId] = useState(1); 
  const [scannerVisible, setScannerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Hardcoded units for the UI (These should match the IDs in your PostgreSQL 'unit' table)
  const availableUnits = [
    { id: 1, label: 'pcs' },
    { id: 2, label: 'kg' },
    { id: 3, label: 'liter' },
    { id: 4, label: 'box' }
  ];

  const saveProduct = async () => {
    if (!name || !itemCode || !price) {
      Alert.alert('Missing Details', 'Please fill out Name, Code, and Price.');
      return;
    }

    setIsSaving(true);

    try {
      const newProductPayload = {
        name,
        code: itemCode,
        quantity: Number(quantity || 0),     // Cast to Number for the DB
        price: Number(price),
        costPrice: Number(costPrice || 0),
        unit_id: unitId,                     // Pass the selected unit_id to the backend
        category: 'General',
      };

      await api.post('/addProduct', newProductPayload);

      Alert.alert('Success', `${name} has been added to your inventory!`);

      // Reset form
      setName('');
      setItemCode('');
      setQuantity('');
      setPrice('');
      setCostPrice('');
      setUnitId(1);
      setActiveTab('Home');

    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert('Connection Error', 'Could not save the product.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.screenTitle}>New Product Entry</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TextInput
          mode="outlined"
          label="Item Code / Barcode"
          value={itemCode}
          onChangeText={setItemCode}
          style={{ flex: 1, marginRight: 8, backgroundColor: '#fff' }}
        />
        <Button mode="contained" onPress={() => setScannerVisible(true)} style={{ height: 50, justifyContent: 'center' }}>
          Scan
        </Button>
      </View>

      <TextInput mode="outlined" label="Product Name" value={name} onChangeText={setName} style={styles.input} />
      
      {/* Quantity Input */}
      <TextInput 
        mode="outlined" 
        label="Opening Quantity" 
        value={quantity} 
        onChangeText={setQuantity} 
        keyboardType="numeric" 
        style={styles.input} 
      />

      {/* UNIT SELECTOR CHIPS */}
      <Text variant="labelLarge" style={styles.unitLabel}>Select Unit:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {availableUnits.map((unit) => (
          <Chip
            key={unit.id}
            selected={unitId === unit.id}
            onPress={() => setUnitId(unit.id)}
            style={styles.chip}
            showSelectedOverlay
          >
            {unit.label}
          </Chip>
        ))}
      </ScrollView>

      <TextInput mode="outlined" label="Selling Price (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} />
      <TextInput mode="outlined" label="Cost Price (₹) - Optional" value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" style={styles.input} />

      <Button 
        mode="contained" 
        onPress={saveProduct} 
        loading={isSaving}
        disabled={isSaving}
        style={styles.saveBtn}
      >
        {isSaving ? 'Saving...' : 'Save Product'}
      </Button>

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={(scannedCode) => setItemCode(scannedCode)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  screenTitle: { fontWeight: 'bold', marginBottom: 20 },
  input: { marginBottom: 12, backgroundColor: '#fff' },
  unitLabel: { marginBottom: 8, color: '#555', fontWeight: 'bold' },
  chipRow: { marginBottom: 16, maxHeight: 40 },
  chip: { marginRight: 8, backgroundColor: '#e0e0e0' },
  saveBtn: { marginTop: 10, paddingVertical: 6, marginBottom: 40 }
});