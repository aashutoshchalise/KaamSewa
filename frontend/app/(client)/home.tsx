import { View, Text, Button } from "react-native";
import { useAuth } from "../../src/store/AuthContext";
import { useRouter } from "expo-router";

export default function ClientHome() {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>CLIENT HOME</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}