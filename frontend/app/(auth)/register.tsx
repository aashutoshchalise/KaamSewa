import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { register } from "../../src/api/auth";

function isValidPassword(value: string) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(value);
}

export default function RegisterScreen() {
  const router = useRouter();

  const [role, setRole] = useState<"CLIENT" | "WORKER">("CLIENT");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [khaltiNumber, setKhaltiNumber] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert(
        "Weak password",
        "Password must be at least 8 characters long and include 1 uppercase letter, 1 number, and 1 special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    if (role === "WORKER" && (!khaltiNumber.trim() || !bankAccountNumber.trim())) {
      Alert.alert(
        "Missing worker details",
        "Worker registration requires Khalti number and bank account number."
      );
      return;
    }

    try {
      setLoading(true);

      await register({
        username: username.trim(),
        phone: phone.trim(),
        password,
        confirm_password: confirmPassword,
        role,
        khalti_number: role === "WORKER" ? khaltiNumber.trim() : undefined,
        bank_account_number: role === "WORKER" ? bankAccountNumber.trim() : undefined,
      });

      Alert.alert("Account created", "Your account was created successfully.", [
        {
          text: "OK",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Registration failed",
        JSON.stringify(err?.response?.data || err?.message || "Something went wrong")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.logoWrap}>
            <Ionicons name="person-add-outline" size={26} color="#111111" />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register as a client or worker to continue with KaamSewa
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Choose Account Type</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "CLIENT" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("CLIENT")}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === "CLIENT" && styles.roleButtonTextActive,
                ]}
              >
                Client
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "WORKER" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("WORKER")}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === "WORKER" && styles.roleButtonTextActive,
                ]}
              >
                Worker
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Username</Text>
          <TextInput
            placeholder="Enter username"
            placeholderTextColor="#8A8A8A"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            placeholder="Enter mobile number"
            placeholderTextColor="#8A8A8A"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {role === "WORKER" && (
            <>
              <Text style={styles.label}>Khalti Mobile Number</Text>
              <TextInput
                placeholder="Enter Khalti account mobile number"
                placeholderTextColor="#8A8A8A"
                style={styles.input}
                value={khaltiNumber}
                onChangeText={setKhaltiNumber}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Bank Account Number</Text>
              <TextInput
                placeholder="Enter bank account number"
                placeholderTextColor="#8A8A8A"
                style={styles.input}
                value={bankAccountNumber}
                onChangeText={setBankAccountNumber}
              />
            </>
          )}

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Create password"
            placeholderTextColor="#8A8A8A"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.passwordHint}>
            Must be 8+ characters with 1 uppercase letter, 1 number, and 1 special character.
          </Text>

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            placeholder="Re-enter password"
            placeholderTextColor="#8A8A8A"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating Account..." : "Register"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.loginText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  heroCard: {
    marginBottom: 20,
  },

  logoWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F4B400",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#111111",
  },

  subtitle: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 8,
    marginTop: 10,
  },

  roleRow: {
    flexDirection: "row",
    gap: 10,
  },

  roleButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  roleButtonActive: {
    backgroundColor: "#FFC300",
  },

  roleButtonText: {
    fontWeight: "700",
    color: "#374151",
  },

  roleButtonTextActive: {
    color: "#111111",
  },

  input: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 15,
    color: "#111111",
  },

  passwordHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },

  button: {
    backgroundColor: "#111111",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  loginText: {
    textAlign: "center",
    marginTop: 18,
    color: "#2563EB",
    fontWeight: "600",
  },
});