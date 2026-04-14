import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
  } from "react-native";
  import { useEffect, useState } from "react";
  import { useLocalSearchParams } from "expo-router";
  import { Ionicons } from "@expo/vector-icons";
  import {
    getBookingMessages,
    sendBookingMessage,
    getBookingDetail,
  } from "../../src/api/bookings";
  import type { Booking, BookingMessage } from "../../src/types";
  
  export default function BookingChat() {
    const { bookingId } = useLocalSearchParams();
    const numericBookingId = Number(bookingId);
  
    const [messages, setMessages] = useState<BookingMessage[]>([]);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [input, setInput] = useState("");
    const [price, setPrice] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
  
    async function loadAll() {
      try {
        setLoading(true);
        const [messagesRes, bookingRes] = await Promise.all([
          getBookingMessages(numericBookingId),
          getBookingDetail(numericBookingId),
        ]);
        setMessages(messagesRes);
        setBooking(bookingRes);
      } catch (err) {
        console.log("load chat error", err);
      } finally {
        setLoading(false);
      }
    }
  
    useEffect(() => {
      loadAll();
      const interval = setInterval(loadAll, 4000);
      return () => clearInterval(interval);
    }, [numericBookingId]);
  
    async function handleSend() {
      if (!input.trim() && !price.trim()) return;
  
      try {
        setSending(true);
  
        await sendBookingMessage(numericBookingId, {
          message: input.trim() || undefined,
          proposed_price: price.trim() || undefined,
        });
  
        setInput("");
        setPrice("");
        await loadAll();
      } catch (err) {
        console.log("send error", err);
      } finally {
        setSending(false);
      }
    }
  
    function renderItem({ item }: { item: BookingMessage }) {
      return (
        <View
          style={[
            styles.messageWrap,
            item.is_me ? styles.messageWrapRight : styles.messageWrapLeft,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              item.is_me ? styles.myBubble : styles.otherBubble,
            ]}
          >
            <Text style={styles.senderName}>{item.sender_name}</Text>
  
            {!!item.proposed_price && (
              <View style={styles.offerPill}>
                <Ionicons name="cash-outline" size={14} color="#111111" />
                <Text style={styles.offerText}>Offer Rs {item.proposed_price}</Text>
              </View>
            )}
  
            {!!item.message && <Text style={styles.messageText}>{item.message}</Text>}
  
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        </View>
      );
    }
  
    const isNegotiated =
      !!booking?.final_price &&
      !!booking?.service_price &&
      String(booking.final_price) !== String(booking.service_price);
  
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Negotiation Chat</Text>
            <Text style={styles.headerSubtitle}>
              {booking?.package_name || booking?.service_name || "Booking"}
            </Text>
  
            <View style={styles.headerPriceCard}>
              <Text style={styles.headerPriceLabel}>Base Price</Text>
              <Text style={styles.headerPriceValue}>
                Rs {booking?.service_price || "0"}
                {booking?.service_pricing_unit ? ` / ${booking.service_pricing_unit}` : ""}
              </Text>
  
              {isNegotiated && (
                <>
                  <Text style={styles.currentOfferLabel}>Current Offer</Text>
                  <Text style={styles.currentOfferValue}>Rs {booking?.final_price}</Text>
                </>
              )}
            </View>
          </View>
  
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#FFC300" />
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
            />
          )}
  
          <View style={styles.composerCard}>
            <TextInput
              placeholder="Write a message..."
              placeholderTextColor="#6B7280"
              value={input}
              onChangeText={setInput}
              style={styles.input}
              multiline
            />
  
            <View style={styles.bottomComposerRow}>
              <View style={styles.offerInputWrap}>
                <Ionicons name="cash-outline" size={16} color="#6B7280" />
                <TextInput
                  placeholder="Offer"
                  placeholderTextColor="#6B7280"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  style={styles.offerInput}
                />
              </View>
  
              <TouchableOpacity
                style={[styles.sendBtn, sending && { opacity: 0.7 }]}
                onPress={handleSend}
                disabled={sending}
              >
                <Ionicons name="send" size={18} color="#111111" />
                <Text style={styles.sendBtnText}>
                  {sending ? "Sending" : "Send"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#111111",
    },
    screen: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },
    header: {
      backgroundColor: "#111111",
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 18,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerTitle: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "700",
    },
    headerSubtitle: {
      color: "#D1D5DB",
      marginTop: 4,
      fontSize: 14,
    },
    headerPriceCard: {
      marginTop: 14,
      backgroundColor: "#1E293B",
      borderRadius: 16,
      padding: 14,
    },
    headerPriceLabel: {
      color: "#CBD5E1",
      fontSize: 12,
    },
    headerPriceValue: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "700",
      marginTop: 4,
    },
    currentOfferLabel: {
      marginTop: 10,
      color: "#FBCFE8",
      fontSize: 12,
    },
    currentOfferValue: {
      marginTop: 4,
      color: "#F9A8D4",
      fontSize: 17,
      fontWeight: "700",
    },
    loaderWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: {
      padding: 16,
      paddingBottom: 24,
    },
    messageWrap: {
      marginBottom: 12,
      flexDirection: "row",
    },
    messageWrapLeft: {
      justifyContent: "flex-start",
    },
    messageWrapRight: {
      justifyContent: "flex-end",
    },
    messageBubble: {
      maxWidth: "82%",
      borderRadius: 18,
      padding: 12,
    },
    myBubble: {
      backgroundColor: "#FFC300",
    },
    otherBubble: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    senderName: {
      fontSize: 11,
      fontWeight: "700",
      color: "#374151",
      marginBottom: 6,
    },
    offerPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#FFF7D6",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 8,
    },
    offerText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#111111",
    },
    messageText: {
      fontSize: 14,
      color: "#111111",
      lineHeight: 20,
    },
    timeText: {
      marginTop: 8,
      fontSize: 10,
      color: "#6B7280",
    },
    composerCard: {
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      padding: 12,
    },
    input: {
      minHeight: 48,
      maxHeight: 110,
      backgroundColor: "#F3F4F6",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: "#111111",
      textAlignVertical: "top",
    },
    bottomComposerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      gap: 10,
    },
    offerInputWrap: {
      flex: 1,
      height: 46,
      backgroundColor: "#F3F4F6",
      borderRadius: 14,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    offerInput: {
      flex: 1,
      color: "#111111",
    },
    sendBtn: {
      height: 46,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: "#FFC300",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    sendBtnText: {
      color: "#111111",
      fontWeight: "700",
    },
  });