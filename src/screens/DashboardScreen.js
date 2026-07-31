import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Text, Searchbar, Chip, Card, FAB } from 'react-native-paper';
import api, { getImageUrl } from '../api/client';


export default function DashboardScreen({ setActiveTab }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [hotSelling, setHotSelling] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayItemsSold, setTodayItemsSold] = useState(0);
  const [todayProfit,setTodayProfit]= useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['All', 'Groceries', 'Electronics', 'Clothing', 'Hardware'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsResponse = await api.get('/sales/today');
        setTodayRevenue(statsResponse.data.data.totalRevenue || 0);
        setTodayItemsSold(statsResponse.data.data.totalItemsSold || 0);
        setTodayProfit(statsResponse.data.data.totalProfit || 0);
      } catch (err) {
        console.warn("Stats API error:", err);
      }

      try {
        const allResponse = await api.get('/allProduct');
        setAllProducts(allResponse.data);
      } catch (err) {
        console.error("Error fetching all products:", err);
        setError("Could not load products. Is the Node server running?");
      }

      try {
        const hotResponse = await api.get('/hot-selling');
        setHotSelling(hotResponse.data);
      } catch (err) {
        console.warn("Hot selling API not ready yet. Skipping.");
        setHotSelling([]); 
      }
      
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <View style={styles.container}>
      
      {/* DAILY STATS SUMMARY CARD */}
      <Card style={styles.statsCard}>
        <Card.Content style={styles.statsContent}>
          <View style={styles.statBox}>
            <Text variant="titleSmall" style={styles.statLabel}>Today's Revenue</Text>
            <Text variant="headlineMedium" style={styles.statValuePositive}>
              ₹{todayRevenue.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.verticalDivider} />
          
          <View style={styles.statBox}>
            <Text variant="titleSmall" style={styles.statLabel}>Items Sold</Text>
            <Text variant="headlineMedium" style={styles.statValueNeutral}>
              {todayItemsSold}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statBox}>
            <Text variant="titleSmall" style={styles.statLabel}>Today's profit</Text>
            <Text variant="headlineMedium" style={styles.statValueNeutral}>
              {todayProfit}
            </Text>
          </View>
        </Card.Content>
      </Card>

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
                    {/* 📸 HOT SELLING IMAGE */}
                    {product.image_url ? (
                      <Image 
                        source={{ uri: getImageUrl(product.image_url) }} 
                        style={styles.hotImage} 
                        resizeMode="cover"
                      />
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
            )}

            <Text variant="titleMedium" style={styles.sectionHeader}>📦 All Inventory Items</Text>
            {allProducts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Your inventory is empty!</Text>
                
              </View>
            ) : (
              allProducts.map((product) => (
                <Card key={product.id} style={styles.itemCard}>
                  <Card.Title 
                    title={product.name} 
                    subtitle={`Code: ${product.code} | Stock: ${product.quantity} ${product.unit_name} `} 
                    /* 📸 LIST ITEM IMAGE */
                    left={() => 
                      product.image_url ? (
                        <Image 
                          source={{ uri: getImageUrl(product.image_url) }} 
                          style={styles.listImage} 
                        />
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
              ))
            )}
          </>
        )}
      </ScrollView>

    
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  
  statsCard: { marginBottom: 16, backgroundColor: '#ffffff', elevation: 4, borderRadius: 12 },
  statsContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  statBox: { flex: 1, alignItems: 'center' },
  verticalDivider: { width: 1, height: '80%', backgroundColor: '#e0e0e0', marginHorizontal: 10 },
  statLabel: { color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValuePositive: { color: '#2e7d32', fontWeight: 'bold' }, 
  statValueNeutral: { color: '#007AFF', fontWeight: 'bold' },  

  searchBar: { marginBottom: 12, backgroundColor: '#fff', elevation: 2 },
  chipRow: { marginBottom: 16, maxHeight: 40 },
  chip: { marginRight: 8, backgroundColor: '#e0e0e0' },
  sectionHeader: { marginVertical: 12, fontWeight: 'bold', color: '#333' },
  
  // 📸 Hot Selling Image Styles
  hotCard: { width: 160, marginRight: 12, backgroundColor: '#fff', elevation: 2, overflow: 'hidden' },
  hotImage: { height: 100, width: '100%', backgroundColor: '#eee' },
  hotImageFallback: { height: 100, width: '100%', backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  hotFallbackText: { fontSize: 32, fontWeight: 'bold', color: '#1565c0' },

  // 📸 List Image Styles
  itemCard: { marginBottom: 12, backgroundColor: '#fff', elevation: 2 },
  listImage: { width: 45, height: 45, borderRadius: 8 },
  listFallback: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  listFallbackText: { fontSize: 20, fontWeight: 'bold', color: '#1565c0' },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#007AFF' },
  emptyBox: { padding: 20, alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  emptySubtext: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' }
});