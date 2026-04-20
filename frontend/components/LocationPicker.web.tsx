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
    // fake coords for web
    onLocationSelect({
      latitude: 27.7172,
      longitude: 85.324,
      address: search || "Kathmandu",
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location (Web)</Text>

      <TextInput
        placeholder="Enter location"
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
  container: { padding: 12 },
  title: { fontWeight: "bold", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#F4B400",
    padding: 10,
    borderRadius: 10,
  },
  buttonText: { textAlign: "center", fontWeight: "bold" },
});