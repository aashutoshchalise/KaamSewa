import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../src/store/AuthContext";

export default function ClientLayout() {
  const { role, booting } = useAuth();

  if (booting) return null;

  if (role !== "CLIENT") {
    return <Redirect href="/" />;
  }

  return <Slot />;
}