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
import { useRouter } from "expo-router";
import { getStatusMeta } from "../../src/utils/status";

export default function ClientBookings() {
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
        renderItem={({ item }) => {
          const statusMeta = getStatusMeta(item.status);

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(client)/booking/${item.id}`)}
            >
              <View style={{ flex: 1 }}>
              <Text style={styles.service}>
                {item.package_name || item.service_name || "Booking"}
              </Text>

              <Text style={styles.price}>
                Rs. {item.service_price}
                {item.service_pricing_unit ? ` / ${item.service_pricing_unit}` : ""}
              </Text>

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
              </View>

              <Ionicons name="chevron-forward" size={20} color="#999999" />
            </TouchableOpacity>
          );
        }}
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

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontWeight: "600",
    fontSize: 12,
  },
});