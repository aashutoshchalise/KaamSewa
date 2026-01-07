import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/store/AuthContext";

export default function Index() {
  const { booting, role } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Not logged in
  if (!role) return <Redirect href="/(auth)/login" />;

  // Role-based redirect
  if (role === "CLIENT") return <Redirect href="/(client)" />;
  if (role === "WORKER") return <Redirect href="/(worker)" />;
  return <Redirect href="/(admin)" />;
}