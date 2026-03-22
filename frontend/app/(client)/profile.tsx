import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useAuth } from "../../src/store/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getMyBookings } from "../../src/api/bookings";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: bookings } = useQuery({
    queryKey: ["my-bookings"],
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

  const totalBookings = bookings?.length ?? 0;
  const completedBookings =
    bookings?.filter((booking) => booking.status === "COMPLETED").length ?? 0;
  const activeBookings =
    bookings?.filter((booking) =>
      ["PENDING", "CLAIMED", "NEGOTIATING", "ACCEPTED", "IN_PROGRESS"].includes(
        booking.status
      )
    ).length ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.username?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.role}>{user.role}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Info</Text>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color="#6B7280" />
          <Text style={styles.infoText}>
            {user.phone ? user.phone : "Phone not added"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color="#6B7280" />
          <Text style={styles.infoText}>
            {user.email ? user.email : "Email not added"}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeBookings}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedBookings}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="star-outline" size={22} color="#F4B400" />
          <Text style={styles.statLabelIcon}>Reviews Ready</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(client)/bookings")}
        >
          <Ionicons name="document-text-outline" size={20} color="#111111" />
          <Text style={styles.menuText}>My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(client)/edit-profile")}
        >
          <Ionicons name="create-outline" size={20} color="#111111" />
          <Text style={styles.menuText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert("Coming Soon", "Delete account feature")}
        >
          <Ionicons name="trash-outline" size={20} color="#111111" />
          <Text style={styles.menuText}>Delete Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#F4B400" />
          <Text style={[styles.menuText, { color: "#F4B400" }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

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
    fontSize: 14,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },

  infoText: {
    fontSize: 15,
    color: "#111111",
  },

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
    justifyContent: "center",
    minHeight: 95,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
  },

  statLabel: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
  },

  statLabelIcon: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
  },

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
    color: "#111111",
    fontWeight: "500",
  },
});