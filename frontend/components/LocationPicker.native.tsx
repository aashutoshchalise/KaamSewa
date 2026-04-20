import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

type Props = {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
};

export default function LocationPicker({ onLocationSelect }: Props) {
  const [marker, setMarker] = useState({
    latitude: 27.7172,
    longitude: 85.324,
  });

  const handlePress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setMarker(coords);

    onLocationSelect({
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: "Selected location",
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 27.7172,
          longitude: 85.324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={handlePress}
      >
        <Marker coordinate={marker} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    borderRadius: 16,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
});