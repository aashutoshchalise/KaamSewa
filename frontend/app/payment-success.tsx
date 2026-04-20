import { useEffect } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function PaymentSuccess() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const pidx = Array.isArray(params.pidx) ? params.pidx[0] : params.pidx;
  const paymentId = Array.isArray(params.payment_id)
    ? params.payment_id[0]
    : params.payment_id;

  useEffect(() => {
    if (!paymentId) {
      Alert.alert("Payment Error", "Missing payment information.", [
        {
          text: "OK",
          onPress: () => router.replace("/(client)/bookings"),
        },
      ]);
      return;
    }

    verifyPayment();
  }, [paymentId]);

  const verifyPayment = async () => {
    try {
      const host =
        typeof window !== "undefined" && window.location?.hostname
          ? window.location.hostname
          : "192.168.1.84";

      const verifyUrl = `http://${host}:8001/api/payments/${paymentId}/khalti/verify/`;

      console.log("VERIFY URL:", verifyUrl);
      console.log("VERIFY PARAMS:", { paymentId, pidx });

      const res = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pidx }),
      });

      const data = await res.json();
      console.log("VERIFY RESPONSE:", data);

      if (!res.ok) {
        throw new Error(JSON.stringify(data));
      }

      Alert.alert("Payment Successful", "Your Khalti payment was verified.", [
        {
          text: "OK",
          onPress: () => router.replace("/(client)/bookings"),
        },
      ]);
    } catch (error: any) {
      console.log("VERIFY ERROR:", error);

      Alert.alert(
        "Verification Failed",
        error?.message || "Could not verify payment.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(client)/bookings"),
          },
        ]
      );
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 12, fontSize: 18 }}>Verifying payment...</Text>
    </View>
  );
}