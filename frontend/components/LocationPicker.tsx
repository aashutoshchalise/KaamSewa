import { StyleSheet, ActivityIndicator, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

type Props = {
  onLocationSelect: (coords: { latitude: number; longitude: number }) => void;
};

export default function LocationPicker({ onLocationSelect }: Props) {
  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      const currentMarker = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setRegion(currentRegion);
      setMarker(currentMarker);
      onLocationSelect(currentMarker);
    })();
  }, [onLocationSelect]);

  if (!region) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color="#F4B400" />
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      onPress={(e) => {
        const coords = e.nativeEvent.coordinate;
        setMarker(coords);
        onLocationSelect(coords);
      }}
    >
      {marker && (
        <Marker
          coordinate={marker}
          draggable
          onDragEnd={(e) => {
            const coords = e.nativeEvent.coordinate;
            setMarker(coords);
            onLocationSelect(coords);
          }}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },

  map: {
    width: "100%",
    height: 250,
    borderRadius: 16,
  },
});