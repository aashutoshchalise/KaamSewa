import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getMyBookings } from "../../../src/api/bookings";
import type { Booking } from "../../../src/types";
import { getStatusMeta } from "../../../src/utils/status";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data, isLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFC300" />
      </View>
    );
  }

  const booking = data?.find((item) => item.id === Number(id));

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#666666" }}>Booking not found</Text>
      </View>
    );
  }

  const statusMeta = getStatusMeta(booking.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Booking Details</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{booking.service_name}</Text>

        <Text style={styles.label}>Price</Text>
        <Text style={styles.value}>
          Rs. {booking.service_price} / {booking.service_pricing_unit}
        </Text>

        <Text style={styles.label}>Status</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusMeta.bgColor },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: statusMeta.textColor },
            ]}
          >
            {statusMeta.label}
          </Text>
        </View>

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{booking.address}</Text>

        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>
          {booking.notes?.trim() ? booking.notes : "No notes provided"}
        </Text>

        <Text style={styles.label}>Scheduled At</Text>
        <Text style={styles.value}>
          {booking.scheduled_at
            ? new Date(booking.scheduled_at).toLocaleString()
            : "Not scheduled"}
        </Text>

        <Text style={styles.label}>Created At</Text>
        <Text style={styles.value}>
          {new Date(booking.created_at).toLocaleString()}
        </Text>

        <Text style={styles.label}>Booking ID</Text>
        <Text style={styles.value}>#{booking.id}</Text>
      </View>

      {booking.status === "COMPLETED" && (
        <TouchableOpacity
          style={styles.rateButton}
          onPress={() => router.push(`/(client)/review/${booking.id}`)}
        >
          <Text style={styles.rateButtonText}>Rate Worker</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },

  label: {
    fontSize: 13,
    color: "#777777",
    marginTop: 14,
    marginBottom: 6,
  },

  value: {
    fontSize: 16,
    color: "#111111",
    fontWeight: "500",
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 2,
  },

  statusText: {
    fontWeight: "600",
    fontSize: 12,
  },

  rateButton: {
    marginTop: 24,
    backgroundColor: "#FFC300",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  rateButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },
});