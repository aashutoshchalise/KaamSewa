import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../src/store/AuthContext";
import { meApi, normalizeRole } from "../../src/api/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordHidden, setPasswordHidden] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      await login(username.trim(), password);

      const me = await meApi();
      const finalRole = normalizeRole(me.role);

      if (finalRole === "WORKER") {
        router.replace("/(worker)/dashboard");
      } else if (finalRole === "CLIENT") {
        router.replace("/(client)/bookings");
      } else {
        router.replace("/(client)/bookings");
      }
    } catch (err: any) {
      Alert.alert(
        "Login failed",
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Invalid credentials or network issue."
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
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.logoWrap}>
            <Ionicons name="construct-outline" size={26} color="#111111" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Login to continue using KaamSewa
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            placeholder="Enter your username"
            placeholderTextColor="#8A8A8A"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#8A8A8A"
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={passwordHidden}
            />
            <TouchableOpacity onPress={() => setPasswordHidden((v) => !v)}>
              <Ionicons
                name={passwordHidden ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.registerText}>
              Don’t have an account? Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
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
    marginTop: 8,
  },

  input: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 15,
    color: "#111111",
  },

  passwordWrap: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111111",
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

  registerText: {
    textAlign: "center",
    marginTop: 18,
    color: "#2563EB",
    fontWeight: "600",
  },
});