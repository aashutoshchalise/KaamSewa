import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/store/AuthContext";
import { router } from "expo-router";
import { login } from "@/src/api/auth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    try {
      await login(username.trim(), password);
      router.replace("/");
    } catch (e: any) {
      console.log("LOGIN ERROR:", e.response?.data || e.message);
      Alert.alert(
        "Login failed",
        JSON.stringify(e.response?.data || e.message)
      );
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
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Button title="Login" onPress={onLogin} />
    </View>
  );
}