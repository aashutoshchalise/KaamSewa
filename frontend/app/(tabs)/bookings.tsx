import React from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getMyBookings } from "../../src/api/bookings";
import type { Booking } from "../../src/types";

export default function BookingsScreen() {
  const { data, isLoading, refetch, isFetching, error } = useQuery<Booking[]>({
    queryKey: ["myBookings"],
    queryFn: getMyBookings,
  });

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
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
        <Text style={{ textAlign: "center" }}>
          {isFetching ? "Refreshing..." : "Refresh"}
        </Text>
      </Pressable>

      {error ? (
        <Text style={{ color: "red", marginBottom: 10 }}>
          Failed to load bookings. (Are you logged in?)
        </Text>
      ) : null}

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text>No bookings yet.</Text>}
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
            <Text>Status: {item.status}</Text>
            <Text>Address: {item.address}</Text>
            {!!item.notes && <Text>Notes: {item.notes}</Text>}
          </View>
        )}
      />
    </View>
  );
}