import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Avatar, Button, Text, Card, Divider, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { Profile } from '../../types';

interface Rating {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  rater: Profile;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      loadRatings(user.id);
    }

    setLoading(false);
  };

  const loadRatings = async (userId: string) => {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        id,
        rating,
        comment,
        created_at,
        rater:profiles!ratings_rater_user_id_fkey(*)
      `)
      .eq('rated_user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRatings(data as any);

      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Profil bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={80}
              label={profile.full_name?.charAt(0) || 'U'}
            />
            <Text style={styles.name}>{profile.full_name || 'Anonim'}</Text>
            <Text style={styles.email}>{profile.email}</Text>

            {ratings.length > 0 && (
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {averageRating.toFixed(1)} ({ratings.length} değerlendirme)
                </Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          {profile.bio && (
            <>
              <Text style={styles.sectionTitle}>Hakkında</Text>
              <Text style={styles.bio}>{profile.bio}</Text>
              <Divider style={styles.divider} />
            </>
          )}

          {profile.phone && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telefon:</Text>
                <Text style={styles.infoValue}>{profile.phone}</Text>
              </View>
              <Divider style={styles.divider} />
            </>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Üyelik Tarihi:</Text>
            <Text style={styles.infoValue}>
              {new Date(profile.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {ratings.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
            {ratings.map((rating) => (
              <Card key={rating.id} style={styles.ratingCard} mode="outlined">
                <Card.Content>
                  <View style={styles.ratingHeader}>
                    <View style={styles.raterInfo}>
                      <Avatar.Text
                        size={32}
                        label={rating.rater?.full_name?.charAt(0) || 'U'}
                      />
                      <Text style={styles.raterName}>{rating.rater?.full_name || 'Anonim'}</Text>
                    </View>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialCommunityIcons
                          key={star}
                          name={star <= rating.rating ? 'star' : 'star-outline'}
                          size={16}
                          color={star <= rating.rating ? '#FFD700' : '#ccc'}
                        />
                      ))}
                    </View>
                  </View>
                  {rating.comment && (
                    <Text style={styles.comment}>{rating.comment}</Text>
                  )}
                  <Text style={styles.ratingDate}>
                    {new Date(rating.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Yakında', 'Profil düzenleme özelliği yakında eklenecek')}
            style={styles.button}
            icon="pencil"
          >
            Profili Düzenle
          </Button>

          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton]}
            buttonColor="#d32f2f"
            icon="logout"
          >
            Çıkış Yap
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sport Buddy v1.0.0</Text>
        <Text style={styles.footerText}>Spor arkadaşını bul!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 12,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  ratingCard: {
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  raterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  raterName: {
    fontSize: 14,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  comment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  ratingDate: {
    fontSize: 12,
    color: '#999',
  },
});
