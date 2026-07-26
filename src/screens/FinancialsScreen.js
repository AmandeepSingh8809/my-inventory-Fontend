import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';

export default function FinancialsScreen() {
  const financials = {
    totalStockValue: 24500,
    totalSales: 48900,
    totalPurchases: 12000,
    netProfit: 36900,
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.screenTitle}>Financial Metrics</Text>
      
      <Card style={styles.financeCard}>
        <Card.Content>
          <Text variant="bodyMedium">Total Stock Valuation</Text>
          <Text variant="headlineMedium" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
            ₹{financials.totalStockValue.toLocaleString()}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.financeCard}>
        <Card.Content>
          <Text variant="bodyMedium">Total Sales Revenue (Cash In)</Text>
          <Text variant="headlineMedium" style={{ color: '#0288d1', fontWeight: 'bold' }}>
            ₹{financials.totalSales.toLocaleString()}
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.financeCard, { backgroundColor: '#e8f5e9' }]}>
        <Card.Content>
          <Text variant="bodyMedium">Net Profit</Text>
          <Text variant="headlineMedium" style={{ color: '#1b5e20', fontWeight: 'bold' }}>
            ₹{financials.netProfit.toLocaleString()}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  screenTitle: { fontWeight: 'bold', marginBottom: 20 },
  financeCard: { marginBottom: 16, backgroundColor: '#fff' },
});