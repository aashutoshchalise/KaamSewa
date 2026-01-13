import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/store/AuthContext";

export default function Index() {
  const { booting, role } = useAuth();

  // while checking token / calling /api/me
  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // not logged in -> go login
  if (!role) {
    return <Redirect href="/(auth)/login" />;
  }

  // logged in -> role home
  if (role === "ADMIN") return <Redirect href="/(admin)" />;
  if (role === "WORKER") return <Redirect href="/(worker)" />;
  return <Redirect href="/(client)" />;
}