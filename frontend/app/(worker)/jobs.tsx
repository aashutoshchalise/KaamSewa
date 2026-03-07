import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBookings, startJob, completeJob } from "../../src/api/bookings";
import type { Booking } from "../../src/types";
import { getStatusMeta } from "../../src/utils/status";

export default function WorkerJobs() {
  const queryClient = useQueryClient();

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
        <ActivityIndicator size="large" color="#FFC300" />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#666666" }}>No job history yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Jobs</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const statusMeta = getStatusMeta(item.status);

          return (
            <View style={styles.card}>
              <Text style={styles.serviceName}>{item.service_name}</Text>

              <Text style={styles.price}>
                Rs. {item.service_price} / {item.service_pricing_unit}
              </Text>

              <Text style={styles.address}>{item.address}</Text>

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

              <View style={styles.actions}>
                {(item.status === "ACCEPTED" || item.status === "CLAIMED") && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startMutation.mutate(item.id)}
                  >
                    <Text style={styles.actionText}>Start Job</Text>
                  </TouchableOpacity>
                )}

                {item.status === "IN_PROGRESS" && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => completeMutation.mutate(item.id)}
                  >
                    <Text style={styles.actionText}>Complete Job</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
  },

  price: {
    marginTop: 4,
    color: "#666666",
  },

  address: {
    marginTop: 6,
    color: "#555555",
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  actionButton: {
    backgroundColor: "#FFC300",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  actionText: {
    color: "#111111",
    fontWeight: "bold",
  },
});