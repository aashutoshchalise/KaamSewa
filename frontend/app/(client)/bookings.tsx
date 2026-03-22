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
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-outline" size={52} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No bookings yet</Text>
        <Text style={styles.emptyText}>
          Once you book a service, it will show up here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subTitle}>{data.length} booking(s)</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const statusMeta = getStatusMeta(item.status);
          const displayedPrice = item.final_price || item.service_price;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(client)/booking/${item.id}`)}
              activeOpacity={0.92}
            >
              <View style={styles.cardTop}>
                <View style={styles.serviceWrap}>
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color="#111111"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.service} numberOfLines={1}>
                      {item.service_name}
                    </Text>
                    <Text style={styles.bookingId}>Booking #{item.id}</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>

              <View style={styles.infoBlock}>
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    Rs. {displayedPrice} / {item.service_pricing_unit}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText} numberOfLines={2}>
                    {item.address}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {item.scheduled_at
                      ? new Date(item.scheduled_at).toLocaleString()
                      : "Not scheduled"}
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
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

                <View style={styles.detailsButton}>
                  <Text style={styles.detailsText}>View Details</Text>
                  <Ionicons
                    name="arrow-forward-outline"
                    size={14}
                    color="#111111"
                  />
                </View>
              </View>
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
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111111",
  },

  subTitle: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 14,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
  },

  emptyText: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  serviceWrap: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },

  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFF7D6",
    justifyContent: "center",
    alignItems: "center",
  },

  service: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#111111",
  },

  bookingId: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  infoBlock: {
    marginTop: 14,
    gap: 10,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },

  footer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontWeight: "700",
    fontSize: 11,
  },

  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },

  detailsText: {
    color: "#111111",
    fontWeight: "600",
    fontSize: 13,
  },
});