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
import { createBooking, createNegotiation } from "../src/api/bookings";

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
  const { serviceId, mode } = useLocalSearchParams();
  const router = useRouter();

  const bookingMode = mode === "negotiation" ? "negotiation" : "base";

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const today = new Date();
  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);
    return d;
  });

  async function handleBooking() {
    if (!selectedDate || !selectedTime || !address) {
      Alert.alert("Please complete all required fields");
      return;
    }

    if (bookingMode === "negotiation" && !offerPrice.trim()) {
      Alert.alert("Please enter your offer price");
      return;
    }

    try {
      const booking = await createBooking({
        service: Number(serviceId),
        address,
        notes,
        scheduled_at: new Date(selectedDate).toISOString(),
      });

      if (bookingMode === "negotiation") {
        await createNegotiation(booking.id, {
          proposed_price: offerPrice.trim(),
          message: offerMessage.trim(),
        });

        Alert.alert("Offer sent", "Your booking was created and your price offer was sent.");
      } else {
        Alert.alert("Booking Created!", "Your booking was created at the base price.");
      }

      router.replace("/(client)/bookings");
    } catch (err: any) {
      Alert.alert(
        "Booking failed",
        JSON.stringify(err?.response?.data || err?.message || "Something went wrong")
      );
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {bookingMode === "negotiation" ? "Negotiate Service" : "Schedule Service"}
      </Text>

      {bookingMode === "negotiation" && (
        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>Negotiation Mode</Text>
          <Text style={styles.modeText}>
            Enter your preferred offer price. The worker can accept or counter it.
          </Text>
        </View>
      )}

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

      <Text style={styles.sectionTitle}>Address</Text>
      <TextInput
        placeholder="Enter service address"
        placeholderTextColor="#666"
        style={styles.input}
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.sectionTitle}>Notes (Optional)</Text>
      <TextInput
        placeholder="Any additional instructions"
        placeholderTextColor="#666"
        style={[styles.input, { height: 80 }]}
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      {bookingMode === "negotiation" && (
        <>
          <Text style={styles.sectionTitle}>Your Offer Price</Text>
          <TextInput
            placeholder="Enter your offer price"
            placeholderTextColor="#666"
            keyboardType="numeric"
            style={styles.input}
            value={offerPrice}
            onChangeText={setOfferPrice}
          />

          <Text style={styles.sectionTitle}>Message to Worker (Optional)</Text>
          <TextInput
            placeholder="Write your message or reasoning"
            placeholderTextColor="#666"
            style={[styles.input, { height: 90 }]}
            multiline
            value={offerMessage}
            onChangeText={setOfferMessage}
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleBooking}>
        <Text style={styles.buttonText}>
          {bookingMode === "negotiation" ? "Create Booking & Send Offer" : "Confirm Booking"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8F8F8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#111111",
  },

  modeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 6,
  },

  modeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 6,
  },

  modeText: {
    color: "#666666",
    lineHeight: 20,
  },

  sectionTitle: {
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 15,
    color: "#111111",
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
    backgroundColor: "#FFC300",
  },

  selectedText: {
    color: "#111111",
    fontWeight: "bold",
  },

  normalText: {
    color: "#333",
  },

  input: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    color: "#111111",
  },

  button: {
    marginTop: 30,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#FFC300",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  buttonText: {
    color: "#111111",
    fontWeight: "bold",
  },
});