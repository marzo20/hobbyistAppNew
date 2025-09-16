import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

interface Hobby {
  _id: string;
  name: string;
  category: string;
  imageUrl: string;
}

interface ActivityPost {
  _id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  hobbyId: string;
}

const ProfileScreen = () => {
  const { t } = useTranslation();
  const { logout, userInfo, getToken } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [joinedHobbies, setJoinedHobbies] = useState<Hobby[]>([]);
  const [myPosts, setMyPosts] = useState<ActivityPost[]>([]);

  const profileImageUri = userInfo?.profilePicture || 'https://picsum.photos/id/237/150/150';

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
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

  useEffect(() => {
    if (isFocused) {
      fetchProfileData();
    }
  }, [isFocused, fetchProfileData]);

  const renderInterestItem = ({ item }: { item: string }) => (
    <View style={styles.interestTag}>
      <Text style={styles.interestText}>{item}</Text>
    </View>
  );

  const renderJoinedHobbyItem = ({ item }: { item: Hobby }) => (
    // ✨ FIX: 'Home'을 실제 탭 이름인 'HomeTab'으로 수정
    <TouchableOpacity 
      style={styles.joinedHobbyCard} 
      onPress={() => navigation.navigate('HomeTab', { screen: 'HobbyDetail', params: { hobbyId: item._id } })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.joinedHobbyImage} />
      <View style={styles.joinedHobbyContent}>
        <Text style={styles.joinedHobbyName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.joinedHobbyCategory} numberOfLines={1}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMyPostItem = ({ item }: { item: ActivityPost }) => (
    // ✨ FIX: 'Home'을 실제 탭 이름인 'HomeTab'으로 수정
    <TouchableOpacity 
      style={styles.myPostCard} 
      onPress={() => navigation.navigate('HomeTab', { screen: 'HobbyDetail', params: { hobbyId: item.hobbyId } })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.myPostImage} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
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
        <TouchableOpacity style={styles.editProfileButton} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editProfileButtonText}>{t('editProfileButton')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('myInterests')}</Text>
        {userInfo?.interests && userInfo.interests.length > 0 ? (
          <FlatList
            data={userInfo.interests}
            renderItem={renderInterestItem}
            keyExtractor={(item, index) => item + index}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.interestsContainer}
          />
        ) : (
          <Text style={styles.emptySectionText}>{t('noInterests')}</Text>
        )}
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('myPosts')}</Text>
        {myPosts.length > 0 ? (
          <FlatList
            data={myPosts}
            renderItem={renderMyPostItem}
            keyExtractor={item => item._id}
            numColumns={3}
            columnWrapperStyle={styles.myPostsColumnWrapper}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptySectionText}>{t('noPosts')}</Text>
        )}
      </View>

      <View style={styles.logoutButtonContainer}>
        <Button title={t('logoutButton')} onPress={logout} color="#B00020" />
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
    paddingHorizontal: 20,
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
  },
  interestTag: {
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  interestText: {
    fontSize: 14,
    color: '#333',
  },
  horizontalListContainer: {
    paddingLeft: 15,
    paddingRight: 5,
  },
  joinedHobbyCard: {
    borderRadius: 10,
    marginRight: 10,
    width: 120,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  joinedHobbyImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#eee',
  },
  joinedHobbyContent: {
    padding: 8,
  },
  joinedHobbyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  joinedHobbyCategory: {
    fontSize: 12,
    color: '#666',
  },
  myPostsColumnWrapper: {
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
  },
  myPostCard: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
  },
  myPostImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  logoutButtonContainer: {
    margin: 20,
  },
  emptySectionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    paddingVertical: 20,
  },
});

export default ProfileScreen;