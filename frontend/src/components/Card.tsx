import React from "react";
import { View, ViewStyle } from "react-native";
import { colors } from "../theme/colors";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}