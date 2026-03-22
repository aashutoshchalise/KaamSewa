import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getMyBookings } from "../../src/api/bookings";
import type { Booking } from "../../src/types";

export default function WorkerIncome() {
  const { data, isLoading } = useQuery<Booking[]>({
    queryKey: ["worker-income-jobs"],
    queryFn: getMyBookings,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  const completedJobs = data?.filter((job) => job.status === "COMPLETED") ?? [];

  const total = completedJobs.reduce(
    (sum, job) => sum + Number(job.final_price || job.service_price || 0),
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="wallet-outline" size={24} color="#111111" />
          </View>
        </View>

        <Text style={styles.heroTitle}>Income Overview</Text>
        <Text style={styles.heroSubtitle}>
          Track your completed jobs and estimated earnings
        </Text>

        <View style={styles.summaryPanel}>
          <Text style={styles.summaryLabel}>Estimated Total Income</Text>
          <Text style={styles.summaryAmount}>Rs. {total}</Text>
        </View>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatNumber}>{completedJobs.length}</Text>
            <Text style={styles.heroStatLabel}>Completed Jobs</Text>
          </View>

          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatNumber}>
              {completedJobs.length > 0
                ? `Rs. ${Math.round(total / completedJobs.length)}`
                : "Rs. 0"}
            </Text>
            <Text style={styles.heroStatLabel}>Avg. Per Job</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Completed Jobs</Text>
        <Text style={styles.sectionCount}>{completedJobs.length} jobs</Text>
      </View>

      {completedJobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="cash-outline" size={42} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No completed jobs yet</Text>
          <Text style={styles.emptyText}>
            Your completed jobs and earnings will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={completedJobs}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const displayedAmount = item.final_price || item.service_price;

            return (
              <View style={styles.jobCard}>
                <View style={styles.jobTop}>
                  <View style={styles.jobIconWrap}>
                    <Ionicons
                      name="briefcase-outline"
                      size={18}
                      color="#111111"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle}>{item.service_name}</Text>
                    <Text style={styles.jobSub}>Job #{item.id}</Text>
                  </View>

                  <Text style={styles.jobAmount}>Rs. {displayedAmount}</Text>
                </View>

                <View style={styles.jobInfoBlock}>
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
    paddingTop: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  heroCard: {
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },

  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#F4B400",
    justifyContent: "center",
    alignItems: "center",
  },

  heroTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  heroSubtitle: {
    marginTop: 6,
    color: "#D1D5DB",
    fontSize: 14,
  },

  summaryPanel: {
    backgroundColor: "#1F2937",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },

  summaryLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },

  summaryAmount: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  heroStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  heroStatBox: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 14,
  },

  heroStatNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  heroStatLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
  },

  sectionCount: {
    fontSize: 13,
    color: "#6B7280",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
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

  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },

  jobTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  jobIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFF7D6",
    justifyContent: "center",
    alignItems: "center",
  },

  jobTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111111",
  },

  jobSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },

  jobAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111111",
  },

  jobInfoBlock: {
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
});