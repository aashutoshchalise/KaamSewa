import React from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { getServiceList } from "~/api/services";
import type { Service } from "~/types";

export default function ExploreScreen() {
  const { data, isLoading, isFetching, refetch, error } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: getServiceList,
  });

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Failed to load services</Text>
        <Text style={{ opacity: 0.7 }}>Check backend URL / network.</Text>
        <Pressable
          onPress={() => refetch()}
          style={{ backgroundColor: "#000", padding: 12, borderRadius: 10 }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Pressable
        onPress={() => refetch()}
        style={{
          backgroundColor: "#000",
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
          opacity: isFetching ? 0.6 : 1,
        }}
        disabled={isFetching}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
          {isFetching ? "Refreshing..." : "Refresh Services"}
        </Text>
      </Pressable>

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 14,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              marginBottom: 10,
              backgroundColor: "#fff",
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16 }}>{item.name}</Text>
            <Text style={{ marginTop: 4, opacity: 0.7 }}>
              Rs {item.base_price} • {item.pricing_unit}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, opacity: 0.6 }}>
            No services yet.
          </Text>
        }
      />
    </View>
  );
}