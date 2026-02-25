import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
  } from "react-native";
  import { useAuth } from "../../src/store/AuthContext";
  import { useRouter } from "expo-router";
  import { Ionicons } from "@expo/vector-icons";
  import { useQuery } from "@tanstack/react-query";
  import { getMyBookings } from "../../src/api/bookings";
  
  export default function Profile() {
    const { user, logout } = useAuth();
    const router = useRouter();
  
    const { data: bookings, isLoading } = useQuery({
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
          <ActivityIndicator size="large" color="#FFC300" />
        </View>
      );
    }
  
    const totalBookings = bookings?.length ?? 0;
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
  
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
  
          <Text style={styles.name}>{user.username}</Text>
          <Text style={styles.role}>{user.role}</Text>
        </View>
  
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
        </View>
  
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push("/(client)/bookings")}
          >
            <Ionicons name="document-text-outline" size={20} color="#111111" />
            <Text style={styles.rowText}>My Bookings</Text>
          </TouchableOpacity>
  
          <TouchableOpacity style={styles.row}>
            <Ionicons name="create-outline" size={20} color="#111111" />
            <Text style={styles.rowText}>Edit Profile</Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              Alert.alert("Coming Soon", "Delete account feature")
            }
          >
            <Ionicons name="trash-outline" size={20} color="#111111" />
            <Text style={styles.rowText}>Delete Account</Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={[styles.row, styles.logoutRow]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#111111" />
            <Text style={[styles.rowText, { color: "#111111" }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8F8F8",
      padding: 20,
    },
  
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  
    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 20,
      color: "#111111",
    },
  
    card: {
      alignItems: "center",
      backgroundColor: "#ffffff",
      padding: 20,
      borderRadius: 20,
    },
  
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#FFC300",
      justifyContent: "center",
      alignItems: "center",
    },
  
    avatarText: {
      color: "#111111",
      fontSize: 28,
      fontWeight: "bold",
    },
  
    name: {
      marginTop: 10,
      fontSize: 18,
      fontWeight: "bold",
      color: "#111111",
    },
  
    role: {
      color: "#666666",
      marginTop: 4,
    },
  
    statsRow: {
      flexDirection: "row",
      marginTop: 20,
    },
  
    statBox: {
      flex: 1,
      backgroundColor: "#ffffff",
      padding: 20,
      borderRadius: 16,
      alignItems: "center",
    },
  
    statNumber: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#111111",
    },
  
    statLabel: {
      marginTop: 5,
      color: "#666666",
    },
  
    section: {
      marginTop: 30,
      backgroundColor: "#ffffff",
      borderRadius: 16,
      paddingVertical: 10,
    },
  
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 15,
      padding: 15,
    },
  
    logoutRow: {
      marginTop: 10,
    },
  
    rowText: {
      fontSize: 16,
      color: "#111111",
    },
  });