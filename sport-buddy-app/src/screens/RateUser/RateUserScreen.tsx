import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type RateUserScreenRouteProp = RouteProp<RootStackParamList, 'RateUser'>;
type RateUserScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RateUser'>;

interface Props {
  route: RateUserScreenRouteProp;
  navigation: RateUserScreenNavigationProp;
}

export default function RateUserScreen({ route, navigation }: Props) {
  const { sessionId, userId, userName } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Hata', 'Lütfen bir puan seçin');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Hata', 'Oturum bulunamadı');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('ratings').insert({
      session_id: sessionId,
      rated_user_id: userId,
      rater_user_id: user.id,
      rating,
      comment: comment.trim() || null,
    });

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Hata', 'Bu kullanıcıyı bu seans için zaten değerlendirdiniz');
      } else {
        Alert.alert('Hata', error.message);
      }
    } else {
      Alert.alert('Başarılı', 'Değerlendirmeniz kaydedildi', [
        {
          text: 'Tamam',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={48}
            color={star <= rating ? '#FFD700' : '#ccc'}
            onPress={() => setRating(star)}
            style={styles.star}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Text
              size={64}
              label={userName?.charAt(0) || 'U'}
            />
            <Text style={styles.userName}>{userName || 'Kullanıcı'}</Text>
          </View>

          <Text style={styles.label}>Puanınız:</Text>
          {renderStars()}

          <Text style={styles.ratingText}>
            {rating === 0 && 'Puan seçin'}
            {rating === 1 && '⭐ Çok Kötü'}
            {rating === 2 && '⭐⭐ Kötü'}
            {rating === 3 && '⭐⭐⭐ Orta'}
            {rating === 4 && '⭐⭐⭐⭐ İyi'}
            {rating === 5 && '⭐⭐⭐⭐⭐ Mükemmel'}
          </Text>

          <Text style={styles.label}>Yorumunuz (Opsiyonel):</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            mode="outlined"
            multiline={true}
            numberOfLines={4}
            placeholder="Bu kullanıcı hakkında düşüncelerinizi paylaşın..."
            style={styles.input}
            maxLength={500}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || rating === 0}
            style={styles.submitButton}
          >
            Değerlendirmeyi Gönder
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  star: {
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    fontWeight: '500',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  submitButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
});
