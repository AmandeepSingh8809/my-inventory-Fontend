import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
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

export default function RegisterScreen({ setActiveTab }) {
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  const [password, setPassword] = useState('');
  
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Basic Validation
    if (!firstName || !lastName || !username || !email || !mobile  || !password) {
      Alert.alert('Missing Fields', 'Please fill out all the fields to create your account.');
      return;
    }

    setLoading(true);
    try {
      // Adjust this endpoint to match your backend route for registration
      const response = await api.post('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password: password,
      });

      Alert.alert(
        'Account Created',
        'Your account has been successfully created. Please log in.',
        [{ text: 'OK', onPress: () => setActiveTab('Login') }]
      );
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create account.';
      Alert.alert('Registration Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Card.Content>
            
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <Image
                source={require('../../assets/logo/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.eyebrow}>JOIN INVENTORY MANAGER</Text>
              <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Set up your store and manage inventory
              </Text>
            </View>

            {/* Form Section */}
            
            {/* Row for First and Last Name to save space */}
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

           
           
           

            <TextInput
              label="Password"
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
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerBtn}
              buttonColor={COLORS.navy}
              contentStyle={{ paddingVertical: 8 }}
            >
              Sign Up
            </Button>

            {/* Footer Navigation */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => setActiveTab('Login')}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
            </View>

          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40, // Added extra padding so the top and bottom breathe nicely
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
  headerContainer: { alignItems: 'center', marginBottom: 24 },
  
  logo: { width: 120, height: 120, marginBottom: 10 },
  
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
  
  // Custom styles for putting First/Last name side-by-side
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%', 
  },
  
  registerBtn: { 
    borderRadius: 10, 
    marginTop: 10,
    marginBottom: 20 
  },
  
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: { color: COLORS.subtext, fontSize: 14 },
  footerLink: { color: COLORS.navy, fontWeight: '700', fontSize: 14 },
});