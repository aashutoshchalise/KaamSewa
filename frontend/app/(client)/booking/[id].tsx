import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyBookings,
  acceptNegotiation,
  createNegotiation,
  getBookingEvents,
  type BookingEvent,
} from "../../../src/api/bookings";
import {
  getPaymentByBooking,
  confirmPayment,
  type Payment,
} from "../../../src/api/payments";
import type { Booking } from "../../../src/types";
import { getStatusMeta } from "../../../src/utils/status";

function formatEventLabel(eventType: string) {
  return eventType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEventDescription(event: BookingEvent) {
  const metadata = event.metadata || {};

  if (metadata.final_price) return `Final price: Rs. ${metadata.final_price}`;
  if (metadata.proposed_price) return `Proposed price: Rs. ${metadata.proposed_price}`;
  if (metadata.message) return String(metadata.message);

  return event.actor_username ? `By ${event.actor_username}` : "System update";
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [counterPrice, setCounterPrice] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  const { data, isLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: getMyBookings,
  });

  const { data: events, isLoading: eventsLoading } = useQuery<BookingEvent[]>({
    queryKey: ["booking-events", id],
    queryFn: () => getBookingEvents(Number(id)),
  });

  const booking = data?.find((item) => item.id === Number(id));

  const { data: payment, isLoading: paymentLoading } = useQuery<Payment>({
    queryKey: ["payment-by-booking", id],
    queryFn: () => getPaymentByBooking(Number(id)),
    enabled: !!booking && booking.status === "COMPLETED",
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptNegotiation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking-events", id] });
      Alert.alert("Offer accepted successfully");
    },
    onError: (err: any) => {
      Alert.alert(
        "Could not accept offer",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  const counterMutation = useMutation({
    mutationFn: (payload: {
      bookingId: number;
      proposed_price: string;
      message: string;
    }) =>
      createNegotiation(payload.bookingId, {
        proposed_price: payload.proposed_price,
        message: payload.message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking-events", id] });
      setCounterPrice("");
      setCounterMessage("");
      Alert.alert("Counter offer sent successfully");
    },
    onError: (err: any) => {
      Alert.alert(
        "Could not send counter offer",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: confirmPayment,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["payment-by-booking", id] });
      Alert.alert("Payment confirmed", res.detail);
    },
    onError: (err: any) => {
      Alert.alert(
        "Could not confirm payment",
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
        <Text style={{ color: "#666666" }}>Booking not found</Text>
      </View>
    );
  }

  const currentBooking = booking;
  const statusMeta = getStatusMeta(currentBooking.status);

  const negotiationId = currentBooking.negotiation_id;
  const negotiatedPrice = currentBooking.negotiated_price;
  const negotiationMessage = currentBooking.negotiation_message;
  const negotiationProposedBy = currentBooking.negotiation_proposed_by;
  const negotiationProposedByUsername =
    currentBooking.negotiation_proposed_by_username;

  const hasNegotiation = !!negotiationId;

  const isWorkerOfferOpen =
    currentBooking.status === "NEGOTIATING" &&
    negotiationId &&
    negotiationProposedBy &&
    Number(negotiationProposedBy) !== Number(currentBooking.client);

  const isClientOfferPending =
    currentBooking.status === "NEGOTIATING" &&
    negotiationId &&
    negotiationProposedBy &&
    Number(negotiationProposedBy) === Number(currentBooking.client);

  const isBasePriceFlow =
    (currentBooking.status === "PENDING" ||
      currentBooking.status === "CLAIMED") &&
    !hasNegotiation;

  const displayedPrice = currentBooking.final_price || currentBooking.service_price;

  function handleAcceptOffer() {
    if (!negotiationId) {
      Alert.alert("Negotiation not found");
      return;
    }

    acceptMutation.mutate(Number(negotiationId));
  }

  function handleCounterOffer() {
    const priceToSend = counterPrice.trim();

    if (!priceToSend) {
      Alert.alert("Please enter your counter-offer price");
      return;
    }

    counterMutation.mutate({
      bookingId: currentBooking.id,
      proposed_price: priceToSend,
      message: counterMessage.trim(),
    });
  }

  function handleConfirmPayment() {
    if (!payment) {
      Alert.alert("Payment not found");
      return;
    }

    confirmPaymentMutation.mutate(payment.id);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="document-text-outline" size={24} color="#111111" />
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusMeta.bgColor },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: statusMeta.textColor },
              ]}
            >
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>{currentBooking.service_name}</Text>
        <Text style={styles.heroSubtitle}>Booking Details & Updates</Text>

        <View style={styles.pricePanel}>
          <Text style={styles.priceLabel}>
            {currentBooking.final_price ? "Final Agreed Price" : "Base Price"}
          </Text>
          <Text style={styles.priceValue}>
            Rs. {displayedPrice}
            <Text style={styles.priceUnit}> / {currentBooking.service_pricing_unit}</Text>
          </Text>
        </View>

        {currentBooking.final_price &&
        currentBooking.service_price !== currentBooking.final_price ? (
          <Text style={styles.originalPriceText}>
            Original base price: Rs. {currentBooking.service_price} /{" "}
            {currentBooking.service_pricing_unit}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Booking Information</Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{currentBooking.address}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Notes</Text>
            <Text style={styles.infoValue}>
              {currentBooking.notes?.trim()
                ? currentBooking.notes
                : "No notes provided"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Scheduled At</Text>
            <Text style={styles.infoValue}>
              {currentBooking.scheduled_at
                ? new Date(currentBooking.scheduled_at).toLocaleString()
                : "Not scheduled"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Created At</Text>
            <Text style={styles.infoValue}>
              {new Date(currentBooking.created_at).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="key-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Booking ID</Text>
            <Text style={styles.infoValue}>#{currentBooking.id}</Text>
          </View>
        </View>
      </View>

      {currentBooking.worker ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Assigned Worker</Text>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color="#6B7280" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>
                {currentBooking.worker_username || "Not available"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#6B7280" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>
                {currentBooking.worker_phone || "Not available"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={18} color="#6B7280" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Average Rating</Text>
              <Text style={styles.infoValue}>
                {currentBooking.worker_avg_rating != null
                  ? `${currentBooking.worker_avg_rating} / 5`
                  : "No ratings yet"}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#6B7280" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Reviews</Text>
              <Text style={styles.infoValue}>
                {currentBooking.worker_review_count ?? 0} review(s)
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {isBasePriceFlow && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Base Price Booking</Text>
          <Text style={styles.infoText}>
            You chose to continue with the admin-set base price.
            {currentBooking.status === "PENDING"
              ? " Waiting for a worker to claim your booking."
              : " A worker has claimed your booking and can now start the job."}
          </Text>
        </View>
      )}

      {isClientOfferPending && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Offer</Text>

          <View style={styles.offerBox}>
            <Text style={styles.offerLabel}>Latest Proposed Price</Text>
            <Text style={styles.offerValue}>
              {negotiatedPrice ? `Rs. ${negotiatedPrice}` : "Offer available"}
            </Text>

            <Text style={styles.offerLabel}>Message</Text>
            <Text style={styles.offerText}>
              {negotiationMessage ? negotiationMessage : "No message provided"}
            </Text>
          </View>

          <View style={styles.waitingCard}>
            <Ionicons name="hourglass-outline" size={20} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.waitingTitle}>Waiting for Worker</Text>
              <Text style={styles.waitingText}>
                Your latest offer has been sent. Please wait for the worker to
                accept it or send a counter-offer.
              </Text>
            </View>
          </View>
        </View>
      )}

      {isWorkerOfferOpen && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Worker Offer</Text>

          <View style={styles.offerBox}>
            <Text style={styles.offerLabel}>Proposed Price</Text>
            <Text style={styles.offerValue}>
              {negotiatedPrice
                ? `Rs. ${negotiatedPrice}`
                : "Price proposal available"}
            </Text>

            <Text style={styles.offerLabel}>Message</Text>
            <Text style={styles.offerText}>
              {negotiationMessage ? negotiationMessage : "No message provided"}
            </Text>

            <Text style={styles.offerLabel}>Proposed By</Text>
            <Text style={styles.offerText}>
              {negotiationProposedByUsername || "Worker"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAcceptOffer}
            disabled={acceptMutation.isPending}
          >
            <Ionicons name="checkmark-outline" size={18} color="#111111" />
            <Text style={styles.primaryButtonText}>
              {acceptMutation.isPending ? "Accepting..." : "Accept Offer"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>or send a counter-offer</Text>

          <TextInput
            value={counterPrice}
            onChangeText={setCounterPrice}
            placeholder="Enter your counter-offer price"
            placeholderTextColor="#888"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            value={counterMessage}
            onChangeText={setCounterMessage}
            placeholder="Optional message to worker"
            placeholderTextColor="#888"
            multiline
            style={[styles.input, styles.textarea]}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCounterOffer}
            disabled={counterMutation.isPending}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={18}
              color="#F4B400"
            />
            <Text style={styles.secondaryButtonText}>
              {counterMutation.isPending ? "Sending..." : "Send Counter Offer"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {currentBooking.status === "ACCEPTED" && (
        <View style={styles.infoStateCard}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#22C55E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoStateTitle}>Price Finalized</Text>
            <Text style={styles.infoStateText}>
              The price has been agreed. The worker can now start the job.
            </Text>
          </View>
        </View>
      )}

      {currentBooking.status === "IN_PROGRESS" && (
        <View style={styles.infoStateCard}>
          <Ionicons name="construct-outline" size={20} color="#3B82F6" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoStateTitle}>Work in Progress</Text>
            <Text style={styles.infoStateText}>
              Your worker has started this job.
            </Text>
          </View>
        </View>
      )}

      {eventsLoading ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
          <ActivityIndicator size="small" color="#F4B400" />
        </View>
      ) : events && events.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>

          {events.map((event, index) => (
            <View key={event.id} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDot} />
                {index !== events.length - 1 ? (
                  <View style={styles.timelineLine} />
                ) : null}
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>
                  {formatEventLabel(event.event_type)}
                </Text>
                <Text style={styles.timelineMeta}>
                  {new Date(event.created_at).toLocaleString()}
                </Text>
                <Text style={styles.timelineDescription}>
                  {formatEventDescription(event)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {currentBooking.status === "COMPLETED" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>

          {paymentLoading ? (
            <ActivityIndicator size="small" color="#F4B400" />
          ) : payment ? (
            <>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Total Price</Text>
                <Text style={styles.paymentValue}>Rs. {payment.amount}</Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Platform Fee</Text>
                <Text style={styles.paymentValue}>
                  Rs. {payment.commission_amount}
                </Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Worker Earnings</Text>
                <Text style={styles.paymentValue}>
                  Rs. {payment.worker_earning}
                </Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Status</Text>
                <Text style={styles.paymentValue}>{payment.status}</Text>
              </View>

              {payment.status === "PENDING" && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleConfirmPayment}
                  disabled={confirmPaymentMutation.isPending}
                >
                  <Ionicons name="wallet-outline" size={18} color="#111111" />
                  <Text style={styles.primaryButtonText}>
                    {confirmPaymentMutation.isPending
                      ? "Confirming..."
                      : "Confirm Payment"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.infoText}>Payment not available yet.</Text>
          )}
        </View>
      )}

      {currentBooking.status === "COMPLETED" && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push(`/(client)/review/${currentBooking.id}`)}
        >
          <Ionicons name="star-outline" size={18} color="#111111" />
          <Text style={styles.primaryButtonText}>Rate Worker</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
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
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#F4B400",
    justifyContent: "center",
    alignItems: "center",
  },

  heroTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  heroSubtitle: {
    marginTop: 6,
    color: "#D1D5DB",
    fontSize: 14,
  },

  pricePanel: {
    backgroundColor: "#1F2937",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },

  priceLabel: {
    color: "#9CA3AF",
    fontSize: 13,
  },

  priceValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  priceUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: "#D1D5DB",
  },

  originalPriceText: {
    marginTop: 12,
    color: "#D1D5DB",
    fontSize: 13,
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
    marginBottom: 10,
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

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },

  offerBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 16,
    marginTop: 6,
  },

  offerLabel: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 13,
  },

  offerValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
  },

  offerText: {
    marginTop: 4,
    fontSize: 15,
    color: "#111111",
    lineHeight: 22,
  },

  primaryButton: {
    marginTop: 16,
    backgroundColor: "#F4B400",
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  primaryButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },

  secondaryButton: {
    marginTop: 14,
    backgroundColor: "#111111",
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  secondaryButtonText: {
    color: "#F4B400",
    fontWeight: "bold",
    fontSize: 16,
  },

  helperText: {
    marginTop: 14,
    color: "#6B7280",
    fontSize: 13,
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111111",
    marginTop: 12,
  },

  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  waitingCard: {
    marginTop: 16,
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },

  waitingTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#9A3412",
  },

  waitingText: {
    marginTop: 4,
    color: "#9A3412",
    lineHeight: 20,
    fontSize: 14,
  },

  infoStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },

  infoStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
  },

  infoStateText: {
    marginTop: 4,
    color: "#6B7280",
    lineHeight: 20,
    fontSize: 14,
  },

  infoText: {
    color: "#6B7280",
    lineHeight: 22,
    fontSize: 14,
  },

  timelineRow: {
    flexDirection: "row",
    marginTop: 14,
  },

  timelineLeft: {
    width: 24,
    alignItems: "center",
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F4B400",
    marginTop: 4,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 4,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 16,
  },

  timelineTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111111",
  },

  timelineMeta: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  timelineDescription: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 6,
    lineHeight: 20,
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  paymentLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  paymentValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
});