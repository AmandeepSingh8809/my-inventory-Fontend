import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider, Text, Avatar, Surface, Divider, Button } from 'react-native-paper';

// IMPORTANT: This tells the app to use your new separate files!
import DashboardScreen from '../screens/DashboardScreen';
import FinancialsScreen from '../screens/FinancialsScreen';
import AddItemScreen from '../screens/AddItemScreen';
import SettingsScreen from '../screens/SettingsScreen'; 

const SidebarDrawer = ({ user, activeTab, setActiveTab, setIsDrawerOpen }) => {
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  const NavButton = ({ title, icon, tabName }) => (
    <Button 
      icon={icon} 
      mode={activeTab === tabName ? 'contained' : 'text'}
      onPress={() => { setActiveTab(tabName); setIsDrawerOpen(false); }}
      style={styles.drawerItem}
      contentStyle={{ justifyContent: 'flex-start' }}
    >
      {title}
    </Button>
  );

  return (
    <View style={styles.drawerOverlay}>
      <Surface style={styles.drawerContent} elevation={5}>
        <View style={styles.drawerHeader}>
          <Avatar.Text size={56} label={getInitials(user.name)} />
          <Text variant="titleMedium" style={styles.userName}>{user.name}</Text>
          <Text variant="bodySmall" style={styles.userRole}>{user.role}</Text>
        </View>
        <Divider style={styles.divider} />
        <NavButton title="Dashboard" icon="home" tabName="Home" />
        <NavButton title="Monetary & Finances" icon="cash-multiple" tabName="Financials" />
        <NavButton title="Add New Product" icon="plus-box" tabName="AddItem" />
        <Divider style={styles.divider} />
        <NavButton title="Settings" icon="cog" tabName="Settings" />
      </Surface>
    </View>
  );
};

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('Home'); 
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user] = useState({ name: 'Rajesh Kumar', role: 'Store Owner' });

  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'Home': return 'Inventory Dashboard';
      case 'Financials': return 'Monetary Overview';
      case 'AddItem': return 'Add Item';
      case 'Settings': return 'Settings';
      default: return 'App';
    }
  };

  return (
    <PaperProvider>
      <View style={styles.rootContainer}>
        
        <Surface style={styles.topHeader} elevation={2}>
          <TouchableOpacity onPress={() => setIsDrawerOpen(!isDrawerOpen)}>
            <Avatar.Text size={42} label="RK" style={styles.avatarBtn} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.headerTitle}>
            {getHeaderTitle()}
          </Text>
        </Surface>

        {isDrawerOpen && (
          <SidebarDrawer 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            setIsDrawerOpen={setIsDrawerOpen} 
          />
        )}

        {/* THIS IS WHERE THE MAGIC HAPPENS - It dynamically loads your modular files */}
        <View style={{ flex: 1 }}>
          {activeTab === 'Home' && <DashboardScreen setActiveTab={setActiveTab} />}
          {activeTab === 'Financials' && <FinancialsScreen />}
          {activeTab === 'AddItem' && <AddItemScreen setActiveTab={setActiveTab} />}
          {activeTab === 'Settings' && <SettingsScreen />}
        </View>

      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  topHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#fff' },
  avatarBtn: { backgroundColor: '#007AFF' },
  headerTitle: { marginLeft: 16, fontWeight: 'bold' },
  drawerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 },
  drawerContent: { width: '75%', height: '100%', backgroundColor: '#fff', padding: 20 },
  drawerHeader: { alignItems: 'center', marginVertical: 20 },
  userName: { marginTop: 10, fontWeight: 'bold' },
  userRole: { color: '#666' },
  divider: { marginVertical: 15 },
  drawerItem: { marginVertical: 6 },
});