import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useCallback } from "react";

import { getMyBookings, cancelBooking } from "../../../src/api/bookings";
import {
  getPaymentByBooking,
  confirmPayment,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  type Payment,
} from "../../../src/api/payments";
import type { Booking } from "../../../src/types";

function getStatusMeta(status: string) {
  switch (status) {
    case "PENDING":
      return { label: "Pending", bg: "#FEF3C7", text: "#B45309" };
    case "ACCEPTED":
      return { label: "Accepted", bg: "#DBEAFE", text: "#1D4ED8" };
    case "IN_PROGRESS":
      return { label: "In Progress", bg: "#EDE9FE", text: "#6D28D9" };
    case "COMPLETED":
      return { label: "Completed", bg: "#DCFCE7", text: "#15803D" };
    case "CANCELED":
      return { label: "Canceled", bg: "#FEE2E2", text: "#B91C1C" };
    default:
      return { label: status, bg: "#E5E7EB", text: "#374151" };
  }
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
  });

  const booking = data?.find((item) => item.id === Number(id));

  const {
    data: payment,
    isLoading: paymentLoading,
    refetch: refetchPayment,
  } = useQuery<Payment>({
    queryKey: ["payment-by-booking", id],
    queryFn: () => getPaymentByBooking(Number(id)),
    enabled: !!booking,
    retry: false,
  });

  useFocusEffect(
    useCallback(() => {
      if (booking?.status === "COMPLETED") {
        refetchPayment();
      }
    }, [booking?.status, refetchPayment])
  );

  const confirmCashMutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: async () => {
      await refetchPayment();
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      Alert.alert("Success", "Cash payment confirmed successfully.");
    },
    onError: (err: any) => {
      Alert.alert(
        "Payment Failed",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  const verifyKhaltiMutation = useMutation({
    mutationFn: verifyKhaltiPayment,
    onSuccess: async () => {
      await refetchPayment();
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      Alert.alert("Success", "Khalti payment verified successfully.");
    },
    onError: (err: any) => {
      Alert.alert(
        "Verification Failed",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  const khaltiMutation = useMutation({
    mutationFn: initiateKhaltiPayment,
    onSuccess: async (res) => {
      try {
        await Linking.openURL(res.payment_url);
      } catch {
        Alert.alert("Error", "Could not open Khalti payment page.");
      }
    },
    onError: (err: any) => {
      Alert.alert(
        "Khalti Error",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      Alert.alert("Success", "Booking canceled successfully.", [
        {
          text: "OK",
          onPress: () => router.replace("/(client)/bookings"),
        },
      ]);
    },
    onError: (err: any) => {
      Alert.alert(
        "Cancel Failed",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Booking not found</Text>
      </View>
    );
  }

  const statusMeta = getStatusMeta(booking.status);
  const canCancel = ["PENDING", "CLAIMED", "ACCEPTED", "NEGOTIATING"].includes(
    booking.status
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="construct-outline" size={24} color="#111111" />
            </View>

            <View
              style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}
            >
              <Text
                style={[styles.statusBadgeText, { color: statusMeta.text }]}
              >
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {booking.package_name || booking.service_name || "Booking"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{booking.address}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="document-text-outline"
              size={18}
              color="#6B7280"
            />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{booking.notes || "No notes"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Scheduled</Text>
              <Text style={styles.infoValue}>
                {booking.scheduled_at
                  ? new Date(booking.scheduled_at).toLocaleString()
                  : "Not scheduled yet"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={18} color="#6B7280" />
            <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>
              {booking.package_name ? "Package Price" : "Base Price"}
            </Text>
            <Text style={styles.infoValue}>
              Rs. {booking.service_price}
              {booking.service_pricing_unit ? ` / ${booking.service_pricing_unit}` : ""}
            </Text>
            </View>
          </View>
        </View>
\
        {canCancel && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Booking Action</Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                Alert.alert(
                  "Cancel Booking",
                  "Are you sure you want to cancel this booking?",
                  [
                    { text: "No", style: "cancel" },
                    {
                      text: "Yes, Cancel",
                      style: "destructive",
                      onPress: () => cancelBookingMutation.mutate(booking.id),
                    },
                  ]
                )
              }
              disabled={cancelBookingMutation.isPending}
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.cancelButtonText}>
                {cancelBookingMutation.isPending
                  ? "Canceling..."
                  : "Cancel Booking"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>

          {paymentLoading ? (
            <ActivityIndicator size="small" color="#F4B400" />
          ) : payment ? (
            <>
              <View style={styles.paymentBox}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Total</Text>
                  <Text style={styles.paymentValue}>Rs. {payment.amount}</Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Admin (20%)</Text>
                  <Text style={styles.paymentValue}>
                    Rs. {payment.commission_amount}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Worker Gets</Text>
                  <Text style={styles.paymentStrong}>
                    Rs. {payment.worker_earning}
                  </Text>
                </View>

                <View style={[styles.paymentRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.paymentLabel}>Status</Text>
                  <Text style={styles.paymentStrong}>{payment.status}</Text>
                </View>
              </View>

              {payment.status === "PENDING" && (
                <>
                  <TouchableOpacity
                    style={styles.cashButton}
                    onPress={() =>
                      Alert.alert(
                        "Cash Payment",
                        "Confirm that you paid the worker directly in cash?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Confirm",
                            onPress: () => confirmCashMutation.mutate(payment.id),
                          },
                        ]
                      )
                    }
                    disabled={confirmCashMutation.isPending}
                  >
                    <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.cashButtonText}>
                      {confirmCashMutation.isPending
                        ? "Confirming..."
                        : "Pay Cash In Hand"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.khaltiButton}
                    onPress={() => khaltiMutation.mutate(payment.id)}
                    disabled={khaltiMutation.isPending}
                  >
                    <Ionicons name="wallet-outline" size={18} color="#111111" />
                    <Text style={styles.khaltiButtonText}>
                      {khaltiMutation.isPending
                        ? "Opening Khalti..."
                        : "Pay with Khalti"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => verifyKhaltiMutation.mutate(payment.id)}
                    disabled={verifyKhaltiMutation.isPending}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#111111"
                    />
                    <Text style={styles.verifyButtonText}>
                      {verifyKhaltiMutation.isPending
                        ? "Verifying..."
                        : "I completed Khalti payment"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <View style={styles.noticeCard}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#B45309"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeText}>
                  No payment found for this booking yet.
                </Text>
                <TouchableOpacity onPress={() => refetchPayment()}>
                  <Text style={styles.noticeLink}>Tap to refresh</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {booking.status === "COMPLETED" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Review & Rating</Text>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => router.push(`/(client)/review/${booking.id}`)}
            >
              <Ionicons name="star-outline" size={18} color="#111111" />
              <Text style={styles.reviewButtonText}>Leave Review</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 15,
  },
  heroCard: {
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F4B400",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#D1D5DB",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 14,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: "#111111",
    fontWeight: "500",
    lineHeight: 21,
  },
  paymentBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginTop: 6,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  paymentLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  paymentValue: {
    fontSize: 14,
    color: "#111111",
    fontWeight: "600",
  },
  paymentStrong: {
    fontSize: 15,
    color: "#111111",
    fontWeight: "bold",
  },
  cashButton: {
    marginTop: 16,
    backgroundColor: "#111111",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cashButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  khaltiButton: {
    marginTop: 12,
    backgroundColor: "#F4B400",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  khaltiButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 15,
  },
  verifyButton: {
    marginTop: 12,
    backgroundColor: "#E5E7EB",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  verifyButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 15,
  },
  noticeCard: {
    marginTop: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  noticeText: {
    flex: 1,
    color: "#92400E",
    fontSize: 14,
    lineHeight: 20,
  },
  noticeLink: {
    marginTop: 6,
    color: "#B45309",
    fontWeight: "700",
  },
  cancelButton: {
    marginTop: 8,
    backgroundColor: "#DC2626",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  reviewButton: {
    marginTop: 8,
    backgroundColor: "#FFC300",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  reviewButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 15,
  },
});