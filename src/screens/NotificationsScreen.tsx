// src/screens/NotificationsScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native'; // ⭐ Alert 임포트 추가
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext'; // 인증 토큰을 위해 useAuth 임포트

// ⭐⭐ 중요: 백엔드 서버의 실제 URL로 변경하세요! ⭐⭐
const BACKEND_BASE_URL = 'http://192.168.0.108:3001'; // ⭐⭐ 당신의 실제 서버 IP와 포트로 변경하세요! ⭐⭐

// 알림 데이터 타입 정의 (나중에 백엔드 모델로 대체될 수 있습니다)
interface Notification {
  id: string;
  type: 'newMessage' | 'activityUpdate' | 'joinRequest' | 'system';
  messageKey: string; // i18n 키
  messageParams?: { [key: string]: any }; // i18n 보간을 위한 파라미터
  read: boolean;
  createdAt: string;
  avatarUrl?: string; // 알림과 관련된 사용자/동호회 아바타
  relatedItemId?: string; // 관련 게시물, 동호회 ID 등
}

// ⭐ 임시 알림 데이터 (나중에 백엔드 API로 대체될 것입니다)
const mockNotifications: Notification[] = [
  {
    id: 'notif1',
    type: 'activityUpdate',
    messageKey: 'notificationMessageNewPost',
    messageParams: { userName: '김하비' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5분 전
    avatarUrl: 'https://picsum.photos/id/100/40/40',
  },
  {
    id: 'notif2',
    type: 'joinRequest',
    messageKey: 'notificationMessageJoinRequest',
    messageParams: { userName: '이취미', hobbyName: '사진 동호회' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
    avatarUrl: 'https://picsum.photos/id/101/40/40',
  },
  {
    id: 'notif3',
    type: 'newMessage',
    messageKey: 'notificationMessageNewPost', // 임시로 재사용
    messageParams: { userName: '박활동' },
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
    avatarUrl: 'https://picsum.photos/id/102/40/40',
  },
  {
    id: 'notif4',
    type: 'system',
    messageKey: 'notificationMessageSystem',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3일 전
  },
];


const NotificationsScreen = () => {
  const { t } = useTranslation();
  const { getToken } = useAuth(); // JWT 토큰 가져오기

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ 알림 데이터 가져오는 함수 (현재는 임시 데이터 사용)
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    // 실제 백엔드 API 호출 시 토큰 필요
    // const token = await getToken();
    // if (!token) { /* ... */ }

    try {
      // ⭐ 나중에 백엔드 API (예: GET /api/notifications) 호출
      // const response = await fetch(`${BACKEND_BASE_URL}/api/notifications`, { ... });
      // const data = await response.json();
      // if (response.ok) { setNotifications(data); }

      // 현재는 임시 데이터 사용
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert(t('alertNetworkErrorTitle'), t('alertNetworkErrorMessage'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.read ? styles.notificationItemRead : styles.notificationItemUnread]}
      onPress={() => {
        // 알림 클릭 시 로직 (예: 알림 상세 화면으로 이동, 읽음 처리)
        Alert.alert(t('alertTitle'), `알림 클릭: ${t(item.messageKey, item.messageParams)}`);
        // 실제 앱에서는 여기서 API 호출하여 읽음 처리
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
      }}
    >
      {item.avatarUrl && <Image source={{ uri: item.avatarUrl }} style={styles.notificationAvatar} />}
      <View style={styles.notificationContent}>
        <Text style={styles.notificationMessage}>{t(item.messageKey, item.messageParams)}</Text>
        <Text style={styles.notificationTime}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('notificationsScreenTitle')}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" style={styles.loadingIndicator} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('noNotifications')}</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50, // SafeAreaView 고려
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20, // 하단 탭바를 위한 여백
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  notificationItemUnread: {
    backgroundColor: '#E6F0FF', // 읽지 않은 알림 배경색 (더 밝게)
  },
  notificationItemRead: {
    backgroundColor: '#fff', // 읽은 알림 배경색
  },
  notificationAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6200EE',
    position: 'absolute',
    top: 10,
    right: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});

export default NotificationsScreen;
