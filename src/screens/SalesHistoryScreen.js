import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Text, Searchbar, Chip, Card, ActivityIndicator, Button, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api/client';

export default function SalesHistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Today');
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);

  // DATE PICKER STATES
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const timeFilters = ['Today', '1 Week', '1 Month', '6 Months', '1 Year', 'Custom'];

  // Timezone-safe formatter (converts JS Date object to "YYYY-MM-DD" local time)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchSalesHistory = async () => {
    setLoading(true);
    try {
      let url = `/sales/history?filter=${activeFilter}&search=${searchQuery}`;
      
      if (activeFilter === 'Custom') {
        url += `&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;
      }

      const response = await api.get(url);
      setSales(response.data);
    } catch (error) {
      console.error("Failed to fetch sales history",error.response?.data?.error|| error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeFilter !== 'Custom') {
      fetchSalesHistory();
    }
  }, [activeFilter, searchQuery]);

  // PICKER HANDLERS
  const onChangeStart = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios'); 
    if (selectedDate) setStartDate(selectedDate);
  };

  const onChangeEnd = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  };

  // HELPER: Safely parse customer_info in case it comes back as a JSON string
  const getCustomer = (info) => {
    if (!info) return {};
    if (typeof info === 'object') return info;
    try { return JSON.parse(info); } catch (e) { return {}; }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search invoice, customer, or item..."
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

      {/* THE CUSTOM DATE PICKER UI */}
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

          <Button mode="contained" onPress={fetchSalesHistory} style={styles.goBtn}>
            Go
          </Button>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onChangeStart}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={onChangeEnd}
            />
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : sales.length === 0 ? (
          <Text style={styles.emptyText}>No sales found for this period.</Text>
        ) : (
          sales.map((sale) => {
            const customer = getCustomer(sale.customer_info);
            const formattedDate = new Date(sale.created_at).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short'
            });

            return (
              <Card key={sale.id} style={styles.saleCard}>
                <Card.Content>
                  
                  {/* HEADER: Product & Total */}
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#333' }}>
                        {sale.product_name || 'Unknown Item'}
                      </Text>
                      <Text variant="bodySmall" style={{ color: '#666' }}>
                        Code: {sale.product_code || 'N/A'}
                      </Text>
                    </View>
                    <Text style={styles.amountText}>
                      ₹{parseFloat(sale.total_amount).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <Divider style={styles.divider} />

                  {/* MATH BREAKDOWN */}
                  <View style={styles.rowBetween}>
                    <Text variant="bodyMedium" style={{ color: '#555' }}>
                      {/* parseFloat cleanly drops trailing zeroes from 2.500 -> 2.5 */}
                      Qty: {parseFloat(sale.quantity)} × ₹{parseFloat(sale.unit_price).toLocaleString('en-IN')}
                    </Text>
                    <View style={styles.paymentBadge}>
                      <Text style={styles.paymentText}>{sale.payment_method}</Text>
                    </View>
                  </View>

                  {/* CUSTOMER & DATE INFO */}
                  <View style={styles.customerBox}>
                    <Text variant="labelMedium" style={{ color: '#444' }}>
                      👤 {customer.name || 'Walk-in'} {customer.phone ? `| 📞 ${customer.phone}` : ''} {customer.gst ? `| GST: ${customer.gst}` : ''}
                    </Text>
                    <Text variant="labelSmall" style={{ color: '#888', marginTop: 4 }}>
                      🕒 {formattedDate}  |  Inv: {sale.id.substring(0, 8)}
                    </Text>
                  </View>

                </Card.Content>
              </Card>
            );
          })
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
  
  // Custom Date UI Styles
  customDateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' },
  dateBtnWrapper: { flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 8, marginRight: 8, elevation: 1, borderWidth: 1, borderColor: '#ddd' },
  dateLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  goBtn: { justifyContent: 'center', borderRadius: 8, height: 48 },

  // List Styles
  listContainer: { paddingBottom: 40 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 },
  
  // New Card Styles
  saleCard: { marginBottom: 12, backgroundColor: '#fff', elevation: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountText: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  divider: { marginVertical: 10, backgroundColor: '#e0e0e0' },
  
  paymentBadge: { backgroundColor: '#e3f2fd', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  paymentText: { color: '#1565c0', fontSize: 12, fontWeight: 'bold' },
  
  customerBox: { marginTop: 12, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#eee' },
});