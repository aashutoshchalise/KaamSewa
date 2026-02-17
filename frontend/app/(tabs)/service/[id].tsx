import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";

export default function ServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>
        Service Detail
      </Text>

      <Text style={{ marginTop: 10 }}>
        Service ID: {id}
      </Text>
    </View>
  );
}