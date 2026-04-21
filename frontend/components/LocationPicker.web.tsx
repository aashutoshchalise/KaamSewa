import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";

type Props = {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
};

export default function LocationPicker({ onLocationSelect }: Props) {
  const [search, setSearch] = useState("");

  const handleSelect = () => {
    onLocationSelect({
      latitude: 27.7172,
      longitude: 85.324,
      address: search.trim() || "Kathmandu",
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location</Text>
      <Text style={styles.subtitle}>
        Web preview does not support the native map. Enter a location manually.
      </Text>

      <TextInput
        placeholder="Search or enter location"
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={handleSelect}>
        <Text style={styles.buttonText}>Confirm Location</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111111",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111111",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#F4B400",
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#111111",
    fontSize: 15,
  },
});