import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { createBooking } from "../src/api/bookings";

const timeSlots = [
  "8AM - 9AM",
  "9AM - 10AM",
  "10AM - 11AM",
  "11AM - 12PM",
  "12PM - 1PM",
  "1PM - 2PM",
  "2PM - 3PM",
  "3PM - 4PM",
];

export default function CreateBooking() {
  const { serviceId } = useLocalSearchParams();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const today = new Date();
  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);
    return d;
  });

  async function handleBooking() {
    if (!selectedDate || !selectedTime || !address) {
      Alert.alert("Please complete all fields");
      return;
    }

    try {
      await createBooking({
        service: Number(serviceId),
        address,
        notes,
        scheduled_at: new Date(selectedDate).toISOString(),
      });

      Alert.alert("Booking Created!");
      router.replace("/(client)/bookings");
    } catch (err) {
      Alert.alert("Booking failed");
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Schedule Service</Text>

      {/* DATE SECTION */}
      <Text style={styles.sectionTitle}>Select Date</Text>
      <View style={styles.rowWrap}>
        {dates.map((d) => {
          const value = d.toDateString();
          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.dateBox,
                selectedDate === value && styles.selectedBox,
              ]}
              onPress={() => setSelectedDate(value)}
            >
              <Text
                style={
                  selectedDate === value
                    ? styles.selectedText
                    : styles.normalText
                }
              >
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TIME SECTION */}
      <Text style={styles.sectionTitle}>Select Time</Text>
      <View style={styles.rowWrap}>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.timeBox,
              selectedTime === slot && styles.selectedBox,
            ]}
            onPress={() => setSelectedTime(slot)}
          >
            <Text
              style={
                selectedTime === slot
                  ? styles.selectedText
                  : styles.normalText
              }
            >
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ADDRESS */}
      <Text style={styles.sectionTitle}>Address</Text>
      <TextInput
        placeholder="Enter service address"
        placeholderTextColor="#666"
        style={styles.input}
        value={address}
        onChangeText={setAddress}
      />

      {/* NOTES */}
      <Text style={styles.sectionTitle}>Notes (Optional)</Text>
      <TextInput
        placeholder="Any additional instructions"
        placeholderTextColor="#666"
        style={[styles.input, { height: 80 }]}
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity style={styles.button} onPress={handleBooking}>
        <Text style={styles.buttonText}>
          Confirm Booking
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8F8F8", // changed
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#111111", // changed
  },

  sectionTitle: {
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 15,
    color: "#111111", // changed
  },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  dateBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },

  timeBox: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#ffffff",
  },

  selectedBox: {
    backgroundColor: "#FFC300", // changed
  },

  selectedText: {
    color: "#111111", // changed
    fontWeight: "bold",
  },

  normalText: {
    color: "#333",
  },

  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
  },

  button: {
    marginTop: 30,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#FFC300", // changed
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#111111", // changed
    fontWeight: "bold",
  },
});