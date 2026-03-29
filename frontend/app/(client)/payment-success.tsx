import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter, useRootNavigationState } from "expo-router";
import { useEffect } from "react";
import { verifyKhaltiPayment } from "../../src/api/payments";

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const params = useLocalSearchParams();

  const pidx = typeof params.pidx === "string" ? params.pidx : "";
  const paymentIdParam =
    typeof params.payment_id === "string" ? params.payment_id : "";
  const paymentId = Number(paymentIdParam);

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    const verify = async () => {
      if (!pidx || !paymentId) {
        if (!isMounted) return;
        Alert.alert("Payment Error", "Missing payment information.");
        setTimeout(() => {
          if (isMounted) router.replace("/(client)/bookings");
        }, 100);
        return;
      }

      try {
        await verifyKhaltiPayment(paymentId, pidx);

        if (!isMounted) return;
        Alert.alert("Payment Successful", "Your Khalti payment was verified.");

        setTimeout(() => {
          if (isMounted) router.replace("/(client)/bookings");
        }, 100);
      } catch (err: any) {
        if (!isMounted) return;

        Alert.alert(
          "Verification Failed",
          JSON.stringify(err?.response?.data || err?.message)
        );

        setTimeout(() => {
          if (isMounted) router.replace("/(client)/bookings");
        }, 100);
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [rootNavigationState?.key, pidx, paymentId]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F4B400" />
      <Text style={styles.title}>Verifying Payment...</Text>
      <Text style={styles.subtitle}>
        Please wait while we confirm your Khalti payment.
      </Text>
      {pidx ? <Text style={styles.meta}>PIDX: {pidx}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "bold",
    color: "#111111",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  meta: {
    marginTop: 20,
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
  },
});