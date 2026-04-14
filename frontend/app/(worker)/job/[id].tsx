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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBookingDetail,
  claimJob,
  startJob,
  completeJob,
} from "../../../src/api/bookings";
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

export default function WorkerJobDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const numericId = Number(id);

  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ["booking-detail", numericId],
    queryFn: () => getBookingDetail(numericId),
    enabled: !!numericId,
  });

  const claimMutation = useMutation({
    mutationFn: claimJob,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["available-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["booking-detail", numericId] }),
      ]);
      Alert.alert("Success", "Job claimed successfully.");
    },
    onError: (err: any) => {
      Alert.alert("Claim Failed", JSON.stringify(err?.response?.data || err?.message));
    },
  });

  const startMutation = useMutation({
    mutationFn: startJob,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["available-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["booking-detail", numericId] }),
      ]);
      Alert.alert("Success", "Job started successfully.");
    },
    onError: (err: any) => {
      Alert.alert("Start Failed", JSON.stringify(err?.response?.data || err?.message));
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeJob,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["available-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["booking-detail", numericId] }),
      ]);
      Alert.alert("Success", "Job completed successfully.");
    },
    onError: (err: any) => {
      Alert.alert("Complete Failed", JSON.stringify(err?.response?.data || err?.message));
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

  const isNegotiated =
    !!booking.final_price &&
    !!booking.service_price &&
    String(booking.final_price) !== String(booking.service_price);

  const canClaim =
    booking.worker == null &&
    ["PENDING", "NEGOTIATING"].includes(booking.status);

  const canNegotiate =
    ["PENDING", "NEGOTIATING", "ACCEPTED"].includes(booking.status);

  const canStart = booking.worker != null && booking.status === "ACCEPTED";
  const canComplete = booking.worker != null && booking.status === "IN_PROGRESS";

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
              <Ionicons name="briefcase-outline" size={24} color="#111111" />
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusMeta.text }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {booking.package_name || booking.service_name || "Booking"}
          </Text>
          <Text style={styles.heroSubtitle}>Job Details & Negotiation</Text>

          <View style={styles.heroPriceBox}>
            <Text style={styles.heroPriceLabel}>Base Price</Text>
            <Text style={styles.heroPrice}>
              Rs {booking.service_price}
              {booking.service_pricing_unit ? ` / ${booking.service_pricing_unit}` : ""}
            </Text>

            {isNegotiated && (
              <>
                <Text style={styles.heroNegotiatedLabel}>Current Negotiated Price</Text>
                <Text style={styles.heroNegotiatedPrice}>Rs {booking.final_price}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Job Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#6B7280" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{booking.address}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={18} color="#6B7280" />
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
            <Ionicons name="person-outline" size={18} color="#6B7280" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Client</Text>
              <Text style={styles.infoValue}>{booking.client_username || "Client"}</Text>
            </View>
          </View>

          {booking.client_phone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#6B7280" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Client Phone</Text>
                <Text style={styles.infoValue}>{booking.client_phone}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {canNegotiate && (
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
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#111111" />
              <Text style={styles.chatButtonText}>Open Negotiation Chat</Text>
            </TouchableOpacity>
          </View>
        )}

        {canClaim && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Job Action</Text>
            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => claimMutation.mutate(booking.id)}
              disabled={claimMutation.isPending}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {claimMutation.isPending ? "Claiming..." : "Claim Job"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {canStart && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Job Action</Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => startMutation.mutate(booking.id)}
              disabled={startMutation.isPending}
            >
              <Ionicons name="play-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {startMutation.isPending ? "Starting..." : "Start Job"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {canComplete && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Job Action</Text>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => completeMutation.mutate(booking.id)}
              disabled={completeMutation.isPending}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {completeMutation.isPending ? "Completing..." : "Complete Job"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {booking.review_id && (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>Client Review</Text>

    <View style={styles.reviewCard}>
      <View style={styles.reviewTopRow}>
        <View style={styles.reviewBadge}>
          <Ionicons name="star" size={16} color="#F4B400" />
          <Text style={styles.reviewRatingText}>{booking.review_rating}/5</Text>
        </View>

        <Text style={styles.reviewByText}>
          by {booking.review_client_username || "Client"}
        </Text>
      </View>

      <Text style={styles.reviewCommentText}>
        {booking.review_comment || "No written comment provided."}
      </Text>

      {booking.review_created_at ? (
        <Text style={styles.reviewDateText}>
          {new Date(booking.review_created_at).toLocaleString()}
        </Text>
      ) : null}
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
  content: { padding: 20, paddingBottom: 40 },
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
  heroPriceBox: {
    marginTop: 18,
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 16,
  },
  heroPriceLabel: {
    color: "#CBD5E1",
    fontSize: 13,
  },
  heroPrice: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  heroNegotiatedLabel: {
    marginTop: 14,
    color: "#FBCFE8",
    fontSize: 13,
  },
  heroNegotiatedPrice: {
    marginTop: 4,
    color: "#F9A8D4",
    fontSize: 18,
    fontWeight: "700",
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
  chatButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 15,
  },
  claimButton: {
    marginTop: 8,
    backgroundColor: "#111111",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  startButton: {
    marginTop: 8,
    backgroundColor: "#2563EB",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  completeButton: {
    marginTop: 8,
    backgroundColor: "#16A34A",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  reviewCard: {
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
  },
  reviewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewRatingText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  reviewByText: {
    fontSize: 12,
    color: "#6B7280",
  },
  reviewCommentText: {
    marginTop: 10,
    fontSize: 14,
    color: "#111111",
    lineHeight: 20,
  },
  reviewDateText: {
    marginTop: 10,
    fontSize: 12,
    color: "#6B7280",
  },
});