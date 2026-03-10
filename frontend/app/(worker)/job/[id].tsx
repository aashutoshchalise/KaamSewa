import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Alert,
  } from "react-native";
  import { useLocalSearchParams } from "expo-router";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import {
    getMyBookings,
    startJob,
    completeJob,
  } from "../../../src/api/bookings";
  import type { Booking } from "../../../src/types";
  import { getStatusMeta } from "../../../src/utils/status";
  
  export default function WorkerJobDetail() {
    const { id } = useLocalSearchParams();
    const queryClient = useQueryClient();
  
    const { data, isLoading } = useQuery<Booking[]>({
      queryKey: ["worker-my-jobs"],
      queryFn: getMyBookings,
    });
  
    const startMutation = useMutation({
      mutationFn: startJob,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["worker-my-jobs"] });
        Alert.alert("Job started");
      },
    });
  
    const completeMutation = useMutation({
      mutationFn: completeJob,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["worker-my-jobs"] });
        Alert.alert("Job completed");
      },
    });
  
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFC300" />
        </View>
      );
    }
  
    const job = data?.find((b) => b.id === Number(id));
  
    if (!job) {
      return (
        <View style={styles.center}>
          <Text style={{ color: "#666" }}>Job not found</Text>
        </View>
      );
    }
  
    const statusMeta = getStatusMeta(job.status);
  
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Job Details</Text>
  
        <View style={styles.card}>
          <Text style={styles.label}>Service</Text>
          <Text style={styles.value}>{job.service_name}</Text>
  
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>
            Rs {job.service_price} / {job.service_pricing_unit}
          </Text>
  
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{job.address}</Text>
  
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>
            {job.notes ? job.notes : "No instructions"}
          </Text>
  
          <Text style={styles.label}>Scheduled Time</Text>
          <Text style={styles.value}>
            {job.scheduled_at
              ? new Date(job.scheduled_at).toLocaleString()
              : "Not scheduled"}
          </Text>
  
          <Text style={styles.label}>Status</Text>
  
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
  
        {/* ACTION BUTTONS */}
  
        {(job.status === "CLAIMED" || job.status === "ACCEPTED") && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => startMutation.mutate(job.id)}
          >
            <Text style={styles.buttonText}>Start Job</Text>
          </TouchableOpacity>
        )}
  
        {job.status === "IN_PROGRESS" && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => completeMutation.mutate(job.id)}
          >
            <Text style={styles.buttonText}>Complete Job</Text>
          </TouchableOpacity>
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
  
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  
    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 20,
      color: "#111",
    },
  
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 18,
    },
  
    label: {
      marginTop: 12,
      color: "#777",
      fontSize: 13,
    },
  
    value: {
      fontSize: 16,
      fontWeight: "500",
      color: "#111",
    },
  
    statusBadge: {
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      alignSelf: "flex-start",
    },
  
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
  
    button: {
      marginTop: 25,
      backgroundColor: "#FFC300",
      height: 55,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
  
    buttonText: {
      fontWeight: "bold",
      fontSize: 16,
      color: "#111",
    },
  });