import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Portal, Modal, Text } from 'react-native-paper';
import * as Location from 'expo-location';

// Only import MapView on native platforms
let MapView: any = null;
let Marker: any = null;
let Region: any = null;

if (Platform.OS !== 'web') {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapPickerProps {
  visible: boolean;
  onDismiss: () => void;
  onLocationSelect: (latitude: number, longitude: number, address: string, city: string) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

export default function MapPicker({
  visible,
  onDismiss,
  onLocationSelect,
  initialLatitude,
  initialLongitude,
}: MapPickerProps) {
  const [region, setRegion] = useState<Region>({
    latitude: initialLatitude || 41.0082,
    longitude: initialLongitude || 28.9784,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLatitude && initialLongitude ? {
    latitude: initialLatitude,
    longitude: initialLongitude,
  } : null);

  useEffect(() => {
    if (visible && !initialLatitude && !initialLongitude) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
  };

  const handleConfirm = async () => {
    if (!selectedLocation) return;

    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        const address = `${addr.street || ''}, ${addr.district || ''}, ${addr.city || ''}`;
        const city = addr.city || '';
        onLocationSelect(selectedLocation.latitude, selectedLocation.longitude, address, city);
      } else {
        onLocationSelect(selectedLocation.latitude, selectedLocation.longitude, 'Seçilen konum', '');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      onLocationSelect(selectedLocation.latitude, selectedLocation.longitude, 'Seçilen konum', '');
    }
  };

  // Web'de harita gösterme
  if (Platform.OS === 'web') {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.container}>
            <Text style={styles.title}>Konum Seç</Text>
            <Text style={styles.webMessage}>
              Harita özelliği sadece mobil cihazlarda kullanılabilir.
              Web versiyonunda GPS butonunu kullanarak konum alabilirsiniz.
            </Text>
            <Button
              mode="contained"
              onPress={onDismiss}
              style={styles.button}
            >
              Tamam
            </Button>
          </View>
        </Modal>
      </Portal>
    );
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Konum Seç</Text>
          <Text style={styles.subtitle}>Haritada bir nokta seçin</Text>

          <MapView
            style={styles.map}
            region={region}
            onPress={handleMapPress}
            onRegionChangeComplete={setRegion}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Seçilen Konum"
              />
            )}
          </MapView>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.button}
            >
              İptal
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              style={styles.button}
              disabled={!selectedLocation}
            >
              Onayla
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  container: {
    height: Platform.OS === 'web' ? 600 : '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  map: {
    flex: 1,
    minHeight: 400,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
