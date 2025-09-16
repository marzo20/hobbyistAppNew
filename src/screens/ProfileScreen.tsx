import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useIsFocused } from '@react-navigation/native'; // ✨ useIsFocused, useNavigation 추가

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

interface UserInfo {
  _id: string;
  nickname?: string;
  profilePicture?: string;
}

interface Hobby {
  _id: string;
  name: string;
  category: string;
  imageUrl: string;
}

// ✨ FIX: 인터페이스를 최신 스키마에 맞게 수정
interface ActivityPost {
  _id: string;
  author: UserInfo;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

const ProfileScreen = () => {
  const { t } = useTranslation();
  const { logout, userInfo, getToken } = useAuth();
  const navigation = useNavigation(); // ✨ 네비게이션 훅 사용
  const isFocused = useIsFocused(); // ✨ 화면 포커스 감지

  const [loading, setLoading] = useState(true);
  const [joinedHobbies, setJoinedHobbies] = useState<Hobby[]>([]);
  const [myPosts, setMyPosts] = useState<ActivityPost[]>([]);

  const profileImageUri = userInfo?.profilePicture || 'https://picsum.photos/id/237/150/150';

  // ✨ REFACTOR: 데이터를 효율적으로 가져오도록 함수 수정
  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Promise.all을 사용해 참여 동호회와 내 활동을 동시에 요청
      const [hobbiesResponse, postsResponse] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/api/users/me/hobbies`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BACKEND_BASE_URL}/api/activities/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (hobbiesResponse.ok) {
        const hobbiesData = await hobbiesResponse.json();
        setJoinedHobbies(hobbiesData);
      } else {
        console.error('Failed to fetch joined hobbies');
      }

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setMyPosts(postsData);
      } else {
        console.error('Failed to fetch my posts');
      }

    } catch (error) {
      console.error('Network error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // ✨ REFACTOR: 화면에 다시 돌아올 때마다 데이터를 새로고침
  useEffect(() => {
    if (isFocused) {
      fetchProfileData();
    }
  }, [isFocused, fetchProfileData]);


  const renderInterestItem = ({ item }: { item: string }) => (
    <View style={styles.interestTag}><Text style={styles.interestText}>{item}</Text></View>
  );

  const renderJoinedHobbyItem = ({ item }: { item: Hobby }) => (
    <TouchableOpacity style={styles.joinedHobbyCard} onPress={() => navigation.navigate('HobbyDetail', { hobbyId: item._id })}>
      <Image source={{ uri: item.imageUrl }} style={styles.joinedHobbyImage} />
      <View style={styles.joinedHobbyContent}>
        <Text style={styles.joinedHobbyName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.joinedHobbyCategory}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMyPostItem = ({ item }: { item: ActivityPost }) => (
    <TouchableOpacity style={styles.myPostCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.myPostImage} />
    </TouchableOpacity>
  );
  
  // ✨ REFACTOR: 로딩 UI를 컴포넌트 최상단에서 처리
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        <Text style={styles.profileName}>{userInfo?.nickname || userInfo?.phoneNumber}</Text>
        <Text style={styles.profileBio}>{userInfo?.bio || t('profileBioDefault')}</Text>
        {/* ✨ FIX: '프로필 수정' 버튼에 onPress 기능 추가 */}
        <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editProfileButtonText}>{t('editProfileButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Interests Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('myInterests')}</Text>
        {userInfo?.interests && userInfo.interests.length > 0 ? (
          <FlatList
            data={userInfo.interests}
            renderItem={renderInterestItem}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.interestsContainer}
          />
        ) : (
          <Text style={styles.emptySectionText}>{t('noInterests')}</Text>
        )}
      </View>

      {/* Joined Hobbies Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('myHobbies')}</Text>
        {joinedHobbies.length > 0 ? (
          <FlatList
            data={joinedHobbies}
            renderItem={renderJoinedHobbyItem}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
        ) : (
          <Text style={styles.emptySectionText}>{t('noHobbiesJoined')}</Text>
        )}
      </View>

      {/* My Posts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('myPosts')}</Text>
        {myPosts.length > 0 ? (
          <FlatList
            data={myPosts}
            renderItem={renderMyPostItem}
            keyExtractor={item => item._id}
            numColumns={3}
            columnWrapperStyle={{ justifyContent: 'flex-start' }}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptySectionText}>{t('noPosts')}</Text>
        )}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutButtonContainer}>
        <Button title={t('logoutButton')} onPress={logout} color="red" />
      </View>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6200EE',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    backgroundColor: '#eee',
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileBio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  editProfileButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 5,
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginBottom: 10,
    color: '#333',
  },
  interestsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  interestTag: {
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    color: '#333',
  },
  addInterestsButton: {
    alignSelf: 'flex-start',
    marginLeft: 15,
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#F0F0F0',
  },
  addInterestsButtonText: {
    color: '#6200EE',
    fontSize: 14,
    fontWeight: 'bold',
  },
  horizontalListContainer: {
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  joinedHobbyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  joinedHobbyImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 5,
    backgroundColor: '#eee',
  },
  joinedHobbyContent: {
    alignItems: 'center',
  },
  joinedHobbyName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  joinedHobbyCategory: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  myPostsColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  myPostCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 5,
    marginBottom: 10,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginHorizontal: 3,
  },
  myPostImage: {
    width: '100%',
    height: 80,
    borderRadius: 5,
    marginBottom: 5,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  myPostContent: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginBottom: 3,
  },
  myPostTime: {
    fontSize: 10,
    color: '#888',
  },
  logoutButtonContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  emptySectionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    paddingVertical: 20,
  },
});

export default ProfileScreen;
