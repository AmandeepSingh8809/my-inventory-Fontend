import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Switch, Divider, Button, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client'; // Make sure this path points to your Axios interceptor!
export default function SettingsScreen({ setActiveTab,setIsDrawerOpen}) { // 🚨 Note: Passed 'navigation' as a prop
  // Existing Settings State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // 🚨 NEW: Shop Management State
  const [myShops, setMyShops] = useState([]);
  const [activeShopCode, setActiveShopCode] = useState(null);
  const [isLoadingShops, setIsLoadingShops] = useState(true);

  // 🚨 NEW: Load shops when screen opens
  useEffect(() => {
    fetchShops();
    loadCurrentShop();
  }, []);

  const loadCurrentShop = async () => {
    const savedShop = await AsyncStorage.getItem('activeShopCode');
    setActiveShopCode(savedShop);
  };

  const fetchShops = async () => {
    try {
      setIsLoadingShops(true);
      // Make sure this matches the backend route you created!
      const response = await api.get('/users/my-shops'); 
      setMyShops(response.data);
      
      const savedShop = await AsyncStorage.getItem('activeShopCode');
      // Auto-select the first shop if none is set yet
      if (!savedShop && response.data.length > 0) {
        selectShop(response.data[0].shop_code);
      }
    } catch (error) {
      console.error("Error fetching shops", error);
      Alert.alert("Error", "Could not fetch your shops from the server.");
    } finally {
      setIsLoadingShops(false);
    }
  };

  const selectShop = async (shopCode) => {
    await AsyncStorage.setItem('activeShopCode', shopCode);
    setActiveShopCode(shopCode);
    Alert.alert("Shop Switched", `You are now operating in ${shopCode}.`);
  };

  const handleAddNewShop = () => {
   setActiveTab('AddShop');
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>App Settings</Text>
      
      {/* --- 🚨 NEW: MY SHOPS SECTION --- */}
      <List.Section>
        <List.Subheader>My Shops</List.Subheader>
        
        {isLoadingShops ? (
          <ActivityIndicator animating={true} color="#007AFF" style={{ marginVertical: 20 }} />
        ) : (
          myShops.map((item) => (
            <List.Item
              key={item.shop_code}
              title={item.shop_name}
              description={`Code: ${item.shop_code} | Role: ${item.role}`}
              left={props => <List.Icon {...props} icon="store" />}
              right={props => (
                <View style={{ justifyContent: 'center' }}>
                  <Button 
                    mode={activeShopCode === item.shop_code ? "contained" : "outlined"}
                    onPress={() => selectShop(item.shop_code)}
                    buttonColor={activeShopCode === item.shop_code ? "#2e7d32" : undefined}
                    textColor={activeShopCode === item.shop_code ? "#fff" : "#007AFF"}
                    compact
                  >
                    {activeShopCode === item.shop_code ? "Active" : "Select"}
                  </Button>
                </View>
              )}
            />
          ))
        )}

        <Button 
          icon="plus" 
          mode="text" 
          onPress={handleAddNewShop} 
          textColor="#007AFF"
          style={{ alignSelf: 'flex-start', marginLeft: 8 }}
        >
          Add New Shop
        </Button>
      </List.Section>

      <Divider style={styles.divider} />

      {/* --- EXISTING PREFERENCES --- */}
      <List.Section>
        <List.Subheader>Preferences</List.Subheader>
        <List.Item
          title="Dark Mode"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => <Switch color='#007AFF' value={isDarkMode} onValueChange={setIsDarkMode} />}
        />
        <List.Item
          title="Push Notifications"
          description="Low stock alerts and daily summaries"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          right={() => <Switch color='#007AFF' value={notifications} onValueChange={setNotifications} />}
        />
      </List.Section>

      <Divider style={styles.divider} />

      {/* --- EXISTING STORE CONFIG --- */}
      <List.Section>
        <List.Subheader>Store Configuration</List.Subheader>
        <List.Item
          title="Currency"
          description="Indian Rupee (₹)"
          left={props => <List.Icon {...props} icon="currency-inr" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <List.Item
          title="Tax Rate (GST)"
          description="Currently set to 18%"
          left={props => <List.Icon {...props} icon="brightness-percent" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontWeight: 'bold', marginBottom: 20 },
  divider: { marginVertical: 10 },
});