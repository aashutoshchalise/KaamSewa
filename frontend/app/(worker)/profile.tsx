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
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  const allJobs = jobs ?? [];
  const totalJobs = allJobs.length;
  const completedJobs = allJobs.filter((j) => j.status === "COMPLETED").length;
  const inProgressJobs = allJobs.filter((j) => j.status === "IN_PROGRESS").length;
  const activeJobs = allJobs.filter((j) =>
    ["CLAIMED", "NEGOTIATING", "ACCEPTED", "IN_PROGRESS"].includes(j.status)
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.username?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.role}>{user.role}</Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#F4B400" />
          <Text style={styles.ratingText}>
            {averageRating ? `${averageRating} / 5` : "No ratings yet"}
          </Text>
          <Text style={styles.reviewText}>({ratingCount} reviews)</Text>
        </View>
      </View>

      {/* CONTACT */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Info</Text>

        <View style={styles.row}>
          <Ionicons name="call-outline" size={18} color="#6B7280" />
          <Text style={styles.rowText}>
            {user.phone || "Phone not added"}
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="mail-outline" size={18} color="#6B7280" />
          <Text style={styles.rowText}>
            {user.email || "Email not added"}
          </Text>
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalJobs}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedJobs}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeJobs}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{inProgressJobs}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      {/* MENU */}
      <View style={styles.menuCard}>
        <MenuItem
          icon="briefcase-outline"
          label="My Jobs"
          onPress={() => router.push("/(worker)/jobs")}
        />

        <MenuItem
          icon="wallet-outline"
          label="My Income"
          onPress={() => router.push("/(worker)/income")}
        />

        <MenuItem
          icon="create-outline"
          label="Edit Profile"
          onPress={() => router.push("/(worker)/edit-profile")}
        />

        <MenuItem
          icon="log-out-outline"
          label="Logout"
          color="#F4B400"
          onPress={handleLogout}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#F4B400" />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      )}
    </ScrollView>
  );
}

/* MENU ITEM COMPONENT */
function MenuItem({ icon, label, onPress, color = "#111111" }: any) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.menuText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingTop: 40, paddingBottom: 40 },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* HERO */
  hero: {
    backgroundColor: "#111111",
    borderRadius: 26,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F4B400",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#111111",
  },

  name: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  role: {
    marginTop: 4,
    color: "#9CA3AF",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },

  ratingText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  reviewText: {
    color: "#9CA3AF",
    fontSize: 12,
  },

  /* CARD */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111111",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },

  rowText: {
    color: "#111111",
    fontSize: 15,
  },

  /* STATS */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
  },

  statLabel: {
    marginTop: 6,
    color: "#6B7280",
  },

  /* MENU */
  menuCard: {
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
    fontWeight: "500",
  },

  loadingBox: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    color: "#6B7280",
  },
});