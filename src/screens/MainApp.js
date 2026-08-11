import React, { act, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider, Text, Avatar, Surface, Divider, Icon } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import EmployeeListScreen from './EmployeeListScreen';
import EditEmployeeScreen from './EditEmployeeScreen';
import DashboardScreen from './DashboardScreen';
import SalesScreen from './SalesScreen';
import FinancialsScreen from './FinancialsScreen';
import AddItemScreen from './AddItemScreen';
import SettingsScreen from './SettingsScreen';
import LoadingScreen from './LoadingScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import SalesHistoryScreen from '../screens/SalesHistoryScreen';
import PurchaseHistoryScreen from '../screens/PurchaseHistoryScreen';
import AddShopScreen from './AddShopScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import AddEmployeeScreen from './AddEmployeeScreen'; // 👈 1. Imported the new screen

const COLORS = {
  primary: '#007AFF',
  primaryDark: '#005ecb',
  primarySoft: '#EAF2FF',
  danger: '#d32f2f',
  dangerSoft: '#FDECEA',
  textDark: '#1c1c1e',
  textMuted: '#8e8e93',
  iconMuted: '#6b7280',
  chipIdle: '#f1f3f5',
  chevronIdle: '#c7c7cc',
  divider: '#eceef1',
};

const TABS = [
  { key: 'Home', label: 'Dashboard', icon: 'view-dashboard' },
  { key: 'AddItem', label: 'Add Item', icon: 'plus-box' },
  { key: 'SellItem', label: 'Sale', icon: 'cart-arrow-up', isCenter: true },
  { key: 'Financials', label: 'Finance', icon: 'cash-multiple' },
  { key: 'More', label: 'More', icon: 'menu' },
];

const OVERFLOW_TABS = [
  { key: 'SalesHistory', label: 'Sales Activity', icon: 'history' },
  { key: 'PurchaseHistory', label: 'Stock In Activity', icon: 'truck-delivery' },
];
const EMPLOYEES_TABS = [
 { key: 'AddEmployee', label: 'Add Employee', icon: 'account-plus' }, 
  { key: 'EmployeeList', label: 'Employee list', icon: 'account' },
];
// ==========================================
// 1. MODULAR TOP HEADER
// ==========================================
const TopHeader = ({ activeTab, setActiveTab, user, insets }) => {
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'Home': return 'Inventory Dashboard';
      case 'Financials': return 'Monetary Overview';
      case 'SellItem': return 'Point of Sale';
      case 'AddItem': return 'Add Item';
      case 'SalesHistory': return 'Sales History';
      case 'PurchaseHistory': return 'Purchase History';
      case 'Settings': return 'Settings';
      default: return 'App';
    }
  };

  return (
    <Surface style={[styles.topHeader, { paddingTop: insets.top + 12 }]} elevation={2}>
      <Text variant="titleLarge" style={styles.headerTitle}>
        {getHeaderTitle()}
      </Text>

      <TouchableOpacity onPress={() => setActiveTab('Settings')}>
        <Avatar.Text
          size={38}
          label={user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          style={styles.avatarBtn}
        />
      </TouchableOpacity>
    </Surface>
  );
};

// ==========================================
// 2. MODULAR BOTTOM TAB BAR
// ==========================================
const BottomTabBar = ({ activeTab, setActiveTab, setIsDrawerOpen, bottomInset }) => {
  return (
    <Surface style={[styles.bottomBar, { paddingBottom: 8 + bottomInset }]} elevation={4}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;

        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.centerTabWrapper}
              activeOpacity={0.85}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={[styles.centerTabCircle, isActive && styles.centerTabCircleActive]}>
                <Icon source={tab.icon} size={isActive ? 30 : 26} color="#fff" />
              </View>
              <Text style={[styles.tabLabel, styles.centerTabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => {
              if (tab.key === 'More') {
                setIsDrawerOpen(true);
              } else {
                setActiveTab(tab.key);
              }
            }}
          >
            <Icon
              source={tab.icon}
              size={isActive ? 28 : 22}
              color={isActive ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Surface>
  );
};

// ==========================================
// 3. MODULAR RIGHT-SIDE DRAWER
// ==========================================
const DrawerListItem = ({ icon, label, isActive, dangerous, onPress }) => {
  const iconBg = dangerous ? COLORS.dangerSoft : isActive ? COLORS.primary : COLORS.chipIdle;
  const iconColor = dangerous ? COLORS.danger : isActive ? '#fff' : COLORS.iconMuted;
  const labelColor = dangerous ? COLORS.danger : isActive ? COLORS.primary : COLORS.textDark;

  return (
    <TouchableOpacity
      style={[styles.drawerListItem, isActive && styles.drawerListItemActive]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.drawerIconChip, { backgroundColor: iconBg }]}>
        <Icon source={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.drawerItemLabel, { color: labelColor }, isActive && styles.drawerItemLabelActive]}>
        {label}
      </Text>
      {!dangerous && (
        <Icon source="chevron-right" size={18} color={isActive ? COLORS.primary : COLORS.chevronIdle} />
      )}
    </TouchableOpacity>
  );
};

