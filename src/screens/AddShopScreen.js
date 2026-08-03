import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, Card, IconButton } from 'react-native-paper';
import api from '../api/client';

const COLORS = {
  bg: '#F4F6F9',
  navy: '#007AFF',
  amber: '#E8A33D',
  card: '#FFFFFF',
  text: '#1A2233',
  subtext: '#6B7280',
  border: '#E3E7EC',
};

export default function AddShopScreen({ setActiveTab }) {
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateShop = async () => {
    if (!shopName || !address || !pincode) {
      Alert.alert('Missing Fields', 'Please fill out all fields to create your new store.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/shops/create', {
        shopName: shopName.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
      });

      Alert.alert(
        'Store Created',
        `${shopName} has been created successfully! You can now select it from your Settings.`,
        [{ text: 'OK', onPress: () => setActiveTab('Settings') }]
      );
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create store.';
      Alert.alert('Creation Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🚨 Changed to a standard View to prevent collapsing height bugs
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Card.Content>
            
            <View style={styles.headerContainer}>
              <IconButton
                icon="arrow-left"
                iconColor={COLORS.text}
                size={24}
                style={styles.backButton}
                onPress={() => setActiveTab('Settings')}
              />
              <View style={styles.iconWrapper}>
                <IconButton icon="store-plus" iconColor={COLORS.navy} size={40} />
              </View>
              <Text style={styles.eyebrow}>EXPAND YOUR BUSINESS</Text>
              <Text variant="headlineMedium" style={styles.title}>Add New Store</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Register a new branch or warehouse
              </Text>
            </View>

            <TextInput
              label="Store Name"
              value={shopName}
              onChangeText={setShopName}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={<TextInput.Icon icon="storefront-outline" color={COLORS.subtext} />}
              style={styles.input}
            />

            <TextInput
              label="Complete Address"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              multiline
              numberOfLines={3}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={<TextInput.Icon icon="map-marker-outline" color={COLORS.subtext} />}
              style={[styles.input, { height: 80 }]}
            />

            <TextInput
              label="Pincode / Zip Code"
              value={pincode}
              onChangeText={setPincode}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={6}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={<TextInput.Icon icon="mailbox-outline" color={COLORS.subtext} />}
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleCreateShop}
              loading={loading}
              disabled={loading}
              style={styles.registerBtn}
              buttonColor={COLORS.navy}
              contentStyle={{ paddingVertical: 8 }}
            >
              Create Store
            </Button>

          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  card: {
    paddingVertical: 24,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    shadowColor: '#0E2338',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  headerContainer: { 
    alignItems: 'center', 
    marginBottom: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: -10,
    left: -10,
    zIndex: 10,
  },
  iconWrapper: {
    backgroundColor: '#E3F2FD',
    borderRadius: 50,
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.amber,
    marginBottom: 6,
  },
  title: { fontWeight: 'bold', color: COLORS.text },
  subtitle: { color: COLORS.subtext, marginTop: 4, textAlign: 'center' },
  input: { marginBottom: 14, backgroundColor: '#fff' },
  registerBtn: { borderRadius: 10, marginTop: 10, marginBottom: 10 },
});