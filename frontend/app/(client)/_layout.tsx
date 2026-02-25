import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../src/store/AuthContext";

export default function ClientLayout() {
  const { user, role, booting } = useAuth();

  if (booting) return null;

  if (!user || role !== "CLIENT") {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}