import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";

import { TextInput, Button, Text, Card } from "react-native-paper";
import api from "../api/client";

const COLORS = {
  bg: "#F4F6F9",
  navy: "#007AFF",
  amber: "#E8A33D",
  card: "#FFFFFF",
  text: "#1A2233",
  subtext: "#6B7280",
  border: "#E3E7EC",
};

export default function RegisterScreen({ setActiveTab }) {
  // ============================================================
  // FORM STATE
  // ============================================================

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async () => {
    // ----------------------------------------------------------
    // Trim values
    // ----------------------------------------------------------

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();
    const cleanPassword = password;

    // ----------------------------------------------------------
    // Required fields
    // ----------------------------------------------------------

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanUsername ||
      !cleanEmail ||
      !cleanMobile ||
      !cleanPassword
    ) {
      Alert.alert(
        "Missing Fields",
        "Please fill out all the fields to create your account."
      );

      return;
    }

    // ----------------------------------------------------------
    // Basic email validation
    // ----------------------------------------------------------

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );

      return;
    }

    // ----------------------------------------------------------
    // Basic password validation
    // ----------------------------------------------------------

    if (cleanPassword.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long."
      );

      return;
    }

    // ----------------------------------------------------------
    // Mobile validation
    // ----------------------------------------------------------

    if (cleanMobile.length < 10) {
      Alert.alert(
        "Invalid Mobile",
        "Please enter a valid mobile number."
      );

      return;
    }

    try {
      setLoading(true);

      // ========================================================
      // SEND REGISTRATION REQUEST
      // ========================================================

      const payload = {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        username: cleanUsername,
        email: cleanEmail,
        mobile: cleanMobile,
        password: cleanPassword,
      };

      console.log("REGISTER PAYLOAD:", {
        ...payload,
        password: "***",
      });

      const response = await api.post(
        "/auth/register",
        payload
      );

      console.log(
        "REGISTER RESPONSE:",
        response.data
      );

      // ========================================================
      // SUCCESS
      // ========================================================

      Alert.alert(
        "Account Created",
        "Your account has been successfully created. Please log in.",
        [
          {
            text: "OK",
            onPress: () => {
              setActiveTab("Login");
            },
          },
        ]
      );

      // Clear form
      setFirstName("");
      setLastName("");
      setUsername("");
      setEmail("");
      setMobile("");
      setPassword("");
    } catch (error) {
      console.error(
        "REGISTRATION ERROR:",
        error.response?.data || error.message
      );

      // ========================================================
      // BACKEND ERROR
      // ========================================================

      const statusCode = error.response?.status;

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to create account.";

      // --------------------------------------------------------
      // Duplicate username/email
      // --------------------------------------------------------

      if (statusCode === 409) {
        Alert.alert(
          "Account Already Exists",
          errorMessage
        );

        return;
      }

      // --------------------------------------------------------
      // Validation error
      // --------------------------------------------------------

      if (statusCode === 400) {
        Alert.alert(
          "Invalid Information",
          errorMessage
        );

        return;
      }

      // --------------------------------------------------------
      // Server error
      // --------------------------------------------------------

      Alert.alert(
        "Registration Failed",
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
      }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Card.Content>

            {/* ==================================================
                HEADER
            ================================================== */}

            <View style={styles.headerContainer}>
              <Image
                source={require("../../assets/logo/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.eyebrow}>
                JOIN INVENTORY MANAGER
              </Text>

              <Text
                variant="headlineMedium"
                style={styles.title}
              >
                Create Account
              </Text>

              <Text
                variant="bodyMedium"
                style={styles.subtitle}
              >
                Set up your store and manage inventory
              </Text>
            </View>

            {/* ==================================================
                NAME
            ================================================== */}

            <View style={styles.row}>
              <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.navy}
                autoCapitalize="words"
                style={[
                  styles.input,
                  styles.halfInput,
                ]}
              />

              <TextInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.navy}
                autoCapitalize="words"
                style={[
                  styles.input,
                  styles.halfInput,
                ]}
              />
            </View>

            {/* ==================================================
                USERNAME
            ================================================== */}

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={
                <TextInput.Icon
                  icon="account-outline"
                  color={COLORS.subtext}
                />
              }
              style={styles.input}
            />

            {/* ==================================================
                EMAIL
            ================================================== */}

            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={
                <TextInput.Icon
                  icon="email-outline"
                  color={COLORS.subtext}
                />
              }
              style={styles.input}
            />

            {/* ==================================================
                MOBILE
            ================================================== */}

            <TextInput
              label="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              mode="outlined"
              keyboardType="phone-pad"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={
                <TextInput.Icon
                  icon="phone-outline"
                  color={COLORS.subtext}
                />
              }
              style={styles.input}
            />

            {/* ==================================================
                PASSWORD
            ================================================== */}

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={secureText}
              autoCapitalize="none"
              autoCorrect={false}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.navy}
              left={
                <TextInput.Icon
                  icon="lock-outline"
                  color={COLORS.subtext}
                />
              }
              right={
                <TextInput.Icon
                  icon={
                    secureText
                      ? "eye-outline"
                      : "eye-off-outline"
                  }
                  color={COLORS.subtext}
                  onPress={() =>
                    setSecureText(
                      (previous) => !previous
                    )
                  }
                />
              }
              style={styles.input}
            />

            {/* ==================================================
                REGISTER BUTTON
            ================================================== */}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerBtn}
              buttonColor={COLORS.navy}
              contentStyle={styles.buttonContent}
            >
              {loading
                ? "Creating Account..."
                : "Sign Up"}
            </Button>

            {/* ==================================================
                LOGIN
            ================================================== */}

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                Already have an account?{" "}
              </Text>

              <TouchableOpacity
                disabled={loading}
                onPress={() =>
                  setActiveTab("Login")
                }
              >
                <Text style={styles.footerLink}>
                  Log In
                </Text>
              </TouchableOpacity>
            </View>

          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 40,
  },

  card: {
    paddingVertical: 24,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",

    shadowColor: "#0E2338",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,

    elevation: 5,
  },

  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: COLORS.amber,
    marginBottom: 6,
  },

  title: {
    fontWeight: "bold",
    color: COLORS.text,
  },

  subtitle: {
    color: COLORS.subtext,
    marginTop: 4,
    textAlign: "center",
  },

  input: {
    marginBottom: 14,
    backgroundColor: "#fff",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  halfInput: {
    width: "48%",
  },

  registerBtn: {
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },

  buttonContent: {
    paddingVertical: 8,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },

  footerText: {
    color: COLORS.subtext,
    fontSize: 14,
  },

  footerLink: {
    color: COLORS.navy,
    fontWeight: "700",
    fontSize: 14,
  },
});