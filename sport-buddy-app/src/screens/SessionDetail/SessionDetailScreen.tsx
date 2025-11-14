import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  IconButton,
} from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { SportSessionWithDetails, SessionParticipant, Profile } from '../../types';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type SessionDetailScreenRouteProp = RouteProp<RootStackParamList, 'SessionDetail'>;
type SessionDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionDetail'>;

interface Props {
  route: SessionDetailScreenRouteProp;
  navigation: SessionDetailScreenNavigationProp;
}

interface ParticipantWithProfile extends SessionParticipant {
  user?: Profile;
}

export default function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<SportSessionWithDetails | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userParticipation, setUserParticipation] = useState<SessionParticipant | null>(null);

  useEffect(() => {
    loadSession();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadSession = async () => {
    setLoading(true);

    // Load session details
    const { data: sessionData, error: sessionError } = await supabase
      .from('sport_sessions')
      .select(`
        *,
        creator:profiles!sport_sessions_creator_id_fkey(*),
        sport:sports(*)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      Alert.alert('Hata', 'Seans bulunamadı');
      navigation.goBack();
      return;
    }

    setSession(sessionData as any);

    // Load participants
    const { data: participantsData } = await supabase
      .from('session_participants')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('session_id', sessionId);

    if (participantsData) {
      setParticipants(participantsData as any);

      // Check if current user is a participant
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userPart = participantsData.find((p) => p.user_id === user.id);
        setUserParticipation(userPart || null);
      }
    }

    setLoading(false);
  };

  const handleJoinRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('session_participants').insert({
      session_id: sessionId,
      user_id: user.id,
      status: 'pending',
    });

    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      Alert.alert('Başarılı', 'Katılım isteğiniz gönderildi!');
      loadSession();
    }
  };

  const handleApproveParticipant = async (participantId: number) => {
    const { error } = await supabase
      .from('session_participants')
      .update({ status: 'approved' })
      .eq('id', participantId);

    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      Alert.alert('Başarılı', 'Katılımcı onaylandı!');
      loadSession();
    }
  };

  const handleRejectParticipant = async (participantId: number) => {
    const { error } = await supabase
      .from('session_participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      Alert.alert('Başarılı', 'Katılımcı reddedildi');
      loadSession();
    }
  };

  const handleOpenChat = () => {
    navigation.navigate('Chat', { sessionId });
  };

  if (loading || !session) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  const isCreator = currentUserId === session.creator_id;
  const isApprovedParticipant = userParticipation?.status === 'approved';
  const isPendingParticipant = userParticipation?.status === 'pending';
  const canJoin = !userParticipation && !isCreator && session.status === 'open';
  const canAccessChat = isCreator || isApprovedParticipant;

  const approvedParticipants = participants.filter((p) => p.status === 'approved');
  const pendingParticipants = participants.filter((p) => p.status === 'pending');

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Icon size={60} icon={session.sport?.icon || 'tennis'} />
            <View style={styles.headerText}>
              <Text style={styles.sportName}>{session.sport?.name}</Text>
              <Chip style={styles.statusChip}>
                {session.status === 'open' && 'Açık'}
                {session.status === 'full' && 'Dolu'}
                {session.status === 'cancelled' && 'İptal'}
                {session.status === 'completed' && 'Tamamlandı'}
              </Chip>
            </View>
          </View>

          <Text style={styles.title}>{session.title}</Text>

          {session.description && (
            <Text style={styles.description}>{session.description}</Text>
          )}

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>
              {format(new Date(session.session_date), 'dd MMMM yyyy, HH:mm', { locale: tr })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{session.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👥</Text>
            <Text style={styles.infoText}>
              {approvedParticipants.length + 1}/{session.max_participants} kişi
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🎯</Text>
            <Text style={styles.infoText}>
              {session.skill_level === 'beginner' && 'Başlangıç'}
              {session.skill_level === 'intermediate' && 'Orta'}
              {session.skill_level === 'advanced' && 'İleri'}
              {session.skill_level === 'any' && 'Herkes'}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.creatorSection}>
            <Text style={styles.sectionTitle}>Organizatör</Text>
            <View style={styles.creatorRow}>
              <Avatar.Text
                size={40}
                label={session.creator?.full_name?.charAt(0) || 'U'}
              />
              <Text style={styles.creatorName}>{session.creator?.full_name || 'Anonim'}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {approvedParticipants.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Katılımcılar ({approvedParticipants.length})</Text>
            {approvedParticipants.map((participant) => (
              <View key={participant.id} style={styles.participantRow}>
                <Avatar.Text
                  size={40}
                  label={participant.user?.full_name?.charAt(0) || 'U'}
                />
                <Text style={styles.participantName}>
                  {participant.user?.full_name || 'Anonim'}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {isCreator && pendingParticipants.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              Bekleyen İstekler ({pendingParticipants.length})
            </Text>
            {pendingParticipants.map((participant) => (
              <List.Item
                key={participant.id}
                title={participant.user?.full_name || 'Anonim'}
                left={(props) => (
                  <Avatar.Text
                    {...props}
                    size={40}
                    label={participant.user?.full_name?.charAt(0) || 'U'}
                  />
                )}
                right={(props) => (
                  <View style={styles.actionButtons}>
                    <IconButton
                      icon="check"
                      iconColor="green"
                      onPress={() => handleApproveParticipant(participant.id)}
                    />
                    <IconButton
                      icon="close"
                      iconColor="red"
                      onPress={() => handleRejectParticipant(participant.id)}
                    />
                  </View>
                )}
              />
            ))}
          </Card.Content>
        </Card>
      )}

      <View style={styles.actions}>
        {canJoin && (
          <Button
            mode="contained"
            onPress={handleJoinRequest}
            style={styles.button}
          >
            Katılım İsteği Gönder
          </Button>
        )}

        {isPendingParticipant && (
          <Button mode="outlined" disabled style={styles.button}>
            İsteğiniz Beklemede
          </Button>
        )}

        {canAccessChat && (
          <Button
            mode="contained"
            onPress={handleOpenChat}
            icon="chat"
            style={styles.button}
          >
            Sohbete Git
          </Button>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  sportName: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  creatorSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorName: {
    marginLeft: 12,
    fontSize: 16,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantName: {
    marginLeft: 12,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actions: {
    padding: 12,
  },
  button: {
    marginBottom: 8,
  },
});
