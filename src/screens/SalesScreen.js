import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Searchbar, IconButton, List, Divider } from 'react-native-paper';
import api from '../api/client';
import BarcodeScannerModal from '../components/BarcodeScannerModal'; // Import your scanner

export default function SalesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Scanner State
  const [scannerVisible, setScannerVisible] = useState(false);
  
  // The item they tapped on (or scanned)
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Checkout States
  const [sellQuantity, setSellQuantity] = useState("1");
  const [sellPrice, setSellPrice] = useState("0"); 
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Manual Search as they type
  const executeSearch = async (text) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]); 
      return;
    }

    try {
      const response = await api.get(`/search?query=${text}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // 2. Barcode Scanner Success Handler
  const handleScanSuccess = async (scannedCode) => {
    setScannerVisible(false); // Close modal
    setSearchQuery(scannedCode); // Update search bar text
    
    try {
      const response = await api.get(`/search?query=${scannedCode}`);
      const results = response.data;
      
      // Smart Auto-Select: If the barcode returns exactly one match, skip the list!
      if (results.length === 1) {
        setSelectedProduct(results[0]);
        setSellPrice(String(results[0].price));
        setSearchResults([]);
        setSearchQuery('');
      } else {
        // If multiple items somehow share part of the code, show the list
        setSearchResults(results);
      }
    } catch (error) {
      Alert.alert("Error", "Could not find scanned item.");
    }
  };

  // 3. Process the Sale
  const handleCheckout = async () => {
    const qty = parseInt(sellQuantity) || 1;
    const finalPrice = parseFloat(sellPrice) || 0;

    if (qty > selectedProduct.quantity) {
      Alert.alert("Stock Error", `Only ${selectedProduct.quantity} left in stock!`);
      return;
    }

    if (finalPrice <= 0) {
      Alert.alert("Invalid Price", "Selling price must be greater than 0.");
      return;
    }

    setIsProcessing(true);

    try {
      await api.post('/api/sales', {
        productId: selectedProduct.id,
        quantity: qty,
        unitPrice: finalPrice,
        totalAmount: finalPrice * qty, 
        paymentMethod: 'CASH'
      });
      
      Alert.alert('Success', 'Sale recorded!');
      
      // Reset for the next customer
      setSelectedProduct(null);
      setSearchQuery('');
      setSellQuantity("1");
      setSellPrice("0");

    } catch (error) {
      Alert.alert('Error', 'Failed to process sale.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* STEP 1: SEARCH BAR & SCAN BUTTON */}
      {!selectedProduct && (
        <>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search code or name..."
              onChangeText={executeSearch}
              value={searchQuery}
              style={styles.searchBar}
              autoFocus
            />
            <Button 
              mode="contained" 
              icon="barcode-scan" 
              onPress={() => setScannerVisible(true)}
              style={styles.scanBtn}
            >
              Scan
            </Button>
          </View>

          {/* THE MATCHING LIST */}
          <ScrollView style={styles.resultsList}>
            {searchResults.map((item) => (
              <React.Fragment key={item.id}>
                <List.Item
                  title={item.name}
                  description={`Code: ${item.code} | Stock: ${item.quantity} ${item.unit_name || ''}`}
                  right={() => <Text style={styles.priceTag}>₹{item.price}</Text>}
                  onPress={() => {
                    // Tap to Select
                    setSelectedProduct(item);
                    setSellPrice(String(item.price)); 
                    setSearchResults([]); 
                    setSearchQuery(''); 
                  }}
                />
                <Divider />
              </React.Fragment>
            ))}
          </ScrollView>
        </>
      )}

      {/* STEP 2: THE SALE PAGE */}
      {selectedProduct && (
        <Card style={styles.checkoutCard}>
          <Card.Title 
            title={selectedProduct.name} 
            subtitle={`Available Stock: ${selectedProduct.quantity} ${selectedProduct.unit_name || ''}`}
            right={(props) => (
              <IconButton {...props} icon="close" onPress={() => setSelectedProduct(null)} />
            )}
          />
          <Card.Content>
            
            <View style={styles.inputRow}>
              <Text variant="titleMedium">Selling Price (₹):</Text>
              <TextInput 
                mode="outlined"
                value={sellPrice}
                onChangeText={setSellPrice}
                keyboardType="numeric"
                style={styles.priceInput}
                dense
              />
            </View>

            <View style={styles.inputRow}>
              <Text variant="titleMedium">Quantity:</Text>
              <View style={styles.qtyControls}>
                <IconButton 
                  icon="minus" 
                  mode="outlined"
                  onPress={() => setSellQuantity(String(Math.max(1, parseInt(sellQuantity) - 1)))}
                />
                <TextInput 
                  value={String(sellQuantity)}
                  onChangeText={setSellQuantity}
                  keyboardType="numeric"
                  style={styles.qtyInput}
                  dense
                />
                <IconButton 
                  icon="plus" 
                  mode="outlined"
                  onPress={() => setSellQuantity(String(parseInt(sellQuantity) + 1))}
                />
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text variant="titleLarge">Total:</Text>
              <Text variant="headlineMedium" style={styles.totalText}>
                ₹{((parseFloat(sellPrice) || 0) * (parseInt(sellQuantity) || 1)).toLocaleString()}
              </Text>
            </View>

            <Button 
              mode="contained" 
              buttonColor="#2e7d32"
              onPress={handleCheckout} 
              loading={isProcessing}
              disabled={isProcessing}
              style={styles.checkoutBtn}
            >
              Confirm Sale
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* THE CAMERA MODAL */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={handleScanSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchBar: { flex: 1, marginRight: 8, backgroundColor: '#fff' },
  scanBtn: { height: 50, justifyContent: 'center', borderRadius: 8 },
  resultsList: { flex: 1, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },
  priceTag: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', alignSelf: 'center', marginRight: 10 },
  checkoutCard: { backgroundColor: '#fff', elevation: 4 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  priceInput: { width: 120, backgroundColor: '#fff', textAlign: 'right' },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyInput: { width: 60, textAlign: 'center', marginHorizontal: 8, backgroundColor: '#f0f0f0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderColor: '#eee', marginTop: 10 },
  totalText: { fontWeight: 'bold', color: '#2e7d32' },
  checkoutBtn: { marginTop: 25, paddingVertical: 8 }
});