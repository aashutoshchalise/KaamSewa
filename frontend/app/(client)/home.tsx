import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/store/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getServiceList } from "../../src/api/services";
import { useRouter } from "expo-router";

export default function ClientHome() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: getServiceList,
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color="#111" />
        </View>

        <Text style={styles.greeting}>Hi, {user?.username}</Text>
        <Text style={styles.sub}>
          Search and book trusted services near you
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#888" />
          <TextInput
            placeholder="Search services..."
            style={{ marginLeft: 10, flex: 1 }}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <View style={styles.banner}>
        <Text style={{ color: "#111", fontWeight: "bold" }}>
          Special Offers
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Services</Text>

        <FlatList
          data={services}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/service/${item.id}`)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} />
              ) : (
                <View style={styles.cardImage} />
              )}

              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardPrice}>
                Rs. {item.price} / {item.pricing_unit}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  header: {
    backgroundColor: "#FFC300",
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#111",
    fontWeight: "bold",
  },

  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
    marginTop: 15,
  },

  sub: {
    color: "#111",
    marginTop: 5,
  },

  searchBox: {
    marginTop: 15,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    alignItems: "center",
    height: 45,
  },

  banner: {
    height: 140,
    margin: 20,
    borderRadius: 18,
    backgroundColor: "#FFE066",
    justifyContent: "center",
    alignItems: "center",
  },

  section: {
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#111",
  },

  card: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 16,
    padding: 10,
    marginBottom: 15,
  },

  cardImage: {
    height: 80,
    borderRadius: 12,
    backgroundColor: "#FFE066",
    marginBottom: 10,
  },

  cardTitle: {
    fontWeight: "bold",
    color: "#111",
  },

  cardPrice: {
    color: "#555",
    marginTop: 4,
  },
});