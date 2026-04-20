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
    case "NEGOTIATING":
      return { label: "Negotiating", bg: "#FCE7F3", text: "#BE185D" };
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
  const bookingId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
  });

  const booking = data?.find((item) => item.id === bookingId);

  const {
    data: payment,
    isLoading: paymentLoading,
    isError: paymentError,
    refetch: refetchPayment,
  } = useQuery({
    queryKey: ["payment-by-booking", bookingId],
    queryFn: () => getPaymentByBooking(bookingId),
  
    enabled: !!bookingId,
  
    staleTime: 0,
    gcTime: 0,
  
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  }) as {
    data: Payment | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => any;
  };

  const confirmCashMutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: async () => {
      await refetchPayment();
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      Alert.alert("Success", "Cash payment confirmed successfully.");
    },
    onError: (err: any) => {
      Alert.alert(
        "Payment Failed",
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

  const autoVerifyKhaltiMutation = useMutation({
    mutationFn: verifyKhaltiPayment,
  
    onSuccess: async () => {
      console.log("AUTO VERIFY SUCCESS");
  
      await refetchPayment();
  
      await queryClient.invalidateQueries({
        queryKey: ["payment-by-booking", bookingId],
      });
  
      await queryClient.invalidateQueries({
        queryKey: ["my-bookings"],
      });
    },
  
    onError: (err: any) => {
      console.log(
        "AUTO VERIFY ERROR:",
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

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const syncPayment = async () => {
        if (!bookingId) return;

        const result = await refetchPayment();
        const latestPayment = result.data;

        if (
          active &&
          latestPayment &&
          latestPayment.status === "PENDING" &&
          latestPayment.method === "KHALTI" &&
          latestPayment.khalti_pidx &&
          !autoVerifyKhaltiMutation.isPending
        ) {
          autoVerifyKhaltiMutation.mutate(latestPayment.id);
        }
      };

      syncPayment();

      return () => {
        active = false;
      };
    }, [bookingId, refetchPayment, autoVerifyKhaltiMutation.isPending])
  );

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
  const hasReview = !!booking.review_id;
  const bookingTitle = booking.package_name || booking.service_name || "Booking";

  const hasNegotiationData =
    booking.negotiation_id != null ||
    booking.negotiated_price != null ||
    booking.negotiation_status != null ||
    booking.negotiation_message != null;

  const showNegotiationCard = hasNegotiationData;

  const isNegotiated =
    booking.final_price != null &&
    booking.service_price != null &&
    String(booking.final_price) !== String(booking.service_price);

  const showPaymentActions = payment?.status === "PENDING";
  const hasPayment = !!payment;

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

          <Text style={styles.heroTitle}>{bookingTitle}</Text>
          <Text style={styles.heroSubtitle}>Booking Details</Text>
        </View>

        {showNegotiationCard && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Negotiation</Text>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() =>
                router.push({
                  pathname: "/(common)/booking-chat",
                  params: { bookingId: String(booking.id) },
                })
              }
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color="#111111"
              />
              <Text style={styles.chatButtonText}>Open Negotiation Chat</Text>
            </TouchableOpacity>
          </View>
        )}

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
              <Text style={styles.infoLabel}>Base Price</Text>
              <Text style={styles.infoValue}>
                Rs. {booking.service_price}
                {booking.service_pricing_unit
                  ? ` / ${booking.service_pricing_unit}`
                  : ""}
              </Text>
            </View>
          </View>

          {isNegotiated && (
            <View style={styles.infoRow}>
              <Ionicons
                name="swap-horizontal-outline"
                size={18}
                color="#BE185D"
              />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Negotiated Price</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: "#BE185D", fontWeight: "700" },
                  ]}
                >
                  Rs. {booking.final_price}
                </Text>
              </View>
            </View>
          )}
        </View>

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

  {paymentLoading || autoVerifyKhaltiMutation.isPending ? (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="small" color="#F4B400" />
      <Text style={styles.loadingText}>Loading payment...</Text>
    </View>
  ) : hasPayment ? (
    <>
      <View style={styles.paymentBox}>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Total</Text>
          <Text style={styles.paymentValue}>Rs. {payment!.amount}</Text>
        </View>

        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Method</Text>
          <Text style={styles.paymentValue}>
            {payment!.method || "Not selected"}
          </Text>
        </View>

        <View style={[styles.paymentRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.paymentLabel}>Status</Text>
          <Text style={styles.paymentStrong}>{payment!.status}</Text>
        </View>
      </View>

      {payment!.status === "PENDING" && (
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
                    onPress: () => confirmCashMutation.mutate(payment!.id),
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
            onPress={() => khaltiMutation.mutate(payment!.id)}
            disabled={khaltiMutation.isPending}
          >
            <Ionicons name="wallet-outline" size={18} color="#111111" />
            <Text style={styles.khaltiButtonText}>
              {khaltiMutation.isPending
                ? "Opening Khalti..."
                : "Pay with Khalti"}
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
          {paymentError
            ? "Could not load payment right now."
            : "No payment found for this booking yet."}
        </Text>
        <TouchableOpacity onPress={() => refetchPayment()}>
          <Text style={styles.noticeLink}>Tap to refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</View>

        {booking.status === "COMPLETED" && !hasReview && (
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

        {hasReview && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Review</Text>
            <View style={styles.reviewSummaryCard}>
              <View style={styles.reviewStarsRow}>
                <Ionicons name="star" size={18} color="#F4B400" />
                <Text style={styles.reviewRatingText}>
                  {booking.review_rating}/5
                </Text>
              </View>

              <Text style={styles.reviewMetaText}>
                {booking.review_created_at
                  ? `Submitted on ${new Date(
                      booking.review_created_at
                    ).toLocaleString()}`
                  : "Review submitted"}
              </Text>

              <Text style={styles.reviewCommentText}>
                {booking.review_comment || "No written comment provided."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingTop: 12, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  emptyText: { color: "#6B7280", fontSize: 15 },
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
  statusBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  heroTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  heroSubtitle: { marginTop: 6, fontSize: 14, color: "#D1D5DB" },
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
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  infoValue: {
    fontSize: 15,
    color: "#111111",
    fontWeight: "500",
    lineHeight: 21,
  },
  chatButton: {
    marginTop: 8,
    backgroundColor: "#FFC300",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  chatButtonText: { color: "#111111", fontWeight: "bold", fontSize: 15 },
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
  paymentLabel: { fontSize: 14, color: "#6B7280" },
  paymentValue: { fontSize: 14, color: "#111111", fontWeight: "600" },
  paymentStrong: { fontSize: 15, color: "#111111", fontWeight: "bold" },
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
  cashButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
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
  khaltiButtonText: { color: "#111111", fontWeight: "bold", fontSize: 15 },
  noticeCard: {
    marginTop: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  noticeText: { flex: 1, color: "#92400E", fontSize: 14, lineHeight: 20 },
  noticeLink: { marginTop: 6, color: "#B45309", fontWeight: "700" },
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
  cancelButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
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
  reviewButtonText: { color: "#111111", fontWeight: "bold", fontSize: 15 },
  reviewSummaryCard: {
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
  },
  reviewStarsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewRatingText: { fontSize: 16, fontWeight: "700", color: "#111111" },
  reviewMetaText: { marginTop: 8, fontSize: 12, color: "#6B7280" },
  reviewCommentText: {
    marginTop: 10,
    fontSize: 14,
    color: "#111111",
    lineHeight: 20,
  },

  loadingWrap: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 14,
  },

});