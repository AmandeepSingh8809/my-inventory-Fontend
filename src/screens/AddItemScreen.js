import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, Surface, IconButton } from 'react-native-paper';
import api from '../api/client';
import BarcodeScannerModal from '../components/BarcodeScannerModal';

export default function AddItemScreen({ setActiveTab }) {
  // Core Product States
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // NEW: Purchase Detail States
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // UI States
  const [scannerVisible, setScannerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExistingItem, setIsExistingItem] = useState(false);

  // 1. Lookup Logic for Barcodes
  const lookupBarcode = async (searchCode) => {
    try {
      const response = await api.get(`/search?query=${searchCode}`);
      const results = response.data;
      
      // Find an exact match for the barcode
      const exactMatch = results.find(item => item.code === searchCode);
      
      if (exactMatch) {
        // Auto-fill the fields!
        setName(exactMatch.name);
        setPrice(String(exactMatch.price || ''));
        // Database might return cost_price or costPrice depending on your exact SQL select
        setCostPrice(String(exactMatch.costPrice || exactMatch.cost_price || '')); 
        setIsExistingItem(true);
      } else {
        setIsExistingItem(false);
      }
    } catch (error) {
      console.log("Lookup failed, assuming new item.");
      setIsExistingItem(false);
    }
  };

  // 2. Scanner Handlers
  const handleScanSuccess = (scannedCode) => {
    setScannerVisible(false);
    const cleanCode = scannedCode.replace(/[\r\n\t]/g, '').trim();
    setCode(cleanCode);
    lookupBarcode(cleanCode);
  };

  // 3. Manual Text Input Handler (for physical scanners)
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

    setLoading(true);

    try {
      // 🚨 Ensure the URL matches your server routes (e.g. /addProduct or /api/product)
      await api.post('/addProduct', {
        code,
        name,
        price: parseFloat(price),
        costPrice: parseFloat(costPrice || 0),
        quantity: parseInt(quantity),
        unit_id: '1', // Defaulting to 1 if you aren't using a dropdown yet
        supplier: supplier.trim() || 'Walk-in / Unknown',
        invoiceNumber: invoiceNumber.trim() || null
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
                onPress={() => setScannerVisible(true)} 
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
        onClose={() => setScannerVisible(false)} 
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
  flexInput: { flex: 1, backgroundColor: '#fff' },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 16 },
  sectionTitle: { marginBottom: 12, color: '#555', fontWeight: 'bold' },
  submitBtn: { marginTop: 10, borderRadius: 8, backgroundColor: '#007AFF' }
});