import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getServiceById } from "../../src/api/services";

export default function ServiceDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: service, isLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: () => getServiceById(Number(id)),
  });

  if (isLoading || !service) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FFC300" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {service.image ? (
          <Image source={{ uri: service.image }} style={styles.image} />
        ) : (
          <View style={styles.image} />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{service.name}</Text>

          <Text style={styles.price}>
            Rs {service.price}
            <Text style={styles.unit}> / {service.pricing_unit}</Text>
          </Text>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            router.push(
              `/create-booking?serviceId=${service.id}&mode=negotiation`
            )
          }
        >
          <Text style={styles.secondaryButtonText}>Negotiate Price</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            router.push(
              `/create-booking?serviceId=${service.id}&mode=base`
            )
          }
        >
          <Text style={styles.primaryButtonText}>Book at Base Price</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },

  image: {
    width: "100%",
    height: 280,
    backgroundColor: "#FFE066",
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111111",
  },

  price: {
    fontSize: 20,
    color: "#FFC300",
    marginTop: 8,
    fontWeight: "600",
  },

  unit: {
    fontSize: 14,
    color: "#666666",
  },

  sectionTitle: {
    marginTop: 20,
    fontWeight: "bold",
    fontSize: 16,
    color: "#111111",
  },

  description: {
    marginTop: 8,
    color: "#444444",
    lineHeight: 20,
  },

  bottomActions: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    gap: 10,
  },

  primaryButton: {
    height: 55,
    borderRadius: 18,
    backgroundColor: "#FFC300",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 16,
  },

  secondaryButton: {
    height: 55,
    borderRadius: 18,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#FFC300",
    fontWeight: "bold",
    fontSize: 16,
  },
});