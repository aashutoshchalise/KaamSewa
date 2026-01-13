import React from "react";
import { ActivityIndicator, Pressable, Text, ViewStyle } from "react-native";
import { colors } from "../theme/colors";

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        {
          backgroundColor: isDisabled ? "#FDBA74" : colors.primary,
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}