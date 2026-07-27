import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Searchbar, Chip, Card, ActivityIndicator } from 'react-native-paper';
import api from '../api/client';

export default function PurchasesHistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Today');
  const [loading, setLoading] = useState(false);
  const [Purchases, setPurchases] = useState([]);

  // The filters you requested
  const timeFilters = ['Today', '1 Week', '1 Month', '6 Months', '1 Year', 'Custom'];

  const fetchPurchasesHistory = async () => {
    setLoading(true);
    try {
      // We will build this backend route next!
      // const response = await api.get(`/api/Purchases/history?filter=${activeFilter}&search=${searchQuery}`);
      // setPurchases(response.data);
    } catch (error) {
      console.error("Failed to fetch Purchases history");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data whenever the filter or search query changes
  useEffect(() => {
    fetchPurchasesHistory();
  }, [activeFilter, searchQuery]);

  return (
    <View style={styles.container}>
      
      {/* 1. TEXT SEARCH BAR */}
      <Searchbar
        placeholder="Search invoice, customer, or item..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* 2. DATE FILTERS */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {timeFilters.map((filter) => (
            <Chip
              key={filter}
              selected={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
              style={styles.chip}
              textStyle={{ color: activeFilter === filter ? '#fff' : '#333' }}
              selectedColor="#007AFF"
            >
              {filter}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* 3. Purchases LIST */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : Purchases.length === 0 ? (
          <Text style={styles.emptyText}>No Purchases found for this period.</Text>
        ) : (
          Purchases.map((sale) => (
            <Card key={sale.id} style={styles.saleCard}>
              <Card.Title 
                title={`Invoice: ${sale.id.substring(0, 8)}`} 
                subtitle={`Date: ${new Date(sale.created_at).toLocaleDateString()}`}
                right={() => <Text style={styles.amountText}>₹{sale.total_amount}</Text>}
              />
              <Card.Content>
                <Text variant="bodyMedium">Customer: {sale.customer_info?.name || 'Walk-in'}</Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>Payment: {sale.payment_method}</Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  searchBar: { marginBottom: 12, backgroundColor: '#fff', elevation: 2 },
  filterContainer: { marginBottom: 16, maxHeight: 40 },
  chip: { marginRight: 8, backgroundColor: '#e0e0e0' },
  listContainer: { paddingBottom: 40 },
  saleCard: { marginBottom: 10, backgroundColor: '#fff', elevation: 2 },
  amountText: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', marginRight: 16 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 }
});