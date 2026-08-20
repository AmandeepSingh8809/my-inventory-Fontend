import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Chip, Card } from 'react-native-paper';
import api, { getImageUrl } from '../api/client';

export default function DashboardScreen({ setActiveTab, setSelectedProduct }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [hotSelling, setHotSelling] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  
  const [stats, setStats] = useState({ revenue: 0, itemsSold: 0, profit: 0 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['All', 'Groceries', 'Electronics', 'Clothing', 'Hardware'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats
      const statsResponse = await api.get('/sales/today');
      setStats({
        revenue: statsResponse.data.data.totalRevenue || 0,
        itemsSold: statsResponse.data.data.totalItemsSold || 0,
        profit: statsResponse.data.data.totalProfit || 0
      });
    } catch (err) {
      console.warn("Stats API error:", err);
    }

    try {
      // 2. Fetch All Products
      const allResponse = await api.get('/allProduct');
      setAllProducts(allResponse.data);
    } catch (err) {
      console.error("Error fetching all products:", err);
      setError("Could not load products. Is the Node server running?");
    }

    try {
      // 3. Fetch Hot Selling
      const hotResponse = await api.get('/hot-selling');
      setHotSelling(hotResponse.data);
    } catch (err) {
      console.warn("Hot selling API not ready yet. Skipping.");
    }
    
    setLoading(false);
  };

  // ==========================================
  // REAL-TIME SEARCH & FILTERING LOGIC
  // ==========================================
  const filteredProducts = allProducts.filter(product => {
    // 1. Search Query Match
    const matchesSearch = 
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.code && product.code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // 2. Category Match (Assuming your product object has a 'category' field)
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleEditProduct = (product) => {
    // Pass the selected product to the parent state and change tab
    if (setSelectedProduct) {
      setSelectedProduct(product);
      setActiveTab('EditItem'); 
    }else{
      alert("Error: setSelectedProduct  is  missing  in mainapp.js");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* 1. DASHBOARD STATS */}
      <Card style={styles.statsCard}>
        <Card.Content style={styles.statsContent}>
          <View style={styles.statBox}>
            <Text variant="titleSmall" style={styles.statLabel}>Today's Revenue</Text>
            <Text variant="headlineMedium" style={styles.statValuePositive}>
              ₹{stats.revenue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statBox}>
            <Text variant="titleSmall" style={styles.statLabel}>Items Sold</Text>
            <Text variant="headlineMedium" style={styles.statValueNeutral}>
              {stats.itemsSold}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statBox}>
            <Text variant="titleSmall" style={styles.statLabel}>Today's Profit</Text>
            <Text variant="headlineMedium" style={styles.statValueNeutral}>
              ₹{stats.profit.toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* 2. SEARCH & FILTER */}
      <Searchbar
        placeholder="Search by name or code..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        icon="magnify"
        style={styles.searchBar}
      />

      <View style={{ maxHeight: 50 }}>
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
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* 3. PRODUCT LISTS */}
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        
        {/* HOT SELLING (Only show if search query is empty) */}
        {!searchQuery && hotSelling.length > 0 && (
          <>
            <Text variant="titleMedium" style={styles.sectionHeader}>🔥 Hot Selling Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {hotSelling.map((product) => (
                <Card key={product.id} style={styles.hotCard} onPress={() => handleEditProduct(product)}>
                  {product.image_url ? (
                    <Image source={{ uri: getImageUrl(product.image_url) }} style={styles.hotImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.hotImageFallback}>
                      <Text style={styles.hotFallbackText}>
                        {product.name ? product.name.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                  )}
                  <Card.Content style={{ paddingTop: 8 }}>
                    <Text variant="titleSmall" numberOfLines={1}>{product.name}</Text>
                    <Text variant="bodySmall">{product.salesCount} Units Sold</Text>
                    <Text variant="labelLarge" style={{ color: '#007AFF' }}>₹{product.price}</Text>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </>
        )}

        {/* ALL / FILTERED PRODUCTS */}
        <Text variant="titleMedium" style={styles.sectionHeader}>
          {searchQuery ? '🔍 Search Results' : '📦 All Inventory Items'}
        </Text>
        
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No products found.</Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <TouchableOpacity key={product.id} activeOpacity={0.8} onPress={() => handleEditProduct(product)}>
              <Card style={styles.itemCard}>
                <Card.Title 
                  title={product.name} 
                  subtitle={`Code: ${product.code} | Stock: ${product.quantity} ${product.unit_name || ''}`} 
                  left={() => 
                    product.image_url ? (
                      <Image source={{ uri: getImageUrl(product.image_url) }} style={styles.listImage} />
                    ) : (
                      <View style={styles.listFallback}>
                        <Text style={styles.listFallbackText}>
                          {product.name ? product.name.charAt(0).toUpperCase() : '?'}
                        </Text>
                      </View>
                    )
                  }
                />
                <Card.Content>
                  <Text variant="titleMedium">Selling Price: ₹{product.price}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  
  statsCard: { marginBottom: 16, backgroundColor: '#ffffff', elevation: 4, borderRadius: 12 },
  statsContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  statBox: { flex: 1, alignItems: 'center' },
  verticalDivider: { width: 1, height: '80%', backgroundColor: '#e0e0e0', marginHorizontal: 10 },
  statLabel: { color: '#666', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValuePositive: { color: '#2e7d32', fontWeight: 'bold' }, 
  statValueNeutral: { color: '#007AFF', fontWeight: 'bold' },  

  searchBar: { marginBottom: 12, backgroundColor: '#fff', elevation: 2 },
  chipRow: { marginBottom: 16 },
  chip: { marginRight: 8, backgroundColor: '#e0e0e0' },
  sectionHeader: { marginVertical: 12, fontWeight: 'bold', color: '#333' },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' },
  
  hotCard: { width: 160, marginRight: 12, backgroundColor: '#fff', elevation: 2, overflow: 'hidden' },
  hotImage: { height: 100, width: '100%', backgroundColor: '#eee' },
  hotImageFallback: { height: 100, width: '100%', backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  hotFallbackText: { fontSize: 32, fontWeight: 'bold', color: '#1565c0' },

  itemCard: { marginBottom: 12, backgroundColor: '#fff', elevation: 2 },
  listImage: { width: 45, height: 45, borderRadius: 8 },
  listFallback: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  listFallbackText: { fontSize: 20, fontWeight: 'bold', color: '#1565c0' },

  emptyBox: { padding: 20, alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
});