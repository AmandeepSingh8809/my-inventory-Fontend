import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

// 🚨 FIX: Correctly receiving setActiveTab here instead of navigation!
export default function LoginScreen({ setActiveTab }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Missing Fields", "Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        username: username.trim().toLowerCase(),
        password: password
      });

      // 1. Save the token securely
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userRole', response.data.user.role);
      await AsyncStorage.setItem('userName', response.data.user.username);
      // 2. 🚨 FIX: Now this function actually works and smoothly switches to the Dashboard!
      setActiveTab('Home');

    } catch (error) {
      // If it's a real API error, show it. Otherwise, show a fallback message.
      const errorMsg = error.response?.data?.error || "Failed to connect to server";
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerContainer}>
              <Text variant="headlineMedium" style={styles.title}>Welcome Back</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>Sign in to manage your inventory</Text>
            </View>

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />

            <Button 
              mode="contained" 
              onPress={handleLogin} 
              loading={loading} 
              disabled={loading}
              style={styles.loginBtn}
              contentStyle={{ paddingVertical: 8 }}
            >
              Login
            </Button>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f0f2f5' },
  card: { paddingVertical: 20, elevation: 4, backgroundColor: '#fff', borderRadius: 12 },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  title: { fontWeight: 'bold', color: '#1a1a1a' },
  subtitle: { color: '#666', marginTop: 5 },
  input: { marginBottom: 16, backgroundColor: '#fff' },
  loginBtn: { marginTop: 10, borderRadius: 8, backgroundColor: '#007AFF' }
});