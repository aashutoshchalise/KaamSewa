import React from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptJob, getAvailableJobs } from "../../src/api/bookings";
import type { Booking } from "../../src/types";


export default function JobsScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery<Booking[]>({
    queryKey: ["availableJobs"],
    queryFn: getAvailableJobs,
  });

  const accept = useMutation({
    mutationFn: (id: number) => acceptJob(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["availableJobs"] });
      await qc.invalidateQueries({ queryKey: ["myBookings"] });
      Alert.alert("Accepted", "Job accepted successfully.");
    },
    onError: () => Alert.alert("Error", "Could not accept job."),
  });

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
        Available Jobs
      </Text>

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

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text>No available jobs.</Text>}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{item.service_name}</Text>
            <Text>Address: {item.address}</Text>
            <Text>Status: {item.status}</Text>

            <Pressable
              onPress={() => accept.mutate(item.id)}
              disabled={accept.isPending}
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
              }}
            >
              <Text style={{ textAlign: "center" }}>
                {accept.isPending ? "Accepting..." : "Accept"}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}