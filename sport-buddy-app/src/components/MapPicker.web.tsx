import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Portal, Modal, Text } from 'react-native-paper';

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
}: MapPickerProps) {
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

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  container: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  webMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
});
