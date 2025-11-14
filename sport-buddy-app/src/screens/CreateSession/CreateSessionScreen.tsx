import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  Menu,
  Divider,
  HelperText,
} from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { Sport } from '../../types';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapPicker from '../../components/MapPicker';

export default function CreateSessionScreen() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [sessionDate, setSessionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('2');
  const [skillLevel, setSkillLevel] = useState('any');
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    loadSports();
    getCurrentLocation();
  }, []);

  const loadSports = async () => {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('name');

    if (!error && data) {
      setSports(data);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum izni verilmedi');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Get address from coordinates
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        setLocation(`${addr.street || ''}, ${addr.district || ''}, ${addr.city || ''}`);
        setCity(addr.city || '');
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedSport || !title || !location || !latitude || !longitude) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Hata', 'Oturum bulunamadı');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('sport_sessions').insert({
      creator_id: user.id,
      sport_id: selectedSport,
      title,
      description,
      location,
      city: city || null,
      latitude,
      longitude,
      session_date: sessionDate.toISOString(),
      max_participants: parseInt(maxParticipants),
      skill_level: skillLevel as any,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      Alert.alert('Başarılı', 'Seans oluşturuldu!', [
        {
          text: 'Tamam',
          onPress: () => {
            // Reset form
            setSelectedSport(null);
            setTitle('');
            setDescription('');
            setSessionDate(new Date());
            setMaxParticipants('2');
            setSkillLevel('any');
          },
        },
      ]);
    }
  };

  const selectedSportObj = sports.find((s) => s.id === selectedSport);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Spor Seç *</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.menuButton}
            >
              {selectedSportObj ? selectedSportObj.name : 'Spor Seçin'}
            </Button>
          }
        >
          {sports.map((sport) => (
            <Menu.Item
              key={sport.id}
              onPress={() => {
                setSelectedSport(sport.id);
                setMenuVisible(false);
              }}
              title={sport.name}
            />
          ))}
        </Menu>

        <TextInput
          label="Başlık *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Açıklama"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline={true}
          numberOfLines={3}
          style={styles.input}
        />

        <TextInput
          label="Konum *"
          value={location}
          onChangeText={setLocation}
          mode="outlined"
          style={styles.input}
          right={
            <TextInput.Icon
              icon="map"
              onPress={() => setMapVisible(true)}
            />
          }
        />

        <Button
          mode="outlined"
          icon="crosshairs-gps"
          onPress={getCurrentLocation}
          style={styles.gpsButton}
        >
          Mevcut Konumumu Kullan
        </Button>

        <Text style={styles.label}>Tarih ve Saat *</Text>
        <View style={styles.dateTimeRow}>
          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            {sessionDate.toLocaleDateString('tr-TR')}
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowTimePicker(true)}
            style={styles.dateButton}
          >
            {sessionDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Button>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={sessionDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setSessionDate(date);
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={sessionDate}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (date) {
                const newDate = new Date(sessionDate);
                newDate.setHours(date.getHours());
                newDate.setMinutes(date.getMinutes());
                setSessionDate(newDate);
              }
            }}
          />
        )}

        <TextInput
          label="Maksimum Katılımcı *"
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
        />

        <Text style={styles.label}>Seviye</Text>
        <SegmentedButtons
          value={skillLevel}
          onValueChange={setSkillLevel}
          buttons={[
            { value: 'beginner', label: 'Başlangıç' },
            { value: 'intermediate', label: 'Orta' },
            { value: 'advanced', label: 'İleri' },
            { value: 'any', label: 'Herkes' },
          ]}
          style={styles.segmented}
        />

        <Button
          mode="contained"
          onPress={handleCreateSession}
          loading={loading}
          disabled={loading ? true : false}
          style={styles.submitButton}
        >
          Seans Oluştur
        </Button>

        <MapPicker
          visible={mapVisible}
          onDismiss={() => setMapVisible(false)}
          onLocationSelect={(lat, lng, address, cityName) => {
            setLatitude(lat);
            setLongitude(lng);
            setLocation(address);
            setCity(cityName);
            setMapVisible(false);
          }}
          initialLatitude={latitude || undefined}
          initialLongitude={longitude || undefined}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
  },
  menuButton: {
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  segmented: {
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 6,
  },
  gpsButton: {
    marginBottom: 12,
  },
});
