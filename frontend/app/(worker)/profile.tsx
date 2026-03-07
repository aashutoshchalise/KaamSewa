import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
  } from "react-native";
  import { useAuth } from "../../src/store/AuthContext";
  import { useRouter } from "expo-router";
  
  export default function WorkerProfile() {
    const { user, logout } = useAuth();
    const router = useRouter();
  
    async function handleLogout() {
      await logout();
      router.replace("/(auth)/login");
    }
  
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
  
          <Text style={styles.name}>{user?.username}</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </View>
  
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8F8F8",
      padding: 20,
      paddingTop: 60,
    },
  
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
    },
  
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
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
      marginTop: 14,
      fontSize: 18,
      fontWeight: "bold",
      color: "#111111",
    },
  
    role: {
      marginTop: 4,
      color: "#666666",
    },
  
    logoutButton: {
      marginTop: 30,
      height: 55,
      borderRadius: 18,
      backgroundColor: "#111111",
      justifyContent: "center",
      alignItems: "center",
    },
  
    logoutText: {
      color: "#FFC300",
      fontWeight: "bold",
      fontSize: 16,
    },
  });