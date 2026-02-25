import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../src/store/AuthContext";

export default function AuthLayout() {
  const { user, role, booting } = useAuth();

  if (booting) return null;

  if (user) {
    if (role === "CLIENT") return <Redirect href="/home" />;
    if (role === "WORKER") return <Redirect href="/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}