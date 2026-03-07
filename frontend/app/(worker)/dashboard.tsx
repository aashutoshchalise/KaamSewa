import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/store/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAvailableJobs, claimJob, getMyBookings } from "../../src/api/bookings";
import type { Booking } from "../../src/types";
import { getStatusMeta } from "../../src/utils/status";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: availableJobs, isLoading: loadingAvailable } = useQuery<Booking[]>({
    queryKey: ["available-jobs"],
    queryFn: getAvailableJobs,
  });

  const { data: myJobs, isLoading: loadingMyJobs } = useQuery<Booking[]>({
    queryKey: ["worker-my-jobs"],
    queryFn: getMyBookings,
  });

  const claimMutation = useMutation({
    mutationFn: claimJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["worker-my-jobs"] });
    },
  });

  const activeJobs =
    myJobs?.filter(
      (job) =>
        job.status === "CLAIMED" ||
        job.status === "NEGOTIATING" ||
        job.status === "ACCEPTED" ||
        job.status === "IN_PROGRESS"
    ) ?? [];

  const completedJobs = myJobs?.filter((job) => job.status === "COMPLETED") ?? [];

  const estimatedIncome = completedJobs.reduce(
    (sum, job) => sum + Number(job.service_price || 0),
    0
  );

  const availableCount = availableJobs?.length ?? 0;

  if (loadingAvailable || loadingMyJobs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFC300" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi, {user?.username}</Text>
      <Text style={styles.subText}>Manage your work and earnings</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{availableCount}</Text>
          <Text style={styles.statLabel}>Available Jobs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeJobs.length}</Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>Rs {estimatedIncome}</Text>
          <Text style={styles.statLabel}>Estimated Income</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Available Jobs</Text>

      {!availableJobs || availableJobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="briefcase-outline" size={40} color="#999" />
          <Text style={styles.emptyTitle}>No available jobs</Text>
          <Text style={styles.emptyText}>
            New client bookings will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableJobs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const statusMeta = getStatusMeta(item.status);

            return (
              <View style={styles.jobCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{item.service_name}</Text>
                  <Text style={styles.jobPrice}>
                    Rs. {item.service_price} / {item.service_pricing_unit}
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

                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => claimMutation.mutate(item.id)}
                >
                  <Text style={styles.claimButtonText}>Claim</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
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

  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111111",
  },

  subText: {
    color: "#666666",
    marginTop: 4,
    marginBottom: 20,
  },

  statsRow: {
    gap: 12,
    marginBottom: 24,
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111111",
  },

  statLabel: {
    marginTop: 4,
    color: "#666666",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 14,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    color: "#666666",
  },

  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  jobTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
  },

  jobPrice: {
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
    fontSize: 12,
    fontWeight: "600",
  },

  claimButton: {
    backgroundColor: "#FFC300",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  claimButtonText: {
    color: "#111111",
    fontWeight: "bold",
  },
});