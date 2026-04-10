import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
  } from "react-native";
  import { useLocalSearchParams, useRouter } from "expo-router";
  import { useMemo, useState } from "react";
  import { useQuery, useMutation } from "@tanstack/react-query";
  import DateTimePicker from "@react-native-community/datetimepicker";
  import { Ionicons } from "@expo/vector-icons";
  
  import LocationPicker from "../../components/LocationPicker";
  import { getPackage } from "../../src/api/services";
  import { createBooking } from "../../src/api/bookings";
  
  export default function PackageDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
  
    const [notes, setNotes] = useState("");
    const [coords, setCoords] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);
  
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
  
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
  
    const { data: pkg, isLoading } = useQuery({
      queryKey: ["package", id],
      queryFn: () => getPackage(Number(id)),
      enabled: !!id,
    });
  
    const bookingMutation = useMutation({
      mutationFn: createBooking,
      onSuccess: () => {
        Alert.alert("Success", "Package booked successfully.", [
          {
            text: "OK",
            onPress: () => router.push("/(client)/bookings"),
          },
        ]);
      },
      onError: (err: any) => {
        Alert.alert(
          "Booking failed",
          JSON.stringify(
            err?.response?.data || err?.message || "Something went wrong"
          )
        );
      },
    });
  
    const minDate = useMemo(() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }, []);
  
    function formatDate(date: Date) {
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  
    function formatTime(date: Date) {
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
  
    function combineDateAndTime(datePart: Date, timePart: Date) {
      const combined = new Date(datePart);
      combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
      return combined;
    }
  
    function handleDateChange(_: any, date?: Date) {
      setShowDatePicker(false);
      if (date) {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        setSelectedDate(normalized);
      }
    }
  
    function handleTimeChange(_: any, time?: Date) {
      setShowTimePicker(false);
      if (time) {
        setSelectedTime(time);
      }
    }
  
    function getAddressFromCoords() {
      if (!coords) return "";
      return `Lat: ${coords.latitude}, Lng: ${coords.longitude}`;
    }
  
    async function handleBookPackage() {
      if (!pkg) {
        Alert.alert("Package not found");
        return;
      }
  
      if (!coords) {
        Alert.alert("Location required", "Please select the service location on the map.");
        return;
      }
  
      const scheduledAt = combineDateAndTime(selectedDate, selectedTime);
      const now = new Date();
  
      if (scheduledAt <= now) {
        Alert.alert("Invalid schedule", "Please choose a future date and time.");
        return;
      }
  
      bookingMutation.mutate({
        package: Number(id),
        address: getAddressFromCoords(),
        notes: notes.trim(),
        scheduled_at: scheduledAt.toISOString(),
      });
    }
  
    if (isLoading) {
      return (
        <View style={styles.loaderScreen}>
          <ActivityIndicator size="large" color="#F4B400" />
          <Text style={styles.loaderText}>Loading package...</Text>
        </View>
      );
    }
  
    if (!pkg) {
      return (
        <View style={styles.loaderScreen}>
          <Text style={styles.emptyText}>Package not found</Text>
        </View>
      );
    }
  
    const scheduledPreview = combineDateAndTime(selectedDate, selectedTime);
  
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.screen}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIcon}>
                  <Ionicons name="cube-outline" size={24} color="#111111" />
                </View>
  
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>Fixed Package</Text>
                </View>
              </View>
  
              <Text style={styles.title}>{pkg.name}</Text>
              <Text style={styles.subtitle}>
                Book this bundled package with one tap and schedule it at your preferred time.
              </Text>
  
              <View style={styles.heroPriceWrap}>
                <Text style={styles.heroPriceLabel}>Total Package Price</Text>
                <Text style={styles.heroPrice}>Rs. {pkg.total_base_price}</Text>
              </View>
            </View>
  
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>What’s Included</Text>
              <Text style={styles.sectionHint}>
                These services are included in this package.
              </Text>
  
              {pkg.items?.map((item: any) => (
                <View key={item.id} style={styles.serviceRow}>
                  <View style={styles.serviceLeft}>
                    <View style={styles.serviceIconWrap}>
                      <Ionicons name="checkmark-outline" size={16} color="#111111" />
                    </View>
  
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{item.service_name}</Text>
                      <Text style={styles.serviceSub}>Quantity: {item.quantity}</Text>
                    </View>
                  </View>
  
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyBadgeText}>x{item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
  
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Service Location</Text>
              <Text style={styles.sectionHint}>
                Tap on the map to select the exact service location.
              </Text>
  
              <LocationPicker
                    onLocationSelect={(location: { latitude: number; longitude: number }) => {
                        setCoords(location);
                    }}
                />
  
              {!coords ? (
                <Text style={styles.mapWarning}>Please select a location</Text>
              ) : (
                <View style={styles.previewCard}>
                  <Ionicons name="location-outline" size={18} color="#15803D" />
                  <Text style={styles.previewText}>
                    Selected coordinates:{" "}
                    <Text style={styles.previewStrong}>
                      {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
  
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <Text style={styles.sectionHint}>
                Choose your preferred date and time.
              </Text>
  
              <TouchableOpacity
                style={styles.scheduleBox}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#111111" />
                <View style={styles.scheduleTextWrap}>
                  <Text style={styles.scheduleLabel}>Date</Text>
                  <Text style={styles.scheduleValue}>{formatDate(selectedDate)}</Text>
                </View>
              </TouchableOpacity>
  
              <TouchableOpacity
                style={styles.scheduleBox}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={18} color="#111111" />
                <View style={styles.scheduleTextWrap}>
                  <Text style={styles.scheduleLabel}>Time</Text>
                  <Text style={styles.scheduleValue}>{formatTime(selectedTime)}</Text>
                </View>
              </TouchableOpacity>
  
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  minimumDate={minDate}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                />
              )}
  
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
              )}
  
              <View style={styles.previewCard}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#15803D" />
                <Text style={styles.previewText}>
                  Scheduled for{" "}
                  <Text style={styles.previewStrong}>
                    {scheduledPreview.toLocaleString()}
                  </Text>
                </Text>
              </View>
            </View>
  
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <Text style={styles.sectionHint}>
                Add any special instructions for the worker.
              </Text>
  
              <TextInput
                placeholder="Example: Please call before arriving..."
                placeholderTextColor="#8A8A8A"
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
  
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={18} color="#B45309" />
              <Text style={styles.infoText}>
                This package is booked at a fixed price. After a worker completes the job,
                payment will appear in your booking details.
              </Text>
            </View>
  
            <View style={{ height: 120 }} />
          </ScrollView>
  
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.totalLabel}>Total Price</Text>
              <Text style={styles.totalPrice}>Rs. {pkg.total_base_price}</Text>
            </View>
  
            <TouchableOpacity
              style={[
                styles.bookButton,
                bookingMutation.isPending && styles.bookButtonDisabled,
              ]}
              onPress={handleBookPackage}
              disabled={bookingMutation.isPending}
            >
              {bookingMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.bookButtonText}>Book Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },
  
    screen: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },
  
    container: {
      flex: 1,
      backgroundColor: "#F8FAFC",
    },
  
    content: {
      padding: 20,
      paddingTop: 14,
      paddingBottom: 40,
    },
  
    loaderScreen: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F8FAFC",
    },
  
    loaderText: {
      marginTop: 12,
      color: "#6B7280",
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
  
    priceBadge: {
      backgroundColor: "#FFF7D6",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
  
    priceBadgeText: {
      color: "#111111",
      fontWeight: "700",
      fontSize: 12,
    },
  
    title: {
      marginTop: 18,
      fontSize: 24,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
  
    subtitle: {
      marginTop: 8,
      color: "#D1D5DB",
      fontSize: 14,
      lineHeight: 21,
    },
  
    heroPriceWrap: {
      marginTop: 18,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: 14,
    },
  
    heroPriceLabel: {
      color: "#D1D5DB",
      fontSize: 12,
    },
  
    heroPrice: {
      marginTop: 4,
      color: "#F4B400",
      fontSize: 24,
      fontWeight: "bold",
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
    },
  
    sectionHint: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 19,
      color: "#6B7280",
      marginBottom: 14,
    },
  
    serviceRow: {
      backgroundColor: "#F8FAFC",
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  
    serviceLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
  
    serviceIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: "#FFF7D6",
      justifyContent: "center",
      alignItems: "center",
    },
  
    serviceName: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111111",
    },
  
    serviceSub: {
      marginTop: 3,
      fontSize: 12,
      color: "#6B7280",
    },
  
    qtyBadge: {
      backgroundColor: "#E5E7EB",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
  
    qtyBadgeText: {
      color: "#111111",
      fontWeight: "700",
      fontSize: 12,
    },
  
    input: {
      backgroundColor: "#F3F4F6",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: "#111111",
    },
  
    notesInput: {
      minHeight: 100,
      textAlignVertical: "top",
    },
  
    scheduleBox: {
      backgroundColor: "#F8FAFC",
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
  
    scheduleTextWrap: {
      flex: 1,
    },
  
    scheduleLabel: {
      fontSize: 12,
      color: "#6B7280",
      marginBottom: 2,
    },
  
    scheduleValue: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111111",
    },
  
    previewCard: {
      marginTop: 10,
      backgroundColor: "#ECFDF5",
      borderRadius: 14,
      padding: 12,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
  
    previewText: {
      flex: 1,
      fontSize: 13,
      color: "#166534",
      lineHeight: 18,
    },
  
    previewStrong: {
      fontWeight: "bold",
    },
  
    mapWarning: {
      marginTop: 10,
      color: "#DC2626",
      fontSize: 13,
      fontWeight: "600",
    },
  
    infoCard: {
      backgroundColor: "#FFFBEB",
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      marginBottom: 18,
    },
  
    infoText: {
      flex: 1,
      color: "#92400E",
      fontSize: 13,
      lineHeight: 19,
    },
  
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      paddingHorizontal: 18,
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  
    totalLabel: {
      fontSize: 12,
      color: "#6B7280",
    },
  
    totalPrice: {
      marginTop: 2,
      fontSize: 20,
      fontWeight: "bold",
      color: "#111111",
    },
  
    bookButton: {
      backgroundColor: "#111111",
      minWidth: 140,
      height: 52,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 18,
    },
  
    bookButtonDisabled: {
      opacity: 0.7,
    },
  
    bookButtonText: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 15,
    },
  });