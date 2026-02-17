import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../src/store/AuthContext";

export default function WorkerLayout() {
  const { role, booting } = useAuth();

  if (booting) return null;

  if (role !== "WORKER") {
    return <Redirect href="/" />;
  }

  return <Slot />;
}