import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyBookings,
  updateBookingStatus,
} from "../../src/api/bookings";
import { useAuth } from "../../src/store/AuthContext";
import type { Booking } from "../../src/types";

export default function MyJobsScreen() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const {
    data,
    isLoading,
    refetch,
    isFetching,
    error,
  } = useQuery<Booking[]>({
    queryKey: ["workerJobs"],
    queryFn: getMyBookings,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: Booking["status"];
    }) => updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workerJobs"] });
      Alert.alert("Success", "Status updated");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update status");
    },
  });

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  const activeJobs =
    data?.filter(
      (b) => b.status === "ACCEPTED" || b.status === "IN_PROGRESS"
    ) ?? [];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      
      {/* Header */}
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        My Active Jobs
      </Text>

      {/* Logout */}
      <Pressable
        onPress={async () => {
          await logout();
        }}
        style={{
          backgroundColor: "#ef4444",
          padding: 10,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
          Logout
        </Text>
      </Pressable>

      {/* Refresh */}
      <Pressable
        onPress={() => refetch()}
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          marginBottom: 12,
        }}
      >
        <Text style={{ textAlign: "center" }}>
          {isFetching ? "Refreshing..." : "Refresh"}
        </Text>
      </Pressable>

      {error && (
        <Text style={{ color: "red", marginBottom: 10 }}>
          Failed to load jobs.
        </Text>
      )}

      <FlatList
        data={activeJobs}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text>No active jobs.</Text>}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16 }}>
              {item.service_name}
            </Text>

            <Text>Status: {item.status}</Text>
            <Text>Address: {item.address}</Text>

            {!!item.notes && <Text>Notes: {item.notes}</Text>}

            {/* ACCEPTED → IN_PROGRESS */}
            {item.status === "ACCEPTED" && (
              <Pressable
                onPress={() =>
                  statusMutation.mutate({
                    id: item.id,
                    status: "IN_PROGRESS",
                  })
                }
                style={{
                  marginTop: 10,
                  backgroundColor: "#000",
                  padding: 10,
                  borderRadius: 8,
                  opacity: statusMutation.isPending ? 0.6 : 1,
                }}
                disabled={statusMutation.isPending}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  Start Job
                </Text>
              </Pressable>
            )}

            {/* IN_PROGRESS → COMPLETED */}
            {item.status === "IN_PROGRESS" && (
              <Pressable
                onPress={() =>
                  statusMutation.mutate({
                    id: item.id,
                    status: "COMPLETED",
                  })
                }
                style={{
                  marginTop: 10,
                  backgroundColor: "#16a34a",
                  padding: 10,
                  borderRadius: 8,
                  opacity: statusMutation.isPending ? 0.6 : 1,
                }}
                disabled={statusMutation.isPending}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  Mark Completed
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}