import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, FAB, Chip, Text, Card, Avatar, Badge } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { SportSessionWithDetails, Sport } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [sessions, setSessions] = useState<SportSessionWithDetails[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    loadSports();
    loadCities();
    loadSessions();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [selectedSport, selectedCity]);

  const loadSports = async () => {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('name');

    if (!error && data) {
      setSports(data);
    }
  };

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('sport_sessions')
      .select('city')
      .not('city', 'is', null);

    if (!error && data) {
      const uniqueCities = [...new Set(data.map(s => s.city).filter(Boolean))] as string[];
      setCities(uniqueCities.sort());
    }
  };

  const loadSessions = async () => {
    setLoading(true);

    // Get sessions that haven't started yet OR started less than 1 hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    let query = supabase
      .from('sport_sessions')
      .select(`
        *,
        creator:profiles!sport_sessions_creator_id_fkey(*),
        sport:sports(*),
        participants:session_participants(*)
      `)
      .eq('status', 'open')
      .gte('session_date', oneHourAgo.toISOString())
      .order('session_date', { ascending: true });

    if (selectedSport) {
      query = query.eq('sport_id', selectedSport);
    }

    if (selectedCity) {
      query = query.eq('city', selectedCity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading sessions:', error);
    }

    if (!error && data) {
      console.log('Loaded sessions:', data.length);
      setSessions(data as any);
    }

    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSessionCard = ({ item }: { item: SportSessionWithDetails }) => {
    const participantCount = Array.isArray(item.participants)
      ? item.participants.length
      : 0;

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.sportBadge}>
              <Avatar.Icon size={40} icon={item.sport?.icon || 'tennis'} />
              <Text style={styles.sportName}>{item.sport?.name}</Text>
            </View>
            <Badge style={styles.badge}>{participantCount}/{item.max_participants}</Badge>
          </View>

          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>
              {format(new Date(item.session_date), 'dd MMMM yyyy, HH:mm', { locale: tr })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{item.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🎯</Text>
            <Text style={styles.infoText}>
              {item.skill_level === 'beginner' && 'Başlangıç'}
              {item.skill_level === 'intermediate' && 'Orta'}
              {item.skill_level === 'advanced' && 'İleri'}
              {item.skill_level === 'any' && 'Herkes'}
            </Text>
          </View>

          <View style={styles.creatorRow}>
            <Avatar.Text
              size={24}
              label={item.creator?.full_name?.charAt(0) || 'U'}
            />
            <Text style={styles.creatorName}>{item.creator?.full_name || 'Anonim'}</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Ara..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <Text style={styles.filterTitle}>Spor:</Text>
        <FlatList
          horizontal
          data={sports}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          style={styles.chipList}
          contentContainerStyle={styles.chipContainer}
          renderItem={({ item }) => (
            <Chip
              selected={selectedSport === item.id}
              onPress={() => setSelectedSport(selectedSport === item.id ? null : item.id)}
              style={styles.chip}
            >
              {item.name}
            </Chip>
          )}
        />

        {cities.length > 0 && (
          <>
            <Text style={styles.filterTitle}>Şehir:</Text>
            <FlatList
              horizontal
              data={cities}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              style={styles.chipList}
              contentContainerStyle={styles.chipContainer}
              renderItem={({ item }) => (
                <Chip
                  selected={selectedCity === item}
                  onPress={() => setSelectedCity(selectedCity === item ? null : item)}
                  style={styles.chip}
                >
                  {item}
                </Chip>
              )}
            />
          </>
        )}
      </View>

      <FlatList
        data={filteredSessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Yükleniyor...' : 'Henüz seans yok'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingBottom: 8,
    elevation: 2,
  },
  searchBar: {
    margin: 12,
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    marginTop: 4,
    marginBottom: 4,
    color: '#666',
  },
  chipList: {
    flexGrow: 0,
  },
  chipContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  listContent: {
    padding: 12,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#6200ee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  creatorName: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
