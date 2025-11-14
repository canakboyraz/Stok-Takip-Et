import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Badge, Chip, SegmentedButtons } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { SportSessionWithDetails } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type MyEventsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyEventsScreen() {
  const navigation = useNavigation<MyEventsScreenNavigationProp>();
  const [sessions, setSessions] = useState<SportSessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadMySessions();
    }
  }, [currentUserId, filter]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadMySessions = async () => {
    if (!currentUserId) return;

    setLoading(true);

    // Get sessions where user is creator or approved participant
    const { data, error } = await supabase
      .from('sport_sessions')
      .select(`
        *,
        creator:profiles!sport_sessions_creator_id_fkey(*),
        sport:sports(*),
        participants:session_participants(*)
      `)
      .or(`creator_id.eq.${currentUserId},id.in.(${await getParticipatedSessionIds()})`)
      .order('session_date', { ascending: filter === 'upcoming' });

    if (!error && data) {
      const now = new Date();
      let filteredData = data;

      if (filter === 'upcoming') {
        filteredData = data.filter(session => new Date(session.session_date) >= now);
      } else if (filter === 'past') {
        filteredData = data.filter(session => new Date(session.session_date) < now);
      }

      console.log('Loaded my sessions:', filteredData.length);
      setSessions(filteredData as any);
    }

    setLoading(false);
    setRefreshing(false);
  };

  const getParticipatedSessionIds = async () => {
    if (!currentUserId) return '';

    const { data } = await supabase
      .from('session_participants')
      .select('session_id')
      .eq('user_id', currentUserId)
      .eq('status', 'approved');

    if (data && data.length > 0) {
      return data.map(p => p.session_id).join(',');
    }
    return '0'; // Return invalid ID if no sessions
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMySessions();
  };

  const renderSessionCard = ({ item }: { item: SportSessionWithDetails }) => {
    const participantCount = Array.isArray(item.participants)
      ? item.participants.length
      : 0;
    const isCreator = item.creator_id === currentUserId;
    const isPast = new Date(item.session_date) < new Date();

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
            <View style={styles.badges}>
              {isCreator && (
                <Chip style={styles.creatorChip} textStyle={styles.chipText}>
                  Organizatör
                </Chip>
              )}
              <Badge style={styles.badge}>{participantCount}/{item.max_participants}</Badge>
            </View>
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

          {isPast && item.status === 'completed' && !isCreator && (
            <Chip style={styles.rateChip} icon="star" mode="outlined">
              Değerlendir
            </Chip>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'upcoming', label: 'Gelecek' },
            { value: 'past', label: 'Geçmiş' },
          ]}
          style={styles.segmented}
        />
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Yükleniyor...' : filter === 'upcoming' ? 'Henüz gelecek etkinliğiniz yok' : 'Geçmiş etkinlik bulunamadı'}
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
    padding: 12,
    elevation: 2,
  },
  segmented: {
    marginBottom: 0,
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
    flex: 1,
  },
  sportName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorChip: {
    backgroundColor: '#6200ee',
    height: 28,
  },
  chipText: {
    color: 'white',
    fontSize: 11,
  },
  badge: {
    backgroundColor: '#03dac6',
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
  rateChip: {
    marginTop: 12,
    alignSelf: 'flex-start',
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
    textAlign: 'center',
  },
});
