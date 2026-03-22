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
        <ActivityIndicator size="large" color="#FFC300" />
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Job Details</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{currentJob.service_name}</Text>

        <Text style={styles.label}>Base Price</Text>
        <Text style={styles.value}>
          Rs {currentJob.service_price} / {currentJob.service_pricing_unit}
        </Text>

        {currentJob.final_price ? (
          <>
            <Text style={styles.label}>Final Agreed Price</Text>
            <Text style={styles.value}>Rs {currentJob.final_price}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{currentJob.address}</Text>

        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>
          {currentJob.notes ? currentJob.notes : "No instructions"}
        </Text>

        <Text style={styles.label}>Scheduled Time</Text>
        <Text style={styles.value}>
          {currentJob.scheduled_at
            ? new Date(currentJob.scheduled_at).toLocaleString()
            : "Not scheduled"}
        </Text>

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
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Client Contact</Text>

        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>
          {currentJob.client_username || "Not available"}
        </Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>
          {currentJob.client_phone || "Not available"}
        </Text>
      </View>

      {currentJob.review_id ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Review For This Job</Text>

          <Text style={styles.label}>Rating</Text>
          <Text style={styles.value}>
            {currentJob.review_rating != null
              ? `${currentJob.review_rating} / 5`
              : "No rating"}
          </Text>

          <Text style={styles.label}>Comment</Text>
          <Text style={styles.value}>
            {currentJob.review_comment?.trim()
              ? currentJob.review_comment
              : "No written review"}
          </Text>

          <Text style={styles.label}>Reviewed By</Text>
          <Text style={styles.value}>
            {currentJob.review_client_username || "Client"}
          </Text>

          <Text style={styles.label}>Reviewed At</Text>
          <Text style={styles.value}>
            {currentJob.review_created_at
              ? new Date(currentJob.review_created_at).toLocaleString()
              : "Not available"}
          </Text>
        </View>
      ) : currentJob.status === "COMPLETED" ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Review For This Job</Text>
          <Text style={styles.infoText}>The client has not reviewed this job yet.</Text>
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
            style={styles.button}
            onPress={() => startMutation.mutate(currentJob.id)}
            disabled={startMutation.isPending}
          >
            <Text style={styles.buttonText}>
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
            <Text style={styles.secondaryButtonText}>
              {negotiationMutation.isPending ? "Sending..." : "Send Counter Offer"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {currentJob.status === "NEGOTIATING" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Negotiation</Text>

          <Text style={styles.label}>Latest Offer</Text>
          <Text style={styles.value}>
            {negotiatedPrice ? `Rs ${negotiatedPrice}` : "Offer available"}
          </Text>

          <Text style={styles.label}>Message</Text>
          <Text style={styles.value}>
            {negotiationMessage ? negotiationMessage : "No message provided"}
          </Text>

          <Text style={styles.label}>Proposed By</Text>
          <Text style={styles.value}>
            {negotiationProposedByUsername || "Unknown"}
          </Text>

          {isClientOfferOpen ? (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={handleAcceptClientOffer}
                disabled={acceptOfferMutation.isPending}
              >
                <Text style={styles.buttonText}>
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
                <Text style={styles.secondaryButtonText}>
                  {negotiationMutation.isPending ? "Sending..." : "Send Counter Offer"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Waiting for Client</Text>
              <Text style={styles.infoText}>
                You already sent the latest offer. Waiting for the client to respond.
              </Text>
            </View>
          )}
        </View>
      )}

      {currentJob.status === "ACCEPTED" && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => startMutation.mutate(currentJob.id)}
          disabled={startMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {startMutation.isPending ? "Starting..." : "Start Job"}
          </Text>
        </TouchableOpacity>
      )}

      {currentJob.status === "IN_PROGRESS" && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => completeMutation.mutate(currentJob.id)}
          disabled={completeMutation.isPending}
        >
          <Text style={styles.buttonText}>
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
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  label: {
    marginTop: 12,
    color: "#777",
    fontSize: 13,
  },

  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111",
  },

  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
    marginTop: 12,
  },

  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  button: {
    marginTop: 16,
    backgroundColor: "#FFC300",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#111",
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
    fontWeight: "bold",
    fontSize: 16,
    color: "#FFC300",
  },

  helperText: {
    marginTop: 12,
    color: "#666",
  },

  infoCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 6,
  },

  infoText: {
    color: "#666",
    lineHeight: 20,
  },
});