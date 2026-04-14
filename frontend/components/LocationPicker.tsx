import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TextInput,
  Pressable,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

type SelectedLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

type Props = {
  onLocationSelect: (location: SelectedLocation) => void;
};

type SearchResult = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

export default function LocationPicker({ onLocationSelect }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);

  async function reverseGeocodeAndUpdate(coords: {
    latitude: number;
    longitude: number;
  }) {
    try {
      const response = await Location.reverseGeocodeAsync(coords);

      let address = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

      if (response.length > 0) {
        const place = response[0];
        const parts = [
          place.name,
          place.street,
          place.subregion,
          place.city,
          place.region,
          place.country,
        ].filter(Boolean);

        if (parts.length > 0) {
          address = parts.join(", ");
        }
      }

      setSelectedAddress(address);
      setSearch(address);

      onLocationSelect({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address,
      });
    } catch {
      const fallback = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
      setSelectedAddress(fallback);
      setSearch(fallback);

      onLocationSelect({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: fallback,
      });
    }
  }

  async function goToCurrentLocation() {
    try {
      setLoadingMap(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoadingMap(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      const nextRegion: Region = {
        ...coords,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      };

      setRegion(nextRegion);
      setMarker(coords);

      requestAnimationFrame(() => {
        mapRef.current?.animateToRegion(nextRegion, 700);
      });

      await reverseGeocodeAndUpdate(coords);
    } finally {
      setLoadingMap(false);
    }
  }

  useEffect(() => {
    goToCurrentLocation();

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const q = search.trim();

    if (q.length < 2) {
      setResults([]);
      setLoadingSearch(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingSearch(true);

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=5&addressdetails=1`;

        const res = await fetch(url, {
          headers: {
            "User-Agent": "KaamSewaApp/1.0",
            Accept: "application/json",
          },
        });

        const data = await res.json();

        const mapped: SearchResult[] = (Array.isArray(data) ? data : []).map(
          (item: any, index: number) => ({
            id: `${item.lat}-${item.lon}-${index}`,
            title: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          })
        );

        setResults(mapped);
      } catch (error) {
        console.log("Location search error:", error);
        setResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 500);
  }, [search]);

  function handleSelectResult(item: SearchResult) {
    const coords = {
      latitude: item.latitude,
      longitude: item.longitude,
    };

    const nextRegion: Region = {
      ...coords,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    };

    setRegion(nextRegion);
    setMarker(coords);
    setSelectedAddress(item.title);
    setSearch(item.title);
    setResults([]);

    mapRef.current?.animateToRegion(nextRegion, 700);

    onLocationSelect({
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: item.title,
    });
  }

  if (!region) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color="#F4B400" />
        <Text style={styles.loaderText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchOverlay}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#6B7280" />
          <TextInput
            placeholder="Search address or place"
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {loadingSearch ? (
            <ActivityIndicator size="small" color="#111111" />
          ) : null}
        </View>

        {results.length > 0 && (
          <View style={styles.resultsCard}>
            {results.map((item, index) => (
              <Pressable
                key={item.id}
                style={[
                  styles.resultRow,
                  index === results.length - 1 && styles.lastResultRow,
                ]}
                onPress={() => handleSelectResult(item)}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#6B7280"
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.resultText}>{item.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <MapView
        ref={(ref) => {
          mapRef.current = ref;
        }}
        style={styles.map}
        initialRegion={region}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={async (e) => {
          const coords = e.nativeEvent.coordinate;
          setMarker(coords);
          setResults([]);
          await reverseGeocodeAndUpdate(coords);
        }}
      >
        {marker && (
          <Marker
            coordinate={marker}
            draggable
            onDragEnd={async (e) => {
              const coords = e.nativeEvent.coordinate;
              setMarker(coords);
              setResults([]);
              await reverseGeocodeAndUpdate(coords);
            }}
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.locateButton} onPress={goToCurrentLocation}>
        {loadingMap ? (
          <ActivityIndicator size="small" color="#111111" />
        ) : (
          <>
            <Ionicons name="locate-outline" size={18} color="#111111" />
            <Text style={styles.locateButtonText}>Current Location</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.bottomCard}>
        <View style={styles.dragHandle} />

        <View style={styles.bottomTop}>
          <Ionicons name="location" size={18} color="#F4B400" />
          <Text style={styles.bottomTitle}>Confirm Location</Text>
        </View>

        <Text style={styles.bottomAddress}>
          {selectedAddress || "Search for a place or tap on the map"}
        </Text>

        <Text style={styles.bottomHint}>
          Move the pin or search to adjust your exact service location.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },

  loaderWrap: {
    height: 360,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
  },

  loaderText: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 13,
  },

  searchOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
  },

  searchBox: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    height: 52,
    fontSize: 15,
    color: "#111111",
  },

  resultsCard: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    maxHeight: 220,
  },

  resultRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  lastResultRow: {
    borderBottomWidth: 0,
  },

  resultText: {
    flex: 1,
    color: "#111111",
    fontSize: 14,
    lineHeight: 20,
  },

  map: {
    width: "100%",
    height: 360,
    borderRadius: 20,
  },

  locateButton: {
    position: "absolute",
    right: 14,
    bottom: 132,
    backgroundColor: "#FFF7D6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  locateButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },

  bottomCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },

  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 10,
  },

  bottomTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  bottomTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },

  bottomAddress: {
    fontSize: 14,
    color: "#111111",
    lineHeight: 20,
    fontWeight: "500",
  },

  bottomHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },
});