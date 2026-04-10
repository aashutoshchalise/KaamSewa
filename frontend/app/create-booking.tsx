import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { createBooking, createNegotiation } from "../src/api/bookings";
import MapPicker from "../components/MapPicker";

export default function CreateBooking() {
  const { serviceId, packageId, mode } = useLocalSearchParams();
  const router = useRouter();

  const bookingMode = mode === "negotiation" ? "negotiation" : "base";
  const isPackageBooking = !!packageId;

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  function formatDate(date: Date) {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function combineDateAndTime(datePart: Date, timePart: Date) {
    const combined = new Date(datePart);
    combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
    return combined;
  }

  function handleDateChange(_: any, date?: Date) {
    setShowDatePicker(false);
    if (date) {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      setSelectedDate(normalized);
    }
  }

  function handleTimeChange(_: any, time?: Date) {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  }

  async function handleBooking() {
    if (!serviceId && !packageId) {
      Alert.alert("Selection missing", "Please choose a service or package.");
      return;
    }

    if (!address.trim()) {
      Alert.alert("Address is required");
      return;
    }

    if (bookingMode === "negotiation" && !offerPrice.trim()) {
      Alert.alert("Please enter your offer price");
      return;
    }

    if (isPackageBooking && bookingMode === "negotiation") {
      Alert.alert(
        "Package booking",
        "Negotiation is not available for packages right now."
      );
      return;
    }

    const scheduledAt = combineDateAndTime(selectedDate, selectedTime);
    const now = new Date();

    if (scheduledAt <= now) {
      Alert.alert("Please choose a future date and time");
      return;
    }

    try {
      const finalAddress = pickedCoords
        ? `${address.trim()} (${pickedCoords.lat}, ${pickedCoords.lng})`
        : address.trim();

      const bookingPayload: any = {
        address: finalAddress,
        notes: notes.trim(),
        scheduled_at: scheduledAt.toISOString(),
      };

      if (serviceId) {
        bookingPayload.service = Number(serviceId);
      }

      if (packageId) {
        bookingPayload.package = Number(packageId);
      }

      const booking = await createBooking(bookingPayload);

      if (bookingMode === "negotiation" && serviceId) {
        await createNegotiation(booking.id, {
          proposed_price: offerPrice.trim(),
          message: offerMessage.trim(),
        });

        Alert.alert(
          "Offer sent",
          "Your booking was created and your price offer was sent."
        );
      } else {
        Alert.alert(
          "Booking Created",
          isPackageBooking
            ? "Your package booking was created successfully."
            : "Your booking was created successfully at the base price."
        );
      }

      router.replace("/(client)/bookings");
    } catch (err: any) {
      Alert.alert(
        "Booking failed",
        JSON.stringify(err?.response?.data || err?.message || "Something went wrong")
      );
    }
  }

  const finalScheduledPreview = combineDateAndTime(selectedDate, selectedTime);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons
            name={
              bookingMode === "negotiation"
                ? "swap-horizontal-outline"
                : "calendar-outline"
            }
            size={24}
            color="#111111"
          />
        </View>

        <Text style={styles.title}>
          {isPackageBooking
            ? "Schedule Package"
            : bookingMode === "negotiation"
            ? "Negotiate Service"
            : "Schedule Service"}
        </Text>

        <Text style={styles.subtitle}>
          {isPackageBooking
            ? "Choose your preferred schedule and confirm your package booking."
            : bookingMode === "negotiation"
            ? "Set your schedule and send an offer price to the worker."
            : "Choose your preferred schedule and confirm at the base price."}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pick Service Location</Text>
        <Text style={styles.sectionHint}>
          Tap on the map to select the location, then confirm the address below.
        </Text>

        <MapPicker
          onLocationSelect={(lat, lng) => {
            setPickedCoords({ lat, lng });
            if (!address.trim()) {
              setAddress(`${lat}, ${lng}`);
            }
          }}
        />

        {pickedCoords ? (
          <View style={styles.previewCard}>
            <Ionicons name="location-outline" size={18} color="#15803D" />
            <Text style={styles.previewText}>
              Selected coordinates:{" "}
              <Text style={styles.previewStrong}>
                {pickedCoords.lat}, {pickedCoords.lng}
              </Text>
            </Text>
          </View>
        ) : null}

        <TextInput
          placeholder="Enter full service address"
          placeholderTextColor="#888"
          style={[styles.input, { marginTop: 14 }]}
          value={address}
          onChangeText={setAddress}
          multiline
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <Text style={styles.sectionHint}>
          Pick a date and time that works best for you.
        </Text>

        <View style={styles.scheduleRow}>
          <TouchableOpacity
            style={styles.scheduleBox}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#111111" />
            <View style={styles.scheduleTextWrap}>
              <Text style={styles.scheduleLabel}>Date</Text>
              <Text style={styles.scheduleValue}>{formatDate(selectedDate)}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scheduleBox}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={18} color="#111111" />
            <View style={styles.scheduleTextWrap}>
              <Text style={styles.scheduleLabel}>Time</Text>
              <Text style={styles.scheduleValue}>{formatTime(selectedTime)}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            minimumDate={minDate}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimeChange}
          />
        )}

        <View style={styles.previewCard}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#15803D" />
          <Text style={styles.previewText}>
            Scheduled for{" "}
            <Text style={styles.previewStrong}>
              {finalScheduledPreview.toLocaleString()}
            </Text>
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <Text style={styles.sectionHint}>
          Add any instructions that can help the worker.
        </Text>

        <TextInput
          placeholder="Example: Please call before arriving..."
          placeholderTextColor="#888"
          style={[styles.input, styles.notesInput]}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {!isPackageBooking && bookingMode === "negotiation" ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Offer</Text>
          <Text style={styles.sectionHint}>
            Send your preferred price and an optional message.
          </Text>

          <TextInput
            placeholder="Enter your offer price"
            placeholderTextColor="#888"
            keyboardType="numeric"
            style={styles.input}
            value={offerPrice}
            onChangeText={setOfferPrice}
          />

          <TextInput
            placeholder="Optional message to worker"
            placeholderTextColor="#888"
            style={[styles.input, styles.notesInput]}
            multiline
            value={offerMessage}
            onChangeText={setOfferMessage}
          />
        </View>
      ) : (
        <View style={styles.infoCard}>
          <Ionicons name="cash-outline" size={18} color="#B45309" />
          <Text style={styles.infoText}>
            {isPackageBooking
              ? "You are booking a package at a fixed package price."
              : "You are booking this service at the base price. The worker can claim your booking directly."}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleBooking}>
        <Text style={styles.buttonText}>
          {!isPackageBooking && bookingMode === "negotiation"
            ? "Create Booking & Send Offer"
            : "Confirm Booking"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFC300",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  subtitle: {
    marginTop: 6,
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 21,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111111",
  },

  sectionHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginBottom: 14,
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111111",
  },

  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  scheduleRow: {
    gap: 12,
  },

  scheduleBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  scheduleTextWrap: {
    flex: 1,
  },

  scheduleLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },

  scheduleValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },

  previewCard: {
    marginTop: 10,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  previewText: {
    flex: 1,
    fontSize: 13,
    color: "#166534",
    lineHeight: 18,
  },

  previewStrong: {
    fontWeight: "bold",
  },

  infoCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 18,
  },

  infoText: {
    flex: 1,
    color: "#92400E",
    fontSize: 13,
    lineHeight: 19,
  },

  button: {
    marginTop: 6,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFC300",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  buttonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },
});