import { Redirect } from "expo-router";
import { useAuth } from "../src/store/AuthContext";

export default function Index() {
  const { user, role, booting } = useAuth();

  if (booting) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === "CLIENT") {
    return <Redirect href="/(client)/home" />;
  }

  if (role === "WORKER") {
    return <Redirect href="/(worker)/dashboard" />;
  }

  if (role === "ADMIN") {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}