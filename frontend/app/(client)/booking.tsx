import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createBooking } from "@/src/api/bookings";

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (!address) {
      Alert.alert("Address required");
      return;
    }

    try {
      setLoading(true);

      await createBooking({
        service: Number(id),
        address,
        notes,
        scheduled_at: null,
      });

      Alert.alert("Success", "Booking created!");

      router.replace("/(tabs)/bookings");
    } catch (err) {
      console.log("BOOKING ERROR:", err);
      Alert.alert("Error", "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 20 }}>
        Create Booking
      </Text>

      <Text style={{ marginBottom: 5 }}>Address</Text>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Enter service address"
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
        }}
      />

      <Text style={{ marginBottom: 5 }}>Notes (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Extra instructions..."
        multiline
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 8,
          padding: 12,
          height: 80,
          marginBottom: 20,
        }}
      />

      <Pressable
        onPress={handleBooking}
        style={{
          backgroundColor: "#000",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Confirm Booking
          </Text>
        )}
      </Pressable>
    </View>
  );
}