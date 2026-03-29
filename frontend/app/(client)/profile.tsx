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
import { Redirect } from "expo-router";
import { useAuth } from "../../src/store/AuthContext";

export default function ClientProfileScreen() {
  const router = useRouter();
  const { user, logout, booting } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  if (booting) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loader}>
        <Text style={styles.emptyText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

        <View style={styles.row}>
          <Ionicons name="call-outline" size={18} color="#6B7280" />
          <Text style={styles.rowText}>{user.phone || "Phone not added"}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="mail-outline" size={18} color="#6B7280" />
          <Text style={styles.rowText}>{user.email || "Email not added"}</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        <MenuItem
          icon="create-outline"
          label="Edit Profile"
          onPress={() => router.push("/(client)/edit-profile")}
        />

        <MenuItem
          icon="document-text-outline"
          label="My Bookings"
          onPress={() => router.push("/(client)/bookings")}
        />

        <MenuItem
          icon="log-out-outline"
          label="Logout"
          color="#F4B400"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress, color = "#111111" }: any) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.menuText, { color }]}>{label}</Text>
    </TouchableOpacity>
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

  emptyText: {
    color: "#6B7280",
    fontSize: 15,
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
});