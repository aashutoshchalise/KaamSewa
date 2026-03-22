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
        <ActivityIndicator size="large" color="#FFC300" />
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Booking Details</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{currentBooking.service_name}</Text>

        <Text style={styles.label}>Base Price</Text>
        <Text style={styles.value}>
          Rs. {currentBooking.service_price} /{" "}
          {currentBooking.service_pricing_unit}
        </Text>

        {currentBooking.final_price ? (
          <>
            <Text style={styles.label}>Final Agreed Price</Text>
            <Text style={styles.value}>Rs. {currentBooking.final_price}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Status</Text>
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

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{currentBooking.address}</Text>

        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>
          {currentBooking.notes?.trim()
            ? currentBooking.notes
            : "No notes provided"}
        </Text>

        <Text style={styles.label}>Scheduled At</Text>
        <Text style={styles.value}>
          {currentBooking.scheduled_at
            ? new Date(currentBooking.scheduled_at).toLocaleString()
            : "Not scheduled"}
        </Text>

        <Text style={styles.label}>Created At</Text>
        <Text style={styles.value}>
          {new Date(currentBooking.created_at).toLocaleString()}
        </Text>

        <Text style={styles.label}>Booking ID</Text>
        <Text style={styles.value}>#{currentBooking.id}</Text>
      </View>

      {currentBooking.worker ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Assigned Worker</Text>

          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>
            {currentBooking.worker_username || "Not available"}
          </Text>

          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>
            {currentBooking.worker_phone || "Not available"}
          </Text>

          <Text style={styles.label}>Average Rating</Text>
          <Text style={styles.value}>
            {currentBooking.worker_avg_rating != null
              ? `${currentBooking.worker_avg_rating} / 5`
              : "No ratings yet"}
          </Text>

          <Text style={styles.label}>Reviews</Text>
          <Text style={styles.value}>
            {currentBooking.worker_review_count ?? 0} review(s)
          </Text>
        </View>
      ) : null}

      {isBasePriceFlow && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Base Price Booking</Text>
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

          <Text style={styles.label}>Latest Proposed Price</Text>
          <Text style={styles.value}>
            {negotiatedPrice ? `Rs. ${negotiatedPrice}` : "Offer available"}
          </Text>

          <Text style={styles.label}>Message</Text>
          <Text style={styles.value}>
            {negotiationMessage ? negotiationMessage : "No message provided"}
          </Text>

          <View style={styles.infoCardInner}>
            <Text style={styles.infoTitle}>Waiting for Worker</Text>
            <Text style={styles.infoText}>
              Your latest offer has been sent. Please wait for the worker to
              accept it or send a counter-offer.
            </Text>
          </View>
        </View>
      )}

      {isWorkerOfferOpen && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Worker Offer</Text>

          <Text style={styles.label}>Proposed Price</Text>
          <Text style={styles.value}>
            {negotiatedPrice
              ? `Rs. ${negotiatedPrice}`
              : "Price proposal available"}
          </Text>

          <Text style={styles.label}>Message</Text>
          <Text style={styles.value}>
            {negotiationMessage ? negotiationMessage : "No message provided"}
          </Text>

          <Text style={styles.label}>Proposed By</Text>
          <Text style={styles.value}>
            {negotiationProposedByUsername || "Worker"}
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAcceptOffer}
            disabled={acceptMutation.isPending}
          >
            <Text style={styles.actionButtonText}>
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
            <Text style={styles.secondaryButtonText}>
              {counterMutation.isPending ? "Sending..." : "Send Counter Offer"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {currentBooking.status === "ACCEPTED" && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Price Finalized</Text>
          <Text style={styles.infoText}>
            The price has been agreed. The worker can now start the job.
          </Text>
        </View>
      )}

      {currentBooking.status === "IN_PROGRESS" && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Work in Progress</Text>
          <Text style={styles.infoText}>
            Your worker has started this job.
          </Text>
        </View>
      )}

      {eventsLoading ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Activity Timeline</Text>
          <ActivityIndicator size="small" color="#FFC300" />
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
            <ActivityIndicator size="small" color="#FFC300" />
          ) : payment ? (
            <>
              <Text style={styles.label}>Total Price</Text>
              <Text style={styles.value}>Rs. {payment.amount}</Text>

              <Text style={styles.label}>Platform Fee</Text>
              <Text style={styles.value}>Rs. {payment.commission_amount}</Text>

              <Text style={styles.label}>Worker Earnings</Text>
              <Text style={styles.value}>Rs. {payment.worker_earning}</Text>

              <Text style={styles.label}>Payment Status</Text>
              <Text style={styles.value}>{payment.status}</Text>

              {payment.status === "PENDING" && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleConfirmPayment}
                  disabled={confirmPaymentMutation.isPending}
                >
                  <Text style={styles.actionButtonText}>
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
          style={styles.rateButton}
          onPress={() => router.push(`/(client)/review/${currentBooking.id}`)}
        >
          <Text style={styles.rateButtonText}>Rate Worker</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: "#777777",
    marginTop: 14,
    marginBottom: 6,
  },

  value: {
    fontSize: 16,
    color: "#111111",
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 8,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 2,
  },

  statusText: {
    fontWeight: "600",
    fontSize: 12,
  },

  actionButton: {
    marginTop: 18,
    backgroundColor: "#FFC300",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  actionButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },

  secondaryButton: {
    marginTop: 14,
    backgroundColor: "#111111",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#FFC300",
    fontWeight: "bold",
    fontSize: 16,
  },

  helperText: {
    marginTop: 12,
    color: "#666666",
  },

  input: {
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
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

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  infoCardInner: {
    backgroundColor: "#F8F8F8",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },

  infoTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 8,
  },

  infoText: {
    color: "#666666",
    lineHeight: 20,
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
    backgroundColor: "#FFC300",
    marginTop: 4,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E0E0E0",
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
    color: "#888888",
    marginTop: 2,
  },

  timelineDescription: {
    fontSize: 14,
    color: "#555555",
    marginTop: 6,
    lineHeight: 20,
  },

  rateButton: {
    marginTop: 6,
    backgroundColor: "#FFC300",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  rateButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },
});