const RightDrawer = ({ user, activeTab, setActiveTab, setIsDrawerOpen }) => {
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('activeShopCode');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('userRole'); // 👈 Clean up role too
    setActiveTab('Login');
    setIsDrawerOpen(false);
  };

  // 🔥 Role Check: Salesmen shouldn't see employee management
const normalizedRole = String(user?.role || '').toLowerCase();

const canManageEmployees =
  normalizedRole === 'admin' ||
  normalizedRole === 'owner' ||
  normalizedRole === 'manager';

  return (
    <View style={[styles.drawerOverlay, { flexDirection: 'row-reverse' }]}>
      <Surface style={styles.drawerContentRight} elevation={5}>
        <View style={styles.drawerHeaderCard}>
          <Avatar.Text size={52} label={getInitials(user.name)} style={styles.drawerAvatar} labelStyle={styles.drawerAvatarLabel} />
          <View style={styles.drawerHeaderText}>
            <Text variant="titleMedium" style={styles.userName}>{user.name}</Text>
            <Text variant="bodySmall" style={styles.userRole}>{user.role}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>History</Text>
        <View style={styles.drawerList}>
          {OVERFLOW_TABS.map((tab) => (
            <DrawerListItem
              key={tab.key}
              icon={tab.icon}
              label={tab.label}
              isActive={activeTab === tab.key}
              onPress={() => { setActiveTab(tab.key); setIsDrawerOpen(false); }}
            />
          ))}
        </View>

        {/* 🔥 Conditionally rendered so Salesmen don't see options they aren't allowed to use */}
        {canManageEmployees && (
          <>
            <Text style={styles.sectionLabel}>Employee Actions</Text>
            <View style={styles.drawerList}>
              {EMPLOYEES_TABS.map((tab) => (
                <DrawerListItem
                  key={tab.key}
                  icon={tab.icon}
                  label={tab.label}
                  isActive={activeTab === tab.key}
                  onPress={() => { setActiveTab(tab.key); setIsDrawerOpen(false); }}
                />
              ))}
            </View>
          </>
        )}

        <Divider style={styles.divider} />

        <View style={styles.drawerFooter}>
          <DrawerListItem icon="logout" label="Logout" dangerous onPress={handleLogout} />
        </View>
      </Surface>

      <TouchableOpacity
        style={styles.drawerBackdrop}
        activeOpacity={1}
        onPress={() => setIsDrawerOpen(false)}
      />
    </View>
  );
};

