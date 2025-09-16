import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    nickname: string;
    profilePicture?: string;
  };
  content: string;
  createdAt: string;
}

const ChatRoomScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userInfo, getToken } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const { hobbyId, hobbyName } = route.params as { hobbyId: string; hobbyName: string };

  const fetchMessages = useCallback(async () => {
    if (messages.length === 0) {
      setLoading(true);
    }
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // ✨ FIX: Corrected the API endpoint URL from '/hobbies/' to '/chat/'
      const response = await fetch(`${BACKEND_BASE_URL}/api/chat/${hobbyId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json(); // This will no longer fail
      if (response.ok) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [hobbyId, getToken, messages.length]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !userInfo) return;

    setIsSending(true);
    const token = await getToken();
    if (!token) {
      setIsSending(false);
      return;
    }
    
    const optimisticMessage: ChatMessage = {
      _id: Math.random().toString(),
      sender: {
        _id: userInfo._id,
        nickname: userInfo.nickname || 'You',
        profilePicture: userInfo.profilePicture,
      },
      content: messageContent.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageContent('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // ✨ FIX: Corrected the API endpoint URL from '/hobbies/' to '/chat/'
      const response = await fetch(`${BACKEND_BASE_URL}/api/chat/${hobbyId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: optimisticMessage.content }),
      });
      
      const actualMessage = await response.json(); // This will no longer fail
      if (response.ok) {
        setMessages(prev => prev.map(msg => msg._id === optimisticMessage._id ? actualMessage : msg));
      } else {
        Alert.alert('Error', actualMessage.message || 'Failed to send message.');
        setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      }
    } catch (error) {
      console.error('Network error sending message:', error);
      Alert.alert('Error', 'Failed to connect to the server.');
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    } finally {
      setIsSending(false);
    }
  };
  
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.sender._id === userInfo?._id;
    return (
      <View style={[styles.messageBubbleContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {!isMyMessage && (
          <Image 
            source={item.sender.profilePicture ? { uri: item.sender.profilePicture } : require('../../assets/adaptive-icon.png')} 
            style={styles.messageAvatar} 
          />
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}>
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.sender.nickname}</Text>
          )}
          <Text style={isMyMessage ? styles.myMessageContent : styles.otherMessageContent}>{item.content}</Text>
          <Text style={isMyMessage ? styles.myMessageTime : styles.otherMessageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    navigation.setOptions({ title: hobbyName });
  }, [hobbyName, navigation]);

  if (!userInfo || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Loading Chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.title}>{hobbyName}</Text>
        <View style={styles.placeholderRight} />
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={<Text style={styles.emptyMessagesText}>{t('noMessages')}</Text>}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder={t('sendMessagePlaceholder')}
          placeholderTextColor="#AAAAAA"
          value={messageContent}
          onChangeText={setMessageContent}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={isSending || !messageContent.trim()}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 50 : 15, paddingBottom: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333333' },
  placeholderRight: { width: 34 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6200EE' },
  messagesList: { flexGrow: 1, paddingHorizontal: 10, paddingVertical: 10 },
  messageBubbleContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, maxWidth: '85%' },
  myMessageContainer: { alignSelf: 'flex-end' },
  otherMessageContainer: { alignSelf: 'flex-start' },
  messageAvatar: { width: 30, height: 30, borderRadius: 15, marginHorizontal: 8, backgroundColor: '#DDDDDD' },
  messageBubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  myMessageBubble: { backgroundColor: '#6200EE', borderBottomRightRadius: 4 },
  otherMessageBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#EAEAEA' },
  senderName: { fontSize: 13, fontWeight: 'bold', color: '#666666', marginBottom: 4 },
  myMessageContent: { fontSize: 16, color: '#FFFFFF' },
  otherMessageContent: { fontSize: 16, color: '#333333' },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myMessageTime: { color: '#E0E0E0' },
  otherMessageTime: { color: '#AAAAAA' },
  emptyMessagesText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666666' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#DDDDDD' },
  messageInput: { flex: 1, maxHeight: 100, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, marginRight: 10, fontSize: 16, color: '#333333' },
  sendButton: { backgroundColor: '#6200EE', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});

export default ChatRoomScreen;