import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../src/store/AuthContext";
import { getMyBookings } from "../../src/api/bookings";
import type { Booking } from "../../src/types";

export default function WorkerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const { data: jobs, isLoading } = useQuery<Booking[]>({
    queryKey: ["worker-my-jobs"],
    queryFn: getMyBookings,
  });

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  if (!user) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FFC300" />
      </View>
    );
  }

  const allJobs = jobs ?? [];
  const totalJobs = allJobs.length;
  const completedJobs = allJobs.filter(
    (job) => job.status === "COMPLETED"
  ).length;
  const inProgressJobs = allJobs.filter(
    (job) => job.status === "IN_PROGRESS"
  ).length;
  const activeJobs = allJobs.filter((job) =>
    ["CLAIMED", "NEGOTIATING", "ACCEPTED", "IN_PROGRESS"].includes(job.status)
  ).length;

  let ratingSum = 0;
  let ratingCount = 0;

  allJobs.forEach((job) => {
    if (job.review_rating != null) {
      ratingSum += Number(job.review_rating);
      ratingCount += 1;
    }
  });

  const averageRating =
    ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.username?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.role}>{user.role}</Text>

        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>
            {user.phone ? user.phone : "Not added yet"}
          </Text>

          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>
            {user.email ? user.email : "Not added yet"}
          </Text>

          <Text style={styles.infoLabel}>Average Rating</Text>
          <Text style={styles.infoValue}>
            {averageRating ? `${averageRating} / 5` : "No ratings yet"}
          </Text>

          <Text style={styles.infoLabel}>Reviews</Text>
          <Text style={styles.infoValue}>{ratingCount} review(s)</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalJobs}</Text>
          <Text style={styles.statLabel}>Total Jobs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedJobs}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeJobs}</Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{inProgressJobs}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(worker)/jobs")}
        >
          <Ionicons name="briefcase-outline" size={20} color="#111111" />
          <Text style={styles.menuText}>My Jobs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(worker)/income")}
        >
          <Ionicons name="wallet-outline" size={20} color="#111111" />
          <Text style={styles.menuText}>My Income</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(worker)/edit-profile")}
        >
          <Ionicons name="create-outline" size={20} color="#111111" />
          <Text style={styles.menuText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuRow, styles.logoutRow]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFC300" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#FFC300" />
          <Text style={styles.loadingText}>Loading job stats...</Text>
        </View>
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

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 20,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFC300",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#111111",
  },

  name: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
  },

  role: {
    marginTop: 6,
    fontSize: 16,
    color: "#666666",
    fontWeight: "600",
  },

  infoBlock: {
    width: "100%",
    marginTop: 22,
  },

  infoLabel: {
    marginTop: 12,
    fontSize: 13,
    color: "#777777",
  },

  infoValue: {
    marginTop: 4,
    fontSize: 16,
    color: "#111111",
    fontWeight: "500",
  },

  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111111",
  },

  statLabel: {
    marginTop: 8,
    fontSize: 14,
    color: "#666666",
  },

  menuCard: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 8,
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  menuText: {
    fontSize: 16,
    color: "#111111",
    fontWeight: "500",
  },

  logoutRow: {
    marginTop: 4,
  },

  logoutText: {
    fontSize: 16,
    color: "#FFC300",
    fontWeight: "bold",
  },

  loadingBox: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },

  loadingText: {
    color: "#666666",
  },
});