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
import {
  getAvailableJobs,
  claimJob,
  getMyBookings,
} from "../../src/api/bookings";
import type { Booking } from "../../src/types";
import { getStatusMeta } from "../../src/utils/status";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: availableJobs, isLoading: loadingAvailable } =
    useQuery<Booking[]>({
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
    myJobs?.filter((job) =>
      ["CLAIMED", "NEGOTIATING", "ACCEPTED", "IN_PROGRESS"].includes(job.status)
    ) ?? [];

  const completedJobs =
    myJobs?.filter((job) => job.status === "COMPLETED") ?? [];

  const estimatedIncome = completedJobs.reduce(
    (sum, job) => sum + Number(job.final_price || job.service_price || 0),
    0
  );

  const availableCount = availableJobs?.length ?? 0;

  if (loadingAvailable || loadingMyJobs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HERO */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Welcome back 👋</Text>
        <Text style={styles.heroName}>{user?.username}</Text>
        <Text style={styles.heroSub}>Let’s get some work done today</Text>
      </View>

      {/* STATS */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="briefcase-outline" size={20} color="#F4B400" />
          <Text style={styles.statNumber}>{availableCount}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={20} color="#3B82F6" />
          <Text style={styles.statNumber}>{activeJobs.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-done-outline" size={20} color="#22C55E" />
          <Text style={styles.statNumber}>{completedJobs.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="wallet-outline" size={20} color="#F59E0B" />
          <Text style={styles.statNumber}>Rs {estimatedIncome}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
      </View>

      {/* SECTION TITLE */}
      <Text style={styles.sectionTitle}>Available Jobs</Text>

      {!availableJobs || availableJobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No jobs available</Text>
          <Text style={styles.emptyText}>
            New bookings will appear here soon
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
                    Rs. {item.service_price} /{" "}
                    {item.service_pricing_unit}
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
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  /* HERO */
  heroCard: {
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },

  heroTitle: {
    color: "#aaa",
    fontSize: 14,
  },

  heroName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
  },

  heroSub: {
    color: "#ccc",
    marginTop: 6,
  },

  /* STATS */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
  },

  statNumber: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },

  statLabel: {
    marginTop: 2,
    color: "#666",
    fontSize: 13,
  },

  /* SECTION */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 14,
  },

  /* EMPTY */
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    color: "#666",
  },

  /* JOB CARD */
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },

  jobTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },

  jobPrice: {
    marginTop: 4,
    color: "#666",
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  claimButton: {
    backgroundColor: "#F4B400",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  claimButtonText: {
    color: "#111",
    fontWeight: "bold",
  },
});