import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Text, Card, IconButton,Menu } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function AddEmployeeScreen({ setActiveTab }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Salesman');
  const [showRoleMenu,setShowRoleMenu] =useState(false);
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreateEmployee = async () => {
    if (!firstName || !lastName || !username || !email || !password || !role) {
      Alert.alert('Missing Fields', 'Please fill out all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Fetch the active shop code from AsyncStorage to assign them to the current shop
      const activeShopCode = await AsyncStorage.getItem('activeShopCode');

      await api.post('/employees/create', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password: password,
        role: role.trim(),
        shopCodes: [activeShopCode], // 👈 The magic array! Send 1 or 5 codes here.
      });

      Alert.alert(
        'Success',
        'Employee account created and permissions assigned successfully!',
        [{ text: 'OK', onPress: () => setActiveTab('Settings') }]
      );
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create employee.';
      Alert.alert('Creation Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
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
                <IconButton icon="account-plus-outline" iconColor={COLORS.navy} size={40} />
              </View>
              <Text style={styles.eyebrow}>TEAM MANAGEMENT</Text>
              <Text variant="headlineMedium" style={styles.title}>Add Employee</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Create staff credentials and set permissions
              </Text>
            </View>

            <View style={styles.row}>
              <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.navy}
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.navy}
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={<TextInput.Icon icon="account-outline" color={COLORS.subtext} />}
              style={styles.input}
            />

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={<TextInput.Icon icon="email-outline" color={COLORS.subtext} />}
              style={styles.input}
            />

            <TextInput
              label="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              mode="outlined"
              keyboardType="phone-pad"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={<TextInput.Icon icon="phone-outline" color={COLORS.subtext} />}
              style={styles.input}
            />
            <Menu visible={showRoleMenu}
            onDismiss={()=>setShowRoleMenu(false)}
            style={{marginTop:55}}
            contentStyle={styles.menuContent}
            anchor={
                <TouchableOpacity onPress={()=>setShowRoleMenu(true)} activeOpacity={0.8}>
                    <View pointerEvents='none'>
                        <TextInput
                        label="Role"
                        value={role}
                        mode="outlined"
                        outlineColor={COLORS.border}
                        activeOutlineColor={COLORS.navy}
                        left={<TextInput.Icon icon='badge-account-outline' color={COLORS.subtext}/>}
                        right ={<TextInput.Icon icon='chevron-down' color={COLORS.subtext}/>}
                        style={styles.input}
                        editable={false}
                        />

                    </View>
                </TouchableOpacity>
            }
            >
                <Menu.Item
                onPress={()=>{setRole('Manager'); setShowRoleMenu(false);}}
                title="Manager"
                titleStyle={styles.menuItemText}
                leadingIcon="account-tie"
                />
                <Menu.Item
                onPress={()=>{setRole('Saleman'); setShowRoleMenu(false);}}
                title="Saleman"
                titleStyle={styles.menuItemText}
                leadingIcon="cash-register"
                />
                <Menu.Item
                onPress={()=>{setRole('Stockist'); setShowRoleMenu(false);}}
                title="Stockist"
                titleStyle={styles.menuItemText}
                leadingIcon="package-variant-closed"
                />
            </Menu>
            

            <TextInput
              label="Temporary Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={secureText}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={<TextInput.Icon icon="lock-outline" color={COLORS.subtext} />}
              right={
                <TextInput.Icon
                  icon={secureText ? 'eye-outline' : 'eye-off-outline'}
                  color={COLORS.subtext}
                  onPress={() => setSecureText((prev) => !prev)}
                />
              }
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleCreateEmployee}
              loading={loading}
              disabled={loading}
              style={styles.submitBtn}
              buttonColor={COLORS.navy}
              contentStyle={{ paddingVertical: 8 }}
            >
              Assign Employee to Store
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%', 
  },
  submitBtn: { 
    borderRadius: 10, 
    marginTop: 10,
    marginBottom: 10 
  },
  menuContent: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    shadowColor: '#0E2338',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItemText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
});