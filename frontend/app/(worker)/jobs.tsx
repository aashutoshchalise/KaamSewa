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

function getStatusMeta(status: string) {
  switch (status) {
    case "NEGOTIATING":
      return { label: "Negotiating", bg: "#FCE7F3", text: "#BE185D" };
    case "ACCEPTED":
      return { label: "Accepted", bg: "#DBEAFE", text: "#1D4ED8" };
    case "IN_PROGRESS":
      return { label: "In Progress", bg: "#EDE9FE", text: "#6D28D9" };
    case "COMPLETED":
      return { label: "Completed", bg: "#DCFCE7", text: "#15803D" };
    case "CANCELED":
      return { label: "Canceled", bg: "#FEE2E2", text: "#B91C1C" };
    case "PENDING":
      return { label: "Pending", bg: "#FEF3C7", text: "#B45309" };
    default:
      return { label: status, bg: "#E5E7EB", text: "#374151" };
  }
}

export default function WorkerJobsScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
  });

  const workerJobs =
    data?.filter((item) => item.worker != null) ?? [];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFC300" />
      </View>
    );
  }

  if (!workerJobs || workerJobs.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="briefcase-outline" size={60} color="#CCCCCC" />
        <Text style={{ marginTop: 15, color: "#666666" }}>No jobs yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Jobs</Text>

      <FlatList
        data={workerJobs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => {
          const statusMeta = getStatusMeta(item.status);
          const isNegotiated =
            !!item.final_price &&
            !!item.service_price &&
            String(item.final_price) !== String(item.service_price);

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(worker)/job/${item.id}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.service}>
                  {item.package_name || item.service_name || "Booking"}
                </Text>

                <Text style={styles.price}>
                  Base: Rs. {item.service_price}
                  {item.service_pricing_unit ? ` / ${item.service_pricing_unit}` : ""}
                </Text>

                {isNegotiated && (
                  <Text style={styles.negotiatedPrice}>
                    Final / Negotiated: Rs. {item.final_price}
                  </Text>
                )}

                <View style={[styles.badge, { backgroundColor: statusMeta.bg }]}>
                  <Text style={[styles.badgeText, { color: statusMeta.text }]}>
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
  negotiatedPrice: {
    marginTop: 4,
    color: "#BE185D",
    fontWeight: "700",
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontWeight: "600",
    fontSize: 12,
  },
});