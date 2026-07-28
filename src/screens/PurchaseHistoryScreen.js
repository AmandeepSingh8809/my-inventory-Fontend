import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Text, Searchbar, Chip, Card, ActivityIndicator, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api/client';

export default function PurchaseHistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Today');
  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState([]);

  // DATE PICKER STATES
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const timeFilters = ['Today', '1 Week', '1 Month', '6 Months', '1 Year', 'Custom'];

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchPurchaseHistory = async () => {
    setLoading(true);
    try {
      let url = `/purchases/history?filter=${activeFilter}&search=${searchQuery}`;
      
      if (activeFilter === 'Custom') {
        url += `&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;
      }

      const response = await api.get(url);
      setPurchases(response.data);
    } catch (error) {
      console.error("Failed to fetch purchase history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeFilter !== 'Custom') {
      fetchPurchaseHistory();
    }
  }, [activeFilter, searchQuery]);

  const onChangeStart = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };

  const onChangeEnd = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search product, code, or supplier..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

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

      {/* CUSTOM DATE UI */}
      {activeFilter === 'Custom' && (
        <View style={styles.customDateContainer}>
          <TouchableOpacity style={styles.dateBtnWrapper} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dateBtnWrapper} onPress={() => setShowEndPicker(true)}>
            <Text style={styles.dateLabel}>End Date</Text>
            <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
          </TouchableOpacity>

          <Button mode="contained" onPress={fetchPurchaseHistory} style={styles.goBtn}>
            Go
          </Button>

          {showStartPicker && (
            <DateTimePicker value={startDate} mode="date" display="default" onChange={onChangeStart} />
          )}
          {showEndPicker && (
            <DateTimePicker value={endDate} mode="date" display="default" onChange={onChangeEnd} />
          )}
        </View>
      )}

      {/* STOCK IN LIST */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : purchases.length === 0 ? (
          <Text style={styles.emptyText}>No stock entries found for this period.</Text>
        ) : (
          purchases.map((item, index) => (
            <Card key={item.id || index} style={styles.purchaseCard}>
              <Card.Title 
                title={item.product_name || 'Unknown Product'} 
                subtitle={`Qty Added: ${item.quantity} | Date: ${new Date(item.created_at).toLocaleDateString()}`}
                right={() => <Text style={styles.amountText}>₹{item.total_cost}</Text>}
              />
              <Card.Content>
                <Text variant="bodyMedium">Supplier: {item.supplier || 'Not specified'}</Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>Unit Cost: ₹{item.unit_cost}</Text>
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
  
  customDateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' },
  dateBtnWrapper: { flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 8, marginRight: 8, elevation: 1, borderWidth: 1, borderColor: '#ddd' },
  dateLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  goBtn: { justifyContent: 'center', borderRadius: 8, height: 48 },

  listContainer: { paddingBottom: 40 },
  purchaseCard: { marginBottom: 10, backgroundColor: '#fff', elevation: 2 },
  amountText: { fontSize: 16, fontWeight: 'bold', color: '#d32f2f', marginRight: 16 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 }
});