import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { login } from "../../src/api/auth";
import { setTokens } from "@/src/api/api";
export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await login({
        username,
        password,
      });

      await setTokens(res.access, res.refresh);

      Alert.alert("Login success ✅");

      router.replace("/(client)/bookings");
    } catch (err: any) {
      Alert.alert(
        "Login failed",
        err?.response?.data?.detail || "Invalid credentials"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back 👋</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* REGISTER BUTTON */}
      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.registerText}>
          Don’t have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6B7280",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  registerText: {
    textAlign: "center",
    marginTop: 16,
    color: "#2563EB",
  },
});