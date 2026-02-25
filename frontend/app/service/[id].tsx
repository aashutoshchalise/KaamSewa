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
  import { Ionicons } from "@expo/vector-icons";
  
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
      <View style={{ flex: 1, backgroundColor: "#F8F8F8" }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Image
            source={{ uri: service.image }}
            style={styles.image}
          />
  
          <View style={styles.content}>
            <Text style={styles.title}>{service.name}</Text>
  
            <Text style={styles.price}>
              Rs {service.price}
              <Text style={styles.unit}>
                {" "}
                / {service.pricing_unit}
              </Text>
            </Text>
  
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {service.description}
            </Text>
          </View>
        </ScrollView>
  
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() =>
            router.push(`/create-booking?serviceId=${service.id}`)
          }
        >
          <Text style={styles.bookText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F8F8F8",
    },
  
    image: {
      width: "100%",
      height: 280,
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
  
    bookButton: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      height: 55,
      borderRadius: 18,
      backgroundColor: "#FFC300",
      justifyContent: "center",
      alignItems: "center",
    },
  
    bookText: {
      color: "#111111",
      fontWeight: "bold",
      fontSize: 16,
    },
  });