// ==========================================
// 4. MAIN APP CONTENT
// ==========================================
function MainAppContent() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Loading');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [user, setUser] = useState({ name: 'User', role: 'Store Owner' });

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const savedName = await AsyncStorage.getItem('userName');
      const savedRole = await AsyncStorage.getItem('userRole'); // 👈 Grab role
      
      if (token) {
        setUser({ name: savedName || 'User', role: savedRole || 'Store Owner' });
        setActiveTab('Home');
      } else {
        setActiveTab('Login');
      }
    } catch (error) {
      setActiveTab('Login');
    }
  };

  // 👈 3. Updated check to hide Top/Bottom bars for your full-page forms
  const isAuthScreen = ['Loading', 'Login', 'Register', 'ForgotPassword', 'AddShop', 'AddEmployee'].includes(activeTab);

  return (
    <PaperProvider>
      <View style={styles.rootContainer}>
        
        {/* Modular Top Header */}
        {!isAuthScreen && (
          <TopHeader 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            user={user} 
            insets={insets} 
          />
        )}

        {/* Modular Right Drawer */}
        {isDrawerOpen && !isAuthScreen && (
          <RightDrawer
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setIsDrawerOpen={setIsDrawerOpen}
          />
        )}

        
        <View style={{flex:1}}>
          {activeTab === 'Loading' && <LoadingScreen />}
          {activeTab === 'Login' && (
            <LoginScreen setActiveTab={(tab) =>{
              setActiveTab(tab);
              if(tab === 'Home'){
                checkLoginStatus();
              }
            }} />
          )}
          {activeTab === 'Register' && <RegisterScreen setActiveTab={setActiveTab}/>}
          {activeTab === 'Home' && <DashboardScreen setActiveTab={setActiveTab} />}
          {activeTab === 'Financials' && <FinancialsScreen />}
          {activeTab === 'SellItem' && <SalesScreen />}
          {activeTab === 'AddItem' && <AddItemScreen setActiveTab={setActiveTab} />}
          {activeTab === 'SalesHistory' && <SalesHistoryScreen />}
          {activeTab === 'PurchaseHistory' && <PurchaseHistoryScreen />}
          {activeTab === 'Settings' && <SettingsScreen setActiveTab={setActiveTab} setIsDrawerOpen={setIsDrawerOpen} />}
          {activeTab === 'AddShop' && <AddShopScreen setActiveTab={setActiveTab} />}
          {activeTab === 'ForgotPassword' && <ForgotPasswordScreen setActiveTab={setActiveTab}/>}
          {activeTab === 'AddEmployee' && <AddEmployeeScreen setActiveTab={setActiveTab} />}
          {activeTab === 'EmployeeList' && (
  <EmployeeListScreen
    setActiveTab={setActiveTab}
    setSelectedEmployee={setSelectedEmployee}
  />
)}

{activeTab === 'EditEmployee' && (
  <EditEmployeeScreen
    employee={selectedEmployee}
    setActiveTab={setActiveTab}
  />
)}




        </View>

        {/* Modular Bottom Bar */}
        {!isAuthScreen && (
          <BottomTabBar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            setIsDrawerOpen={setIsDrawerOpen}
            bottomInset={insets.bottom} 
          />
        )}

      </View>
    </PaperProvider>
  );
}

export default function MainApp() {
  return (
    <SafeAreaProvider>
      <MainAppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: '#f8f9fa' },

  // Top bar
  topHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  avatarBtn: { backgroundColor: COLORS.primary },
  headerTitle: { fontWeight: 'bold', flex: 1, color: COLORS.textDark }, 

  // Bottom tab bar
  bottomBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#fff', minHeight: 62, paddingTop: 6 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  tabLabelActive: { color: COLORS.primary, fontWeight: '700' },
  centerTabWrapper: { flex: 1, alignItems: 'center' },
  centerTabCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginTop: -26, borderWidth: 4, borderColor: '#fff', elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 3 }, shadowRadius: 4 },
  centerTabCircleActive: { width: 62, height: 62, borderRadius: 31, marginTop: -29, backgroundColor: COLORS.primaryDark },
  centerTabLabel: { marginTop: 6 },

  // Side drawer
  drawerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 100 },
  drawerContentRight: {
    width: '78%',
    height: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingTop: 20,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
  },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },

  backPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: COLORS.primarySoft, paddingVertical: 17, paddingHorizontal: 14, borderRadius: 20, marginBottom: 18,marginTop:50, },
  drawerBackText: { marginLeft: 8, color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  drawerHeaderCard: { flexDirection: 'row',marginTop:30, alignItems: 'center', backgroundColor: COLORS.primarySoft, borderRadius: 16, padding: 14, marginBottom: 24 },
  drawerHeaderText: { marginLeft: 14, flexShrink: 1 },
  drawerAvatar: { backgroundColor: COLORS.primary },
  drawerAvatarLabel: { fontWeight: '700' },
  userName: { fontWeight: 'bold', color: COLORS.textDark },
  userRole: { color: COLORS.textMuted, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  drawerList: { marginBottom: 8 },
  drawerListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, marginBottom: 4 },
  drawerListItemActive: { backgroundColor: COLORS.primarySoft },
  drawerIconChip: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  drawerItemLabel: { flex: 1, fontSize: 15 },
  drawerItemLabelActive: { fontWeight: '700' },
  divider: { marginVertical: 16, backgroundColor: COLORS.divider },
  drawerFooter: { flex: 1, justifyContent: 'flex-end', marginBottom: 50 },
});