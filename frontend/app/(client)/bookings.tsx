import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getMyBookings } from "../../src/api/bookings";
import type { Booking } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

export default function ClientBookings() {
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

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-outline" size={60} color="#CCCCCC" />
        <Text style={{ marginTop: 15, color: "#666666" }}>
          No bookings yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.service}>
                {item.service_name}
              </Text>

              <Text style={styles.price}>
                Rs. {item.service_price} / {item.service_pricing_unit}
              </Text>

              <Text style={styles.status}>
                Status: {item.status}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111111",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    alignItems: "center",
  },

  service: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#111111",
  },

  price: {
    marginTop: 4,
    color: "#666666",
  },

  status: {
    marginTop: 6,
    color: "#FFC300",
    fontWeight: "600",
  },
});