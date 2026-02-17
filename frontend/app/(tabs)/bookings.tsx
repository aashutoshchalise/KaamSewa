import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getMyBookings } from "../../src/api/bookings";
import type { Booking } from "../../src/types";

function StatusBadge({ status }: { status: string }) {
  let bg = "#E5E7EB";
  let color = "#111827";

  if (status === "PENDING") {
    bg = "#FEF3C7";
    color = "#92400E";
  } else if (status === "ACCEPTED") {
    bg = "#DBEAFE";
    color = "#1E40AF";
  } else if (status === "IN_PROGRESS") {
    bg = "#E0E7FF";
    color = "#3730A3";
  } else if (status === "COMPLETED") {
    bg = "#D1FAE5";
    color = "#065F46";
  } else if (status === "CANCELLED") {
    bg = "#FEE2E2";
    color = "#991B1B";
  }

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        alignSelf: "flex-start",
        marginTop: 6,
      }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>
        {status.replace("_", " ")}
      </Text>
    </View>
  );
}

export default function BookingsScreen() {
  const { data, isLoading, refetch, isFetching, error } = useQuery<Booking[]>({
    queryKey: ["myBookings"],
    queryFn: getMyBookings,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, opacity: 0.6 }}>
          Loading your bookings...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#F9FAFB" }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          marginBottom: 16,
        }}
      >
        My Bookings
      </Text>

      {error ? (
        <Text style={{ color: "red", marginBottom: 10 }}>
          Failed to load bookings.
        </Text>
      ) : null}

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={{ marginTop: 60, alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              No bookings yet
            </Text>
            <Text style={{ opacity: 0.6, marginTop: 6 }}>
              Book a service from Explore tab.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              padding: 16,
              borderRadius: 16,
              marginBottom: 14,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16 }}>
              {item.service_name}
            </Text>

            <StatusBadge status={item.status} />

            <Text style={{ marginTop: 8, opacity: 0.8 }}>
              📍 {item.address}
            </Text>

            {item.notes ? (
              <Text style={{ marginTop: 6, opacity: 0.7 }}>
                📝 {item.notes}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}