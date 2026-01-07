import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/store/AuthContext";
import { router } from "expo-router";

export default function LoginScreen() {
  const { login } = useAuth(); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Missing info", "Please enter username and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login(username.trim(), password);
      router.replace("/"); // your index.tsx handles role redirect
    } catch (e: any) {
      Alert.alert("Login failed", "Check username/password or server connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>KaamSewa Login</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Button title={submitting ? "Logging in..." : "Login"} onPress={onLogin} disabled={submitting} />
    </View>
  );
}