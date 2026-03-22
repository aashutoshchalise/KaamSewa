import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/store/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getServiceList } from "../../src/api/services";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";

export default function ClientHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getServiceList,
  });

  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (!search.trim()) return services;

    return services.filter((item) =>
      item.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [services, search]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#111111" />
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>Hi, {user?.username}</Text>
        <Text style={styles.sub}>
          Book trusted services, compare offers, and manage everything in one place.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            placeholder="Search services..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#6B7280"
          />
        </View>
      </View>

      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push("/(client)/bookings")}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="document-text-outline" size={20} color="#111111" />
          </View>
          <Text style={styles.quickActionTitle}>My Bookings</Text>
          <Text style={styles.quickActionText}>Track all your service requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push("/(client)/profile")}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="person-outline" size={20} color="#111111" />
          </View>
          <Text style={styles.quickActionTitle}>Profile</Text>
          <Text style={styles.quickActionText}>Update your details anytime</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.offerBanner}>
        <View style={styles.offerIconWrap}>
          <Ionicons name="sparkles-outline" size={22} color="#111111" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.offerTitle}>Quick booking made easy</Text>
          <Text style={styles.offerText}>
            Browse services, negotiate prices, and confirm bookings faster.
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Services</Text>
        <Text style={styles.sectionCount}>
          {filteredServices?.length ?? 0} available
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#F4B400" />
          <Text style={styles.loaderText}>Loading services...</Text>
        </View>
      ) : filteredServices.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="search-outline" size={40} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No services found</Text>
          <Text style={styles.emptyText}>
            Try searching with a different keyword.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnWrap}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/service/${item.id}`)}
              activeOpacity={0.9}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} />
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                </View>
              )}

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>

                <Text style={styles.cardPrice}>
                  Rs. {item.price}
                  <Text style={styles.cardUnit}> / {item.pricing_unit}</Text>
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardLink}>View Details</Text>
                  <Ionicons name="arrow-forward-outline" size={16} color="#111111" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
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

  heroCard: {
    backgroundColor: "#F4B400",
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(17,17,17,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111111",
    marginTop: 18,
  },

  sub: {
    color: "#1F2937",
    marginTop: 8,
    lineHeight: 20,
    fontSize: 14,
  },

  searchBox: {
    marginTop: 18,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 15,
    alignItems: "center",
    height: 50,
  },

  searchInput: {
    marginLeft: 10,
    flex: 1,
    color: "#111111",
    fontSize: 15,
  },

  quickActionsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },

  quickActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
  },

  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFF7D6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  quickActionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111111",
  },

  quickActionText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },

  offerBanner: {
    backgroundColor: "#111111",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 22,
  },

  offerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F4B400",
    justifyContent: "center",
    alignItems: "center",
  },

  offerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  offerText: {
    color: "#D1D5DB",
    marginTop: 6,
    lineHeight: 20,
    fontSize: 13,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#111111",
  },

  sectionCount: {
    fontSize: 13,
    color: "#6B7280",
  },

  loaderBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },

  loaderText: {
    marginTop: 12,
    color: "#6B7280",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    color: "#6B7280",
    lineHeight: 20,
  },

  columnWrap: {
    justifyContent: "space-between",
    marginBottom: 14,
  },

  card: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    borderRadius: 20,
    overflow: "hidden",
  },

  cardImage: {
    width: "100%",
    height: 110,
  },

  cardImagePlaceholder: {
    width: "100%",
    height: 110,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },

  cardBody: {
    padding: 12,
  },

  cardTitle: {
    fontWeight: "bold",
    color: "#111111",
    fontSize: 15,
  },

  cardPrice: {
    color: "#111111",
    marginTop: 6,
    fontWeight: "700",
  },

  cardUnit: {
    color: "#6B7280",
    fontWeight: "500",
    fontSize: 12,
  },

  cardFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardLink: {
    fontSize: 13,
    color: "#111111",
    fontWeight: "600",
  },
});