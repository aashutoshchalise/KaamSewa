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
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyBookings,
  startJob,
  completeJob,
  createNegotiation,
  acceptNegotiation,
} from "../../../src/api/bookings";
import type { Booking } from "../../../src/types";
import { getStatusMeta } from "../../../src/utils/status";

export default function WorkerJobDetail() {
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const [proposedPrice, setProposedPrice] = useState("");
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery<Booking[]>({
    queryKey: ["worker-my-jobs"],
    queryFn: getMyBookings,
  });

  const startMutation = useMutation({
    mutationFn: startJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-my-jobs"] });
      Alert.alert("Job started");
    },
    onError: (err: any) => {
      Alert.alert(
        "Could not start job",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-my-jobs"] });
      Alert.alert("Job completed");
    },
    onError: (err: any) => {
      Alert.alert(
        "Could not complete job",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  const acceptOfferMutation = useMutation({
    mutationFn: acceptNegotiation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-my-jobs"] });
      Alert.alert("Client offer accepted");
    },
    onError: (err: any) => {
      Alert.alert(
        "Could not accept offer",
        JSON.stringify(err?.response?.data || err?.message)
      );
    },
  });

  const negotiationMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["worker-my-jobs"] });
      setProposedPrice("");
      setMessage("");
      Alert.alert("Counter offer sent to client");
    },
    onError: (err: any) => {
      Alert.alert(
        "Could not send counter offer",
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

  const job = data?.find((b) => b.id === Number(id));

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#666" }}>Job not found</Text>
      </View>
    );
  }

  const currentJob = job;
  const statusMeta = getStatusMeta(currentJob.status);

  const negotiationId = currentJob.negotiation_id;
  const negotiatedPrice = currentJob.negotiated_price;
  const negotiationMessage = currentJob.negotiation_message;
  const negotiationProposedBy = currentJob.negotiation_proposed_by;
  const negotiationProposedByUsername =
    currentJob.negotiation_proposed_by_username;

  const hasNegotiation = !!negotiationId;

  const isClientOfferOpen =
    currentJob.status === "NEGOTIATING" &&
    negotiationId &&
    negotiationProposedBy &&
    Number(negotiationProposedBy) === Number(currentJob.client);

  const isBasePriceFlow =
    currentJob.status === "CLAIMED" && !hasNegotiation;

  const displayedPrice = currentJob.final_price || currentJob.service_price;

  function handleCounterOffer() {
    const priceToSend = proposedPrice.trim();

    if (!priceToSend) {
      Alert.alert("Enter a counter-offer price");
      return;
    }

    negotiationMutation.mutate({
      bookingId: currentJob.id,
      proposed_price: priceToSend,
      message: message.trim(),
    });
  }

  function handleAcceptClientOffer() {
    if (!negotiationId) {
      Alert.alert("Offer not found");
      return;
    }

    acceptOfferMutation.mutate(Number(negotiationId));
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
            <Ionicons name="briefcase-outline" size={24} color="#111111" />
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

        <Text style={styles.heroTitle}>{currentJob.service_name}</Text>
        <Text style={styles.heroSubtitle}>Job Details & Client Updates</Text>

        <View style={styles.pricePanel}>
          <Text style={styles.priceLabel}>
            {currentJob.final_price ? "Agreed Price" : "Base Price"}
          </Text>
          <Text style={styles.priceValue}>
            Rs {displayedPrice}
            <Text style={styles.priceUnit}> / {currentJob.service_pricing_unit}</Text>
          </Text>
        </View>

        {currentJob.final_price &&
        currentJob.service_price !== currentJob.final_price ? (
          <Text style={styles.originalPriceText}>
            Original base price: Rs {currentJob.service_price} /{" "}
            {currentJob.service_pricing_unit}
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Job Information</Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{currentJob.address}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Notes</Text>
            <Text style={styles.infoValue}>
              {currentJob.notes ? currentJob.notes : "No instructions"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Scheduled Time</Text>
            <Text style={styles.infoValue}>
              {currentJob.scheduled_at
                ? new Date(currentJob.scheduled_at).toLocaleString()
                : "Not scheduled"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Client Contact</Text>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {currentJob.client_username || "Not available"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color="#6B7280" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>
              {currentJob.client_phone || "Not available"}
            </Text>
          </View>
        </View>
      </View>

      {currentJob.review_id ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Review For This Job</Text>

          <View style={styles.reviewHeader}>
            <View style={styles.reviewBadge}>
              <Text style={styles.reviewBadgeText}>
                ⭐ {currentJob.review_rating} / 5
              </Text>
            </View>
          </View>

          <Text style={styles.reviewComment}>
            {currentJob.review_comment?.trim()
              ? `"${currentJob.review_comment}"`
              : "No written review"}
          </Text>

          <Text style={styles.reviewMeta}>
            By {currentJob.review_client_username || "Client"}
          </Text>

          <Text style={styles.reviewMetaMuted}>
            {currentJob.review_created_at
              ? new Date(currentJob.review_created_at).toLocaleString()
              : "Not available"}
          </Text>
        </View>
      ) : currentJob.status === "COMPLETED" ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Review For This Job</Text>
          <Text style={styles.infoText}>
            The client has not reviewed this job yet.
          </Text>
        </View>
      ) : null}

      {isBasePriceFlow && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Base Price Booking</Text>
          <Text style={styles.infoText}>
            The client chose to continue with the base price. You can start the
            job directly, or send a counter-offer if needed.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => startMutation.mutate(currentJob.id)}
            disabled={startMutation.isPending}
          >
            <Ionicons name="play-outline" size={18} color="#111111" />
            <Text style={styles.primaryButtonText}>
              {startMutation.isPending ? "Starting..." : "Start Job"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>or send a counter-offer</Text>

          <TextInput
            value={proposedPrice}
            onChangeText={setProposedPrice}
            placeholder="Enter counter-offer price"
            placeholderTextColor="#888"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Optional message to client"
            placeholderTextColor="#888"
            multiline
            style={[styles.input, styles.textarea]}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCounterOffer}
            disabled={negotiationMutation.isPending}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color="#F4B400" />
            <Text style={styles.secondaryButtonText}>
              {negotiationMutation.isPending ? "Sending..." : "Send Counter Offer"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {currentJob.status === "NEGOTIATING" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Negotiation</Text>

          <View style={styles.offerBox}>
            <Text style={styles.offerLabel}>Latest Offer</Text>
            <Text style={styles.offerValue}>
              {negotiatedPrice ? `Rs ${negotiatedPrice}` : "Offer available"}
            </Text>

            <Text style={styles.offerLabel}>Message</Text>
            <Text style={styles.offerText}>
              {negotiationMessage ? negotiationMessage : "No message provided"}
            </Text>

            <Text style={styles.offerLabel}>Proposed By</Text>
            <Text style={styles.offerText}>
              {negotiationProposedByUsername || "Unknown"}
            </Text>
          </View>

          {isClientOfferOpen ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleAcceptClientOffer}
                disabled={acceptOfferMutation.isPending}
              >
                <Ionicons name="checkmark-outline" size={18} color="#111111" />
                <Text style={styles.primaryButtonText}>
                  {acceptOfferMutation.isPending
                    ? "Accepting..."
                    : "Accept Client Offer"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.helperText}>or send a counter-offer</Text>

              <TextInput
                value={proposedPrice}
                onChangeText={setProposedPrice}
                placeholder="Enter counter-offer price"
                placeholderTextColor="#888"
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Optional message to client"
                placeholderTextColor="#888"
                multiline
                style={[styles.input, styles.textarea]}
              />

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCounterOffer}
                disabled={negotiationMutation.isPending}
              >
                <Ionicons name="swap-horizontal-outline" size={18} color="#F4B400" />
                <Text style={styles.secondaryButtonText}>
                  {negotiationMutation.isPending ? "Sending..." : "Send Counter Offer"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.waitingCard}>
              <Ionicons name="hourglass-outline" size={20} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={styles.waitingTitle}>Waiting for Client</Text>
                <Text style={styles.waitingText}>
                  You already sent the latest offer. Waiting for the client to
                  respond.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {currentJob.status === "ACCEPTED" && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => startMutation.mutate(currentJob.id)}
          disabled={startMutation.isPending}
        >
          <Ionicons name="play-outline" size={18} color="#111111" />
          <Text style={styles.primaryButtonText}>
            {startMutation.isPending ? "Starting..." : "Start Job"}
          </Text>
        </TouchableOpacity>
      )}

      {currentJob.status === "IN_PROGRESS" && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => completeMutation.mutate(currentJob.id)}
          disabled={completeMutation.isPending}
        >
          <Ionicons name="checkmark-done-outline" size={18} color="#111111" />
          <Text style={styles.primaryButtonText}>
            {completeMutation.isPending ? "Completing..." : "Complete Job"}
          </Text>
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

  label: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 13,
  },

  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111111",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
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

  reviewHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 14,
  },

  reviewBadge: {
    backgroundColor: "#FFF7D6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  reviewBadgeText: {
    color: "#B45309",
    fontWeight: "700",
    fontSize: 14,
  },

  reviewComment: {
    fontSize: 16,
    color: "#111111",
    lineHeight: 24,
    fontStyle: "italic",
  },

  reviewMeta: {
    marginTop: 16,
    fontSize: 14,
    color: "#111111",
    fontWeight: "600",
  },

  reviewMetaMuted: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
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
    fontWeight: "bold",
    fontSize: 16,
    color: "#111111",
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
    fontWeight: "bold",
    fontSize: 16,
    color: "#F4B400",
  },

  helperText: {
    marginTop: 14,
    color: "#6B7280",
    fontSize: 13,
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

  infoText: {
    color: "#6B7280",
    lineHeight: 22,
    fontSize: 14,
  },
});