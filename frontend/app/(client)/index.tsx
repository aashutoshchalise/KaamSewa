import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/store/AuthContext";

export default function ClientHome() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        justifyContent: "center",
      }}
    >
      {/* Welcome */}
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        Welcome {user?.username}
      </Text>

      {/* Explore Services */}
      <Pressable
        onPress={() => router.push("/(tabs)/explore")}
        style={{
          backgroundColor: "#000",
          padding: 14,
          borderRadius: 10,
          marginBottom: 15,
        }}
      >
        <Text
          style={{
            color: "#fff",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          Explore Services
        </Text>
      </Pressable>

      {/* My Bookings */}
      <Pressable
        onPress={() => router.push("/(tabs)/bookings")}
        style={{
          backgroundColor: "#2563eb",
          padding: 14,
          borderRadius: 10,
          marginBottom: 15,
        }}
      >
        <Text
          style={{
            color: "#fff",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          My Bookings
        </Text>
      </Pressable>

      {/* Logout */}
      <Pressable
        onPress={async () => {
          await logout();
        }}
        style={{
          backgroundColor: "#ef4444",
          padding: 14,
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            color: "#fff",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          Logout
        </Text>
      </Pressable>
    </View>
  );
}