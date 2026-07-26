import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Chip, Card, FAB } from 'react-native-paper';
// IMPORT YOUR CUSTOM API CLIENT
import api from '../api/client';

export default function DashboardScreen({ setActiveTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [hotSelling, setHotSelling] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['All', 'Groceries', 'Electronics', 'Clothing', 'Hardware'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Fetch All Products (The one we know works)
      try {
        const allResponse = await api.get('/allProduct');
        setAllProducts(allResponse.data);
      } catch (err) {
        console.error("Error fetching all products:", err);
        setError("Could not load products. Is the Node server running?");
      }

      // 2. Fetch Hot Selling (If it fails, it just leaves the array empty)
      try {
        const hotResponse = await api.get('/hot-selling');
        setHotSelling(hotResponse.data);
      } catch (err) {
        console.warn("Hot selling API not ready yet. Skipping.");
        setHotSelling([]); // Fails gracefully!
      }
      
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by name or code..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        icon="magnify"
        style={styles.searchBar}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {categories.map((cat) => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
            style={styles.chip}
          >
            {cat}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}
        {error && <Text style={{ color: 'red', marginLeft: 10 }}>{error}</Text>}

        {!loading && !error && (
          <>
            <Text variant="titleMedium" style={styles.sectionHeader}>🔥 Hot Selling Products</Text>
            {hotSelling.length === 0 ? (
              <Text style={styles.emptyText}>No sales data yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {hotSelling.map((product) => (
                  <Card key={product.id} style={styles.hotCard}>
                    <Card.Content>
                      <Text variant="titleSmall" numberOfLines={1}>{product.name}</Text>
                      <Text variant="bodySmall">{product.salesCount} Units Sold</Text>
                      <Text variant="labelLarge" style={{ color: '#007AFF' }}>₹{product.price}</Text>
                    </Card.Content>
                  </Card>
                ))}
              </ScrollView>
            )}

            <Text variant="titleMedium" style={styles.sectionHeader}>📦 All Inventory Items</Text>
            {allProducts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Your inventory is empty!</Text>
                <Text style={styles.emptySubtext}>Tap the + button below to add your first product.</Text>
              </View>
            ) : (
              allProducts.map((product) => (
                <Card key={product.id} style={styles.itemCard}>
                  <Card.Title 
                    title={product.name} 
                    subtitle={`Code: ${product.code} | Stock: ${product.quantity} units`} 
                  />
                  <Card.Content>
                    <Text variant="titleMedium">Selling Price: ₹{product.price}</Text>
                  </Card.Content>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setActiveTab('AddItem')}
      />
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchBar: { marginBottom: 12, backgroundColor: '#fff' },
  chipRow: { marginBottom: 16, maxHeight: 40 },
  chip: { marginRight: 8 },
  sectionHeader: { marginVertical: 12, fontWeight: 'bold' },
  hotCard: { width: 160, marginRight: 12, backgroundColor: '#fff' },
  itemCard: { marginBottom: 12, backgroundColor: '#fff' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#007AFF' },
  emptyBox: { padding: 20, alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  emptySubtext: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' }
});