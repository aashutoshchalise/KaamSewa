import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getMyBookings, startJob, completeJob } from "../../src/api/bookings";
import type { Booking } from "../../src/types";
import { getStatusMeta } from "../../src/utils/status";

export default function WorkerJobs() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery<Booking[]>({
    queryKey: ["worker-my-jobs"],
    queryFn: getMyBookings,
  });

  const startMutation = useMutation({
    mutationFn: startJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-my-jobs"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-my-jobs"] });
    },
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
        <Ionicons name="briefcase-outline" size={42} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No job history yet</Text>
        <Text style={styles.emptyText}>
          Claimed and completed jobs will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
        <Text style={styles.subTitle}>{data.length} job(s)</Text>
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
              onPress={() => router.push(`/(worker)/job/${item.id}`)}
              activeOpacity={0.92}
            >
              <View style={styles.cardTop}>
                <View style={styles.serviceWrap}>
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name="briefcase-outline"
                      size={18}
                      color="#111111"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {item.service_name}
                    </Text>
                    <Text style={styles.jobId}>Job #{item.id}</Text>
                  </View>
                </View>

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
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => router.push(`/(worker)/job/${item.id}`)}
                >
                  <Text style={styles.detailsText}>View Details</Text>
                  <Ionicons
                    name="arrow-forward-outline"
                    size={15}
                    color="#111111"
                  />
                </TouchableOpacity>

                {(item.status === "ACCEPTED" || item.status === "CLAIMED") && (
                  <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={() => startMutation.mutate(item.id)}
                    disabled={startMutation.isPending}
                  >
                    <Text style={styles.primaryActionText}>
                      {startMutation.isPending ? "Starting..." : "Start"}
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status === "IN_PROGRESS" && (
                  <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={() => completeMutation.mutate(item.id)}
                    disabled={completeMutation.isPending}
                  >
                    <Text style={styles.primaryActionText}>
                      {completeMutation.isPending ? "Completing..." : "Complete"}
                    </Text>
                  </TouchableOpacity>
                )}
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
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

  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
  },

  jobId: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
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
    gap: 10,
  },

  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },

  detailsText: {
    color: "#111111",
    fontWeight: "600",
    fontSize: 13,
  },

  primaryAction: {
    backgroundColor: "#F4B400",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
  },

  primaryActionText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 13,
  },
});