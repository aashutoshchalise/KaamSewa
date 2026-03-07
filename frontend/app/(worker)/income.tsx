import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
  } from "react-native";
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
          <ActivityIndicator size="large" color="#FFC300" />
        </View>
      );
    }
  
    const completedJobs = data?.filter((job) => job.status === "COMPLETED") ?? [];
  
    const total = completedJobs.reduce(
      (sum, job) => sum + Number(job.service_price || 0),
      0
    );
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Income</Text>
  
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Estimated Total Income</Text>
          <Text style={styles.summaryAmount}>Rs. {total}</Text>
        </View>
  
        <Text style={styles.sectionTitle}>Completed Jobs</Text>
  
        {completedJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No completed jobs yet</Text>
          </View>
        ) : (
          <FlatList
            data={completedJobs}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.jobCard}>
                <Text style={styles.jobTitle}>{item.service_name}</Text>
                <Text style={styles.jobAmount}>Rs. {item.service_price}</Text>
              </View>
            )}
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
  
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#111111",
      marginBottom: 20,
    },
  
    summaryCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 18,
      marginBottom: 24,
    },
  
    summaryLabel: {
      color: "#666666",
    },
  
    summaryAmount: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#111111",
      marginTop: 8,
    },
  
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#111111",
      marginBottom: 12,
    },
  
    emptyCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 18,
    },
  
    emptyText: {
      color: "#666666",
    },
  
    jobCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },
  
    jobTitle: {
      fontWeight: "bold",
      color: "#111111",
    },
  
    jobAmount: {
      marginTop: 4,
      color: "#666666",
    },
  });