import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../src/store/AuthContext";

export default function AdminLayout() {
  const { role, booting } = useAuth();

  if (booting) return null;

  if (role !== "ADMIN") {
    return <Redirect href="/" />;
  }

  return <Slot />;
}