import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FFC300",
        tabBarInactiveTintColor: "#777",
        tabBarStyle: {
          backgroundColor: "#111111",
          height: 65,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="booking/[id]" options={{ href: null }} />
      <Tabs.Screen name="review/[bookingId]" options={{ href: null }} />
      <Tabs.Screen name="payment-success" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
    </Tabs>
  );
}