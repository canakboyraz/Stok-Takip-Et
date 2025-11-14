import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, IconButton, Avatar, Text, Card } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { Message, Profile } from '../../types';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { RealtimeChannel } from '@supabase/supabase-js';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Props {
  route: ChatScreenRouteProp;
}

interface MessageWithProfile extends Message {
  user?: Profile;
}

export default function ChatScreen({ route }: Props) {
  const { sessionId } = route.params;
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadMessages();
    subscribeToMessages();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadMessages = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as any);
    }

    setLoading(false);
  };

  const subscribeToMessages = () => {
    console.log('Setting up realtime subscription for session:', sessionId);

    const channel = supabase
      .channel(`session_${sessionId}_messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log('New message received via realtime:', payload);

          // Load the user profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.user_id)
            .single();

          const newMsg: MessageWithProfile = {
            ...payload.new as Message,
            user: profile || undefined,
          };

          setMessages((prev) => [...prev, newMsg]);

          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    channelRef.current = channel;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      session_id: sessionId,
      user_id: currentUserId,
      content: messageContent,
    });

    if (error) {
      console.error('Error sending message:', error);
      // Optionally show an error to the user
    }
  };

  const renderMessage = ({ item }: { item: MessageWithProfile }) => {
    const isOwnMessage = item.user_id === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Avatar.Text
            size={32}
            label={item.user?.full_name?.charAt(0) || 'U'}
            style={styles.avatar}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.user?.full_name || 'Anonim'}</Text>
          )}
          <Text style={isOwnMessage ? styles.ownMessageText : styles.messageText}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwnMessage && { color: 'rgba(255, 255, 255, 0.8)' }]}>
            {format(new Date(item.created_at), 'HH:mm', { locale: tr })}
          </Text>
        </View>

        {isOwnMessage && (
          <Avatar.Text
            size={32}
            label={item.user?.full_name?.charAt(0) || 'U'}
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Yükleniyor...' : 'Henüz mesaj yok. İlk mesajı siz gönderin!'}
            </Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Mesajınızı yazın..."
          mode="outlined"
          style={styles.input}
          multiline={true}
          maxLength={500}
          right={
            newMessage.trim() ? (
              <TextInput.Icon
                icon="send"
                onPress={handleSendMessage}
              />
            ) : undefined
          }
          onSubmitEditing={handleSendMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    padding: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 12,
  },
  ownBubble: {
    backgroundColor: '#B39DDB',
  },
  otherBubble: {
    backgroundColor: 'white',
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  ownMessageText: {
    fontSize: 16,
    color: 'white',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    color: '#999',
  },
  inputContainer: {
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    backgroundColor: 'white',
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
