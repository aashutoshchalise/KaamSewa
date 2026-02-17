import { Redirect } from "expo-router";

export default function WorkerIndex() {
  return <Redirect href="/(worker)/my-jobs" />;
}