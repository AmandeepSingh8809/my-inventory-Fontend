import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Button, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api/client';

export default function FinancialsScreen() {
  const [activeFilter, setActiveFilter] = useState('1 Month'); // Default to 1 Month
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState(null);

  // DATE PICKER STATES
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const timeFilters = ['Today', '1 Week', '1 Month', '6 Months', '1 Year', 'All Time', 'Custom'];

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchFinances = async () => {
    if (activeFilter === 'Custom' && (!startDate || !endDate)) return;

    setLoading(true);
    try {
      let url = `/finance/summary?filter=${activeFilter}`;
      
      if (activeFilter === 'Custom') {
        url += `&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;
      }

      const response = await api.get(url);
      setFinancials(response.data);
    } catch (error) {
      console.error("Failed to load financials", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeFilter !== 'Custom') {
      fetchFinances();
    }
  }, [activeFilter]);

  // FORMAT CURRENCY HELPER
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      
      {/* 1. DATE FILTERS */}
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

      {/* 2. CUSTOM DATE PICKER UI */}
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

          <Button mode="contained" onPress={fetchFinances} style={styles.goBtn}>Go</Button>

          {showStartPicker && (
            <DateTimePicker value={startDate} mode="date" display="default" onChange={(e, d) => { setShowStartPicker(Platform.OS === 'ios'); if (d) setStartDate(d); }} />
          )}
          {showEndPicker && (
            <DateTimePicker value={endDate} mode="date" display="default" onChange={(e, d) => { setShowEndPicker(Platform.OS === 'ios'); if (d) setEndDate(d); }} />
          )}
        </View>
      )}

      {/* 3. DASHBOARD CONTENT */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {loading || !financials ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* --- SECTION A: CURRENT ASSETS (Unaffected by Time Filters) --- */}
            <Text variant="titleMedium" style={styles.sectionHeader}>🏛 Current Assets (Right Now)</Text>
            <Card style={styles.snapshotCard}>
              <Card.Content>
                <Text variant="labelLarge" style={{ color: '#555' }}>Total Inventory Value</Text>
                <Text variant="headlineMedium" style={{ color: '#f57c00', fontWeight: 'bold' }}>
                  {formatCurrency(financials.snapshot.totalStockValue)}
                </Text>
                <Text variant="bodySmall" style={{ color: '#888', marginTop: 4 }}>
                  Capital currently locked in physical stock on shelves.
                </Text>
              </Card.Content>
            </Card>

            <Divider style={styles.divider} />

            {/* --- SECTION B: INCOME STATEMENT (Affected by Time Filters) --- */}
            <Text variant="titleMedium" style={styles.sectionHeader}>📈 Income Statement ({activeFilter})</Text>
            
            <View style={styles.row}>
              <Card style={[styles.halfCard, { marginRight: 8 }]}>
                <Card.Content>
                  <Text variant="labelMedium" style={{ color: '#555' }}>Sales Revenue</Text>
                  <Text variant="titleLarge" style={{ color: '#0288d1', fontWeight: 'bold' }}>
                    {formatCurrency(financials.timeline.totalRevenue)}
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.halfCard}>
                <Card.Content>
                  <Text variant="labelMedium" style={{ color: '#555' }}>Cost of Goods (COGS)</Text>
                  <Text variant="titleLarge" style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    {formatCurrency(financials.timeline.totalCOGS)}
                  </Text>
                </Card.Content>
              </Card>
            </View>

            <Card style={[styles.financeCard, { backgroundColor: financials.timeline.grossProfit >= 0 ? '#e8f5e9' : '#ffebee' }]}>
              <Card.Content style={styles.rowSpaceBetween}>
                <View>
                  <Text variant="labelLarge" style={{ color: financials.timeline.grossProfit >= 0 ? '#2e7d32' : '#c62828' }}>
                    True Gross Profit
                  </Text>
                  <Text variant="headlineSmall" style={{ color: financials.timeline.grossProfit >= 0 ? '#1b5e20' : '#b71c1c', fontWeight: 'bold' }}>
                    {formatCurrency(financials.timeline.grossProfit)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="labelMedium" style={{ color: '#555' }}>Gross Margin</Text>
                  <Text variant="titleLarge" style={{ color: '#333', fontWeight: 'bold' }}>
                    {financials.timeline.grossMarginPercent}%
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Divider style={styles.divider} />

            {/* --- SECTION C: CASH FLOW (Affected by Time Filters) --- */}
            <Text variant="titleMedium" style={styles.sectionHeader}>💸 Cash Flow ({activeFilter})</Text>
            
            <Card style={styles.financeCard}>
              <Card.Content>
                <View style={styles.rowSpaceBetween}>
                  <Text variant="bodyMedium">Cash In (Revenue)</Text>
                  <Text variant="bodyMedium" style={{ color: '#0288d1' }}>{formatCurrency(financials.timeline.totalRevenue)}</Text>
                </View>
                <View style={[styles.rowSpaceBetween, { marginTop: 8 }]}>
                  <Text variant="bodyMedium">Cash Out (Purchases)</Text>
                  <Text variant="bodyMedium" style={{ color: '#d32f2f' }}>- {formatCurrency(financials.timeline.totalPurchases)}</Text>
                </View>
                
                <Divider style={{ marginVertical: 12 }} />
                
                <View style={styles.rowSpaceBetween}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Net Cash Flow</Text>
                  <Text variant="titleMedium" style={{ color: financials.timeline.netCashFlow >= 0 ? '#1b5e20' : '#d32f2f', fontWeight: 'bold' }}>
                    {formatCurrency(financials.timeline.netCashFlow)}
                  </Text>
                </View>
                <Text variant="bodySmall" style={{ color: '#888', marginTop: 8 }}>
                  {financials.timeline.netCashFlow < 0 
                    ? "Warning: You are spending more on stock than you are making in sales right now." 
                    : "Healthy: You are bringing in more cash than you are spending on inventory."}
                </Text>
              </Card.Content>
            </Card>

          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  
  filterContainer: { marginBottom: 12, maxHeight: 40 },
  chip: { marginRight: 8, backgroundColor: '#e0e0e0' },
  
  customDateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' },
  dateBtnWrapper: { flex: 1, backgroundColor: '#fff', padding: 8, borderRadius: 8, marginRight: 8, elevation: 1, borderWidth: 1, borderColor: '#ddd' },
  dateLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  goBtn: { justifyContent: 'center', borderRadius: 8, height: 48 },

  listContainer: { paddingBottom: 60 },
  sectionHeader: { marginTop: 8, marginBottom: 12, fontWeight: 'bold', color: '#333' },
  divider: { marginVertical: 16, backgroundColor: '#cfd8dc', height: 1 },
  
  snapshotCard: { backgroundColor: '#fff', elevation: 2 },
  financeCard: { backgroundColor: '#fff', elevation: 2, marginBottom: 12 },
  
  row: { flexDirection: 'row', marginBottom: 12 },
  halfCard: { flex: 1, backgroundColor: '#fff', elevation: 2 },
  rowSpaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});