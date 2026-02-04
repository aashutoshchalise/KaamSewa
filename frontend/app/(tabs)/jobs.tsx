import React from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { availableBookings, acceptBooking } from "../../src/api/bookings";
import type { Booking } from "../../src/types";

export default function JobsScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery<Booking[]>({
    queryKey: ["availableBookings"],
    queryFn: availableBookings,
  });

  const acceptMut = useMutation({
    mutationFn: (id: number) => acceptBooking(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["availableBookings"] }),
        qc.invalidateQueries({ queryKey: ["myBookings"] }),
      ]);
      Alert.alert("Accepted", "You accepted the job.");
    },
    onError: (e: any) => {
      Alert.alert("Accept failed", e?.response?.data?.detail || "Try again");
    },
  });

  if (isLoading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
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
        <Text style={{ textAlign: "center", fontWeight: "600" }}>
          {isFetching ? "Refreshing..." : "Refresh"}
        </Text>
      </Pressable>

      <FlatList
        data={data || []}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={{ opacity: 0.7 }}>No available jobs right now.</Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{item.service_name ?? `Service #${item.service}`}</Text>
            <Text>Address: {item.address}</Text>
            {!!item.notes && <Text>Notes: {item.notes}</Text>}
            <Text>Status: {item.status}</Text>

            <Pressable
              disabled={acceptMut.isPending}
              onPress={() => acceptMut.mutate(item.id)}
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
              }}
            >
              <Text style={{ textAlign: "center", fontWeight: "700" }}>
                {acceptMut.isPending ? "Accepting..." : "Accept Job"}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}