import MapView, { Marker, MapPressEvent } from "react-native-maps";
import { useState } from "react";
import { View, StyleSheet } from "react-native";

type Props = {
  onLocationSelect: (lat: number, lng: number) => void;
};

export default function MapPicker({ onLocationSelect }: Props) {
  const [marker, setMarker] = useState({
    latitude: 27.7172,
    longitude: 85.3240,
  });

  const handlePress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
    onLocationSelect(latitude, longitude);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 27.7172,
          longitude: 85.3240,
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