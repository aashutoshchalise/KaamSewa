import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/store/AuthContext";

export default function Index() {
  const { booting, role } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!role) {
    return <Redirect href="/(auth)/login" />;
  }

  //  ALWAYS go to tabs root
  return <Redirect href="/(tabs)" />;
}