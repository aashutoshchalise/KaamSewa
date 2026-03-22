import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { register } from "../../src/api/auth";
import { useAuth } from "../../src/store/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CLIENT" | "WORKER">("CLIENT");

  async function handleRegister() {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Please fill all required fields");
      return;
    }

    try {
      await register({
        username,
        password,
        phone: phone.trim(),
        role,
      });

      await login(username, password);
      router.replace("/");
    } catch (err: any) {
      console.log(err);
      Alert.alert(
        "Registration failed",
        JSON.stringify(err?.response?.data || err?.message || "Something went wrong")
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <View style={{ marginBottom: 20 }}>
        <Button title="Register as Client" onPress={() => setRole("CLIENT")} />
        <View style={{ height: 10 }} />
        <Button title="Register as Worker" onPress={() => setRole("WORKER")} />
      </View>

      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "bold",
    color: "#111111",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    color: "#111111",
  },
});