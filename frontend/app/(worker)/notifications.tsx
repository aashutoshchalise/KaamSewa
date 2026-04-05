import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
  } from "react-native";
  import { Ionicons } from "@expo/vector-icons";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import {
    getMyNotifications,
    markNotificationRead,
    NotificationItem,
  } from "../../src/api/notifications";
  
  export default function WorkerNotificationsScreen() {
    const queryClient = useQueryClient();
  
    const { data, isLoading } = useQuery<NotificationItem[]>({
      queryKey: ["worker-notifications"],
      queryFn: getMyNotifications,
    });
  
    const markReadMutation = useMutation({
      mutationFn: markNotificationRead,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["worker-notifications"] });
      },
    });
  
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F4B400" />
        </View>
      );
    }
  
    const notifications = data ?? [];
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Notifications</Text>
  
        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              Job and payment updates will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, !item.is_read && styles.unreadCard]}
                onPress={() => {
                  if (!item.is_read) {
                    markReadMutation.mutate(item.id);
                  }
                }}
              >
                <View style={styles.row}>
                  <Ionicons
                    name={item.is_read ? "mail-open-outline" : "mail-unread-outline"}
                    size={20}
                    color="#111111"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardText}>{item.message}</Text>
                    <Text style={styles.cardDate}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
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
      paddingTop: 55,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F8FAFC",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#111111",
      marginBottom: 18,
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
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
    },
    unreadCard: {
      borderWidth: 1,
      borderColor: "#F4B400",
    },
    row: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: "#111111",
    },
    cardText: {
      marginTop: 4,
      fontSize: 14,
      color: "#4B5563",
      lineHeight: 20,
    },
    cardDate: {
      marginTop: 8,
      fontSize: 12,
      color: "#9CA3AF",
    },
  });