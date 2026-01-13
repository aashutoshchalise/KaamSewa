import React from "react";
import { Text, View } from "react-native";
import { colors } from "../theme/colors";

function pick(status: string) {
  const s = status?.toLowerCase?.() ?? "";
  if (s.includes("complete")) return colors.completed;
  if (s.includes("cancel")) return colors.cancelled;
  if (s.includes("progress")) return colors.inProgress;
  if (s.includes("confirm")) return colors.confirmed;
  return colors.pending;
}

export function StatusBadge({ status }: { status: string }) {
  const c = pick(status);
  return (
    <View
      style={{
        backgroundColor: c + "22",
        borderColor: c + "55",
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: c, fontWeight: "700", fontSize: 12 }}>
        {status}
      </Text>
    </View>
  );
}