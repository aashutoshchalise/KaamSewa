import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { createReview } from "../../../src/api/reviews";

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const reviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      Alert.alert("Success", "Review submitted successfully.");
      router.replace("/(client)/bookings");
    },
    onError: (err: any) => {
      Alert.alert(
        "Could not submit review",
        JSON.stringify(err?.response?.data || err?.message || "Something went wrong")
      );
    },
  });

  function handleSubmit() {
    if (rating < 1) {
      Alert.alert("Missing rating", "Please select a rating.");
      return;
    }

    reviewMutation.mutate({
      bookingId: Number(bookingId),
      rating,
      comment,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate Your Service</Text>
      <Text style={styles.subtitle}>
        Share your experience with the worker
      </Text>

      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={36}
              color="#FFC300"
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        placeholder="Write your review..."
        placeholderTextColor="#666666"
        value={comment}
        onChangeText={setComment}
        multiline
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        {reviewMutation.isPending ? (
          <ActivityIndicator color="#111111" />
        ) : (
          <Text style={styles.buttonText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111111",
  },

  subtitle: {
    marginTop: 6,
    color: "#666666",
    marginBottom: 24,
  },

  starRow: {
    flexDirection: "row",
    marginBottom: 24,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    height: 140,
    textAlignVertical: "top",
    color: "#111111",
  },

  button: {
    marginTop: 24,
    backgroundColor: "#FFC300",
    height: 55,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },
});