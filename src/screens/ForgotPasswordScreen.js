import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
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

export default function ForgotPasswordScreen({ setActiveTab }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Missing Field', 'Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      // 🚨 Make sure to create a matching backend route: POST /auth/forgot-password
      await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      Alert.alert(
        'Reset Link Sent',
        'If an account exists with this email, you will receive password reset instructions.',
        [{ text: 'OK', onPress: () => setActiveTab('Login') }]
      );
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to send reset link.';
      Alert.alert('Request Failed', errorMsg);
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
            
            {/* Header Section with Back Button */}
            <View style={styles.headerContainer}>
              <IconButton
                icon="arrow-left"
                iconColor={COLORS.text}
                size={24}
                style={styles.backButton}
                onPress={() => setActiveTab('Login')}
              />
              <View style={styles.iconWrapper}>
                <IconButton icon="lock-reset" iconColor={COLORS.navy} size={40} />
              </View>
              <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>
              <Text variant="headlineMedium" style={styles.title}>Forgot Password?</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Enter your email and we'll send you instructions to reset your password.
              </Text>
            </View>

            {/* Form Input */}
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

            <Button
              mode="contained"
              onPress={handlePasswordReset}
              loading={loading}
              disabled={loading}
              style={styles.submitBtn}
              buttonColor={COLORS.navy}
              contentStyle={{ paddingVertical: 8 }}
            >
              Send Reset Link
            </Button>

            {/* Return to Login Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Remember your password? </Text>
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
  title: { fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  subtitle: { color: COLORS.subtext, marginTop: 4, textAlign: 'center' },
  input: { marginBottom: 16, backgroundColor: '#fff' },
  submitBtn: { 
    borderRadius: 10, 
    marginTop: 4,
    marginBottom: 16 
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: { color: COLORS.subtext, fontSize: 14 },
  footerLink: { color: COLORS.navy, fontWeight: '700', fontSize: 14 },
});