import React from "react";
import { SafeAreaView, View, ViewStyle } from "react-native";
import { colors } from "../theme/colors";

export default function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[{ flex: 1, padding: 16 }, style]}>{children}</View>
    </SafeAreaView>
  );
}