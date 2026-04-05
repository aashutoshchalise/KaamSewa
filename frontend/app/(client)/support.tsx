import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupportMessage,
  getMySupportMessages,
  SupportMessage,
} from "../../src/api/support";

export default function ClientSupportScreen() {
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data, isLoading, refetch } = useQuery<SupportMessage[]>({
    queryKey: ["client-support-messages"],
    queryFn: getMySupportMessages,
  });

  const createMutation = useMutation({
    mutationFn: createSupportMessage,
    onSuccess: async () => {
      setSubject("");
      setMessage("");
      await queryClient.invalidateQueries({
        queryKey: ["client-support-messages"],
      });
      Alert.alert("Sent", "Your message has been sent to admin.");
    },
    onError: (err: any) => {
      Alert.alert(
        "Failed",
        JSON.stringify(err?.response?.data || err?.message || "Something went wrong")
      );
    },
  });

  const messages = data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Support Chat</Text>
          <Text style={styles.subtitle}>
            Send complaints or app-related issues to admin
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
          <Ionicons name="refresh-outline" size={18} color="#111111" />
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Enter subject"
          placeholderTextColor="#8A8A8A"
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your issue"
          placeholderTextColor="#8A8A8A"
          multiline
        />

        <TouchableOpacity
          style={[styles.sendButton, createMutation.isPending && styles.disabled]}
          disabled={createMutation.isPending}
          onPress={() => {
            if (!subject.trim() || !message.trim()) {
              Alert.alert("Missing fields", "Please fill subject and message.");
              return;
            }

            createMutation.mutate({
              subject: subject.trim(),
              message: message.trim(),
            });
          }}
        >
          <Text style={styles.sendButtonText}>
            {createMutation.isPending ? "Sending..." : "Send Message"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Previous Messages</Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F4B400" />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={42} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Your support messages and admin replies will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.threadCard}>
              <View style={styles.clientBubble}>
                <Text style={styles.bubbleLabel}>You</Text>
                <Text style={styles.bubbleSubject}>{item.subject}</Text>
                <Text style={styles.bubbleText}>{item.message}</Text>
                <Text style={styles.bubbleMeta}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>

              {item.admin_reply ? (
                <View style={styles.adminBubble}>
                  <Text style={styles.adminLabel}>Admin Reply</Text>
                  <Text style={styles.adminText}>{item.admin_reply}</Text>
                </View>
              ) : (
                <View style={styles.pendingBox}>
                  <Text style={styles.pendingText}>
                    Waiting for admin reply • {item.status}
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 55,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111111",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    maxWidth: 280,
  },

  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 8,
    marginTop: 8,
  },

  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111111",
  },

  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  sendButton: {
    backgroundColor: "#111111",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
  },

  disabled: {
    opacity: 0.7,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 12,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "bold",
    color: "#111111",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  threadCard: {
    marginBottom: 14,
  },

  clientBubble: {
    alignSelf: "flex-end",
    maxWidth: "88%",
    backgroundColor: "#111111",
    borderRadius: 18,
    padding: 14,
  },

  bubbleLabel: {
    color: "#F4B400",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },

  bubbleSubject: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
  },

  bubbleText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },

  bubbleMeta: {
    color: "#D1D5DB",
    fontSize: 11,
    marginTop: 8,
  },

  adminBubble: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginTop: 8,
  },

  adminLabel: {
    color: "#111111",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },

  adminText: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },

  pendingBox: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF7D6",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },

  pendingText: {
    color: "#7C5A00",
    fontSize: 12,
    fontWeight: "600",
  },
});