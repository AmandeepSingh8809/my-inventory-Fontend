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
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

// ─────────────────────────────────────────────────────────────
// SOCIAL LOGIN SETUP (do this once, outside this file):
//
// Google:
//   npm install @react-native-google-signin/google-signin
//   Configure GoogleSignin.configure({ webClientId: '<YOUR_CLIENT_ID>' })
//   in your app's entry point, then swap the TODO below for the real call.
//
// Apple (iOS only, required by App Store guidelines if you offer any
// third-party login):
//   npm install expo-apple-authentication   (Expo)
//   -- or --
//   npm install @invertase/react-native-apple-authentication  (bare RN)
// ─────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#F4F6F9',
  navy: '#007AFF',
  amber: '#E8A33D',
  card: '#FFFFFF',
  text: '#1A2233',
  subtext: '#6B7280',
  border: '#E3E7EC',
};

export default function LoginScreen({ setActiveTab }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Missing Fields', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        username: username.trim().toLowerCase(),
        password: password,
      });

      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userRole', response.data.user.role);
      await AsyncStorage.setItem('userName', response.data.user.username);
      await AsyncStorage.setItem('activeShopCode', response.data.user.shopCode);

      setActiveTab('Home');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to connect to server';
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // TODO: replace with real Google Sign-In flow, e.g.
      // await GoogleSignin.hasPlayServices();
      // const { idToken } = await GoogleSignin.signIn();
      // const response = await api.post('/auth/google', { idToken });
      Alert.alert('Google Sign-In', 'Connect your Google OAuth client to enable this.');
    } catch (error) {
      Alert.alert('Google Sign-In Failed', error.message || 'Something went wrong.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    try {
      // TODO: replace with real Apple authentication flow, e.g.
      // const credential = await AppleAuthentication.signInAsync({...});
      // const response = await api.post('/auth/apple', { identityToken: credential.identityToken });
      Alert.alert('Apple Sign-In', 'Connect Apple Authentication to enable this.');
    } catch (error) {
      Alert.alert('Apple Sign-In Failed', error.message || 'Something went wrong.');
    } finally {
      setAppleLoading(false);
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
      >
        <Card style={styles.card}>
          <Card.Content>
           <View style={styles.headerContainer}>
  {/* Removed the logoBadge wrapper completely */}
  <Image
    source={require('../../assets/logo/logo.png')}
    style={styles.logo}
    resizeMode="contain"
  />

  <Text style={styles.eyebrow}>INVENTORY MANAGER</Text>
  <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>
  <Text variant="bodyMedium" style={styles.subtitle}>
    Sign in to manage your inventory
  </Text>
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

            <TouchableOpacity
              onPress={() => setActiveTab('ForgotPassword')}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginBtn}
              buttonColor={COLORS.navy}
              contentStyle={{ paddingVertical: 8 }}
            >
              Login
            </Button>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="outlined"
              icon="google"
              onPress={handleGoogleLogin}
              loading={googleLoading}
              disabled={googleLoading}
              style={styles.socialBtn}
              textColor={COLORS.text}
              contentStyle={{ paddingVertical: 6 }}
            >
              Continue with Google
            </Button>

            {Platform.OS === 'ios' && (
              <Button
                mode="contained"
                icon="apple"
                onPress={handleAppleLogin}
                loading={appleLoading}
                disabled={appleLoading}
                style={[styles.socialBtn, { backgroundColor: '#000' }]}
                textColor="#fff"
                contentStyle={{ paddingVertical: 6 }}
              >
                Continue with Apple
              </Button>
            )}

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => setActiveTab('Register')}>
                <Text style={styles.footerLink}>Sign Up</Text>
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
  
  
  logo: { width: 200, height: 200, },
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
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 18, marginTop: -4 },
  forgotText: { color: COLORS.navy, fontSize: 13, fontWeight: '600' },
  loginBtn: { borderRadius: 10 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.subtext,
  },
  socialBtn: {
    borderRadius: 10,
    marginBottom: 12,
    borderColor: COLORS.border,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: { color: COLORS.subtext, fontSize: 14 },
  footerLink: { color: COLORS.navy, fontWeight: '700', fontSize: 14 },
});