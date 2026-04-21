import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, MapPressEvent, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
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

  const [marker, setMarker] = useState({
    latitude: 27.7172,
    longitude: 85.324,
  });

  const [region, setRegion] = useState<Region>({
    latitude: 27.7172,
    longitude: 85.324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  async function reverseGeocodeAndSelect(coords: {
    latitude: number;
    longitude: number;
  }) {
    try {
      const response = await Location.reverseGeocodeAsync(coords);

      let address = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(
        6
      )}`;

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

      setSearch(address);

      onLocationSelect({
        latitude: coords.latitude,
        longitude: coords.longitude,
        address,
      });
    } catch {
      const fallback = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(
        6
      )}`;

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
      setLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoadingLocation(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      const nextRegion: Region = {
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setMarker(coords);
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 600);

      await reverseGeocodeAndSelect(coords);
    } finally {
      setLoadingLocation(false);
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
      } catch {
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
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setMarker(coords);
    setRegion(nextRegion);
    setSearch(item.title);
    setResults([]);

    mapRef.current?.animateToRegion(nextRegion, 600);

    onLocationSelect({
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: item.title,
    });
  }

  async function handleMapPress(e: MapPressEvent) {
    const coords = e.nativeEvent.coordinate;
    setMarker(coords);
    setResults([]);
    await reverseGeocodeAndSelect(coords);
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
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          region={region}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={handleMapPress}
        >
          <Marker
            coordinate={marker}
            draggable
            onDragEnd={async (e) => {
              const coords = e.nativeEvent.coordinate;
              setMarker(coords);
              setResults([]);
              await reverseGeocodeAndSelect(coords);
            }}
          />
        </MapView>

      <Pressable style={styles.locateButton} onPress={goToCurrentLocation}>
        {loadingLocation ? (
          <ActivityIndicator size="small" color="#111111" />
        ) : (
          <>
            <Ionicons name="locate-outline" size={18} color="#111111" />
            <Text style={styles.locateButtonText}>Current Location</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginTop: 4,
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
    height: 250,
    borderRadius: 16,
  },

  locateButton: {
    position: "absolute",
    right: 14,
    bottom: 14,
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
});