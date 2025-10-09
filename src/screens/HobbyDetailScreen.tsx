import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Platform, FlatList, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

interface Hobby {
  _id: string;
  name: string;
  category: string;
  description: string;
  members: number;
  imageUrl: string;
  location: { type: string; coordinates: number[]; };
  creator: UserInfo;
}

interface UserInfo {
  _id:string;
  nickname?: string;
  profilePicture?: string;
  phoneNumber?: string;
  joinedHobbies?: string[];
}

interface ActivityPost {
  _id: string;
  author: UserInfo;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

const HobbyDetailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userInfo, getToken, fetchUserInfo } = useAuth();
  const isFocused = useIsFocused();
  
  const [hobby, setHobby] = useState<Hobby | null>(null);
  const [activities, setActivities] = useState<ActivityPost[]>([]);
  const [members, setMembers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const { hobbyId } = route.params as { hobbyId: string };

  const fetchHobbyDetails = useCallback(async () => {
    if (!hobbyId) {
      Alert.alert(t('alertError'), t('hobbyNotFound'));
      navigation.goBack();
      return;
    }

    setLoading(true);
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [hobbyResponse, activitiesResponse, membersResponse] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/hobbies/${hobbyId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BACKEND_BASE_URL}/api/hobbies/${hobbyId}/activities`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BACKEND_BASE_URL}/api/hobbies/${hobbyId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const hobbyData = await hobbyResponse.json();
      const activitiesData = await activitiesResponse.json();
      const membersData = await membersResponse.json();

      if (!hobbyResponse.ok || !hobbyData) {
        Alert.alert(t('alertError'), hobbyData.message || t('hobbyNotFound'));
        navigation.goBack();
        return;
      }

      setHobby(hobbyData);
      setActivities(activitiesResponse.ok ? activitiesData : []);
      setMembers(membersResponse.ok ? membersData : []);

      if (userInfo?.joinedHobbies?.map(id => id.toString()).includes(hobbyData._id.toString())) {
        setHasJoined(true);
      } else {
        setHasJoined(false);
      }

    } catch (error) {
      console.error('Network error fetching hobby details:', error);
      Alert.alert(t('alertNetworkErrorTitle'), t('alertNetworkErrorMessage'));
    } finally {
      setLoading(false);
    }
    // ✨ FIX: useCallback의 의존성 배열을 안정적인 값들로 재구성하여 무한 루프를 방지합니다.
  }, [hobbyId, getToken, userInfo?.joinedHobbies]);

  useEffect(() => {
    if (isFocused) {
      fetchHobbyDetails();
    }
  }, [isFocused, fetchHobbyDetails]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    const token = await getToken();
    if (!token) {
      setIsPosting(false);
      return;
    }
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/activities/${hobbyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newPostContent.trim() }),
      });
      const newPost = await response.json();
      if (!response.ok) {
        throw new Error(newPost.message || 'Failed to create post.');
      }
      setActivities(prevActivities => [newPost, ...prevActivities]);
      setNewPostContent('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleJoinHobby = useCallback(async () => {
    if (!hobbyId || !userInfo) {
      Alert.alert(t('alertError'), t('alertLoginFailedNoToken'));
      return;
    }

    setLoading(true);
    const token = await getToken();

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/hobbies/${hobbyId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: userInfo._id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('joinHobbyFailed'));
      }
      
      Alert.alert(t('alertSuccess'), t('joinedHobby'));
      await fetchUserInfo();

    } catch (error: any) {
      console.error('Network error joining hobby:', error);
      Alert.alert(t('alertError'), error.message);
    } finally {
      setLoading(false);
    }
  }, [hobbyId, userInfo, getToken, fetchUserInfo]);


  const renderMemberItem = ({ item }: { item: UserInfo }) => (
    <View style={styles.memberCard}>
      <Image 
        source={item.profilePicture ? { uri: item.profilePicture } : require('../../assets/adaptive-icon.png')} 
        style={styles.memberAvatar} 
      />
      <Text style={styles.memberName} numberOfLines={1}>{item.nickname}</Text>
    </View>
  );

  const renderActivityItem = ({ item }: { item: ActivityPost }) => (
    <View style={styles.activityItem}>
      <Image 
        source={item.author.profilePicture ? { uri: item.author.profilePicture } : require('../../assets/adaptive-icon.png')} 
        style={styles.activityAvatar} 
      />
      <View style={styles.activityContent}>
        <Text style={styles.activityUserName}>{item.author.nickname}</Text>
        <Text style={styles.activityText} numberOfLines={2}>{item.content}</Text>
        <Text style={styles.activityTime}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </View>
  );

  if (loading || !hobby) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Image source={{ uri: hobby.imageUrl }} style={styles.headerImage} />

        <View style={styles.detailsSection}>
          <Text style={styles.hobbyName}>{hobby.name}</Text>
          <Text style={styles.hobbyCategory}>{hobby.category}</Text>

          {hobby.creator && (
            <View style={styles.creatorRow}>
              <Image
                source={
                  hobby.creator.profilePicture
                    ? { uri: hobby.creator.profilePicture }
                    : require('../../assets/adaptive-icon.png')
                }
                style={styles.creatorAvatar}
              />
              <Text style={styles.creatorText}>
                <Text style={styles.creatorNickname}>{hobby.creator.nickname}</Text>
                <Text> {t('님이 만든 모임')}</Text>
              </Text>
            </View>
          )}

          <View style={styles.detailsRow}>
            <Ionicons name="people" size={20} color="#666666" style={styles.detailsIcon} />
            <Text style={styles.detailsText}>{t('membersCount', { count: hobby.members })}</Text>
          </View>
          <Text style={styles.descriptionText}>{hobby.description}</Text>

          <View style={styles.detailsRow}>
            <Ionicons name="location-outline" size={20} color="#666666" style={styles.detailsIcon} />
            <Text style={styles.detailsText}>{hobby.location ? 'Location available' : 'Location not available'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.joinButton, hasJoined && styles.joinButtonJoined]}
            onPress={handleJoinHobby}
            disabled={hasJoined || loading}
          >
            <Text style={styles.joinButtonText}>
              {loading ? t('joiningHobby') : (hasJoined ? t('joinedHobby') : t('joinHobby'))}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('membersTitle')}</Text>
          {members.length > 0 ? (
            <FlatList
              data={members}
              renderItem={renderMemberItem}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersList}
            />
          ) : (
            <Text style={styles.emptyText}>{t('noMembers')}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('activityFeedTitle')}</Text>
          
          {hasJoined && (
            <View style={styles.postInputContainer}>
              <TextInput
                style={styles.postInput}
                placeholder="Share your activity..."
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
              />
              <TouchableOpacity style={styles.postButton} onPress={handleCreatePost} disabled={isPosting}>
                {isPosting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.postButtonText}>Post</Text>}
              </TouchableOpacity>
            </View>
          )}

          {activities.length > 0 ? (
            <FlatList
              data={activities}
              renderItem={renderActivityItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.activitySeparator} />}
            />
          ) : (
            <Text style={styles.emptyText}>{t('noPosts')}</Text>
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate('ChatRoom', { hobbyId: hobby._id, hobbyName: hobby.name })}
        disabled={!hasJoined || loading}
      >
        <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 5,
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  hobbyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hobbyCategory: {
    fontSize: 16,
    color: '#6200EE',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  creatorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 10,
  },
  creatorText: {
    fontSize: 14,
  },
  creatorNickname: {
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsIcon: {
    marginRight: 10,
  },
  detailsText: {
    fontSize: 16,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  joinButtonJoined: {
    backgroundColor: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginVertical: 10,
    paddingVertical: 15,
    borderRadius: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  membersList: {
    paddingHorizontal: 10,
  },
  memberCard: {
    width: 80,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  memberName: {
    fontSize: 12,
    textAlign: 'center',
  },
  postInputContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  postInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityUserName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  activityText: {
    fontSize: 16,
  },
  activityTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  activitySeparator: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginHorizontal: 15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  chatButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#6200EE',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default HobbyDetailScreen;