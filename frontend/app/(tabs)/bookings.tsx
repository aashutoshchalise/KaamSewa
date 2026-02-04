import React from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { myBookings } from "../../src/api/bookings";
import type { Booking } from "../../src/types";

export default function BookingsScreen() {
  const { data, isLoading, refetch, isFetching } = useQuery<Booking[]>({
    queryKey: ["myBookings"],
    queryFn: myBookings,
  });

  if (isLoading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
        My Bookings
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
          <Text style={{ opacity: 0.7 }}>No bookings yet.</Text>
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
            <Text>Status: {item.status}</Text>
            <Text>Address: {item.address}</Text>
            {!!item.notes && <Text>Notes: {item.notes}</Text>}
          </View>
        )}
      />
    </View>
  );
}