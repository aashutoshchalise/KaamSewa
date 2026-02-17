import React from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { getService } from "~/api/services";
import type { Service } from "~/types";

export default function ServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, error } = useQuery<Service>({
    queryKey: ["service", id],
    queryFn: () => getService(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Failed to load service.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700" }}>
          {data.name}
        </Text>

        <Text style={{ marginTop: 8, fontSize: 16, opacity: 0.7 }}>
        Rs {data.base_price} • {data.pricing_unit}
        </Text>

        {data.description ? (
          <Text style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>
            {data.description}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(client)/booking",
            params: { id: data.id },
          })
        }
        style={{
          marginTop: 30,
          backgroundColor: "#000",
          padding: 16,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            color: "#fff",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          Book This Service
        </Text>
      </Pressable>
    </View>
  );
}