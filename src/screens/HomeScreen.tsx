import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

// We'll use a single UserInfo interface for both creator and author
interface UserInfo {
  _id: string;
  nickname: string;
  profilePicture?: string;
}

interface Hobby {
  _id: string;
  name: string;
  category: string;
  members: number;
  imageUrl: string;
  creator?: UserInfo; // Make it optional to reflect reality
}

interface ActivityPost {
  _id: string;
  author?: UserInfo; // Make it optional to reflect reality
  content: string;
  imageUrl?: string;
  createdAt: string;
}

const HomeScreen = () => {
  const { t } = useTranslation();
  const { userInfo, getToken } = useAuth();
  const navigation = useNavigation();
  
  const [recommendedHobbies, setRecommendedHobbies] = useState<Hobby[]>([]);
  const [nearbyHobbies, setNearbyHobbies] = useState<Hobby[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityPost[]>([]);
  
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [loadingActivityFeed, setLoadingActivityFeed] = useState(true);

  // This part is for the greeting and remains the same
  const displayUserName = userInfo?.nickname || (userInfo?.phoneNumber ? userInfo.phoneNumber.substring(userInfo.phoneNumber.length - 4) : t('greeting'));

  const fetchHobbies = useCallback(async () => {
    // ... Fetching logic remains the same ...
    const token = await getToken();
    if (!token) return;
    // Recommended
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/hobbies/recommended`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) setRecommendedHobbies(data);
    } catch (error) { console.error('Error fetching recommended:', error); } 
    finally { setLoadingRecommended(false); }
    // Nearby (using the general endpoint for now)
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/hobbies`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) setNearbyHobbies(data.slice(0, 2));
    } catch (error) { console.error('Error fetching nearby:', error); }
    finally { setLoadingNearby(false); }
  }, [getToken]);

  const fetchActivityFeed = useCallback(async () => {
    // ... Fetching logic remains the same ...
    const token = await getToken();
    if (!token) return;
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/activities`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) setActivityFeed(data);
    } catch (error) { console.error('Error fetching activities:', error); }
    finally { setLoadingActivityFeed(false); }
  }, [getToken]);

  useEffect(() => {
    fetchHobbies();
    fetchActivityFeed();
  }, [fetchHobbies, fetchActivityFeed]);

  const handleHobbyCardPress = (hobbyId: string) => {
    navigation.navigate('HobbyDetail', { hobbyId });
  };

  const renderHobbyCard = ({ item }: { item: Hobby }) => (
    <TouchableOpacity style={styles.hobbyCard} onPress={() => handleHobbyCardPress(item._id)}>
      <Image source={{ uri: item.imageUrl }} style={styles.hobbyImage} />
      <Text style={styles.hobbyName}>{item.name}</Text>
      
      {/* ✨ FIX: Use optional chaining (?.) to prevent crashes if 'creator' is undefined */}
      {item.creator && (
        <View style={styles.creatorContainer}>
          <Image 
            source={
              item.creator?.profilePicture // Check for profile picture
                ? { uri: item.creator.profilePicture } 
                : require('../assets/default-profile.png')
            } 
            style={styles.creatorAvatar} 
          />
          <Text style={styles.creatorName}>{item.creator?.nickname || 'Unknown User'}</Text>
        </View>
      )}

      <Text style={styles.hobbyCategory}>{item.category} • {item.members}명</Text>
    </TouchableOpacity>
  );

  const renderActivityItem = ({ item }: { item: ActivityPost }) => (
    <View style={styles.activityItem}>
      {/* ✨ FIX: Use optional chaining (?.) to prevent crashes if 'author' is undefined */}
      <Image 
        source={
          item.author?.profilePicture // Check for profile picture
            ? { uri: item.author.profilePicture } 
            : require('../assets/default-profile.png')
        } 
        style={styles.activityAvatar} 
      />
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.activityUserName}>{item.author?.nickname || 'Unknown User'}</Text>
          <Text> {item.content}</Text>
        </Text>
        <Text style={styles.activityTime}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </View>
  );

  // --- The rest of the component's JSX and styles remain unchanged ---
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greetingText}>{t('greeting_with_name', { name: displayUserName })}</Text>
      </View>

      {/* Recommended Hobbies Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recommendedHobbiesTitle')}</Text>
          <TouchableOpacity><Text style={styles.viewAllText}>{t('viewAll')}</Text></TouchableOpacity>
        </View>
        {loadingRecommended ? <ActivityIndicator style={styles.loadingIndicator} /> : (
          <FlatList
            horizontal
            data={recommendedHobbies}
            renderItem={renderHobbyCard}
            keyExtractor={item => item._id}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

      {/* Nearby Hobbies Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('nearbyHobbiesTitle')}</Text>
          <TouchableOpacity><Text style={styles.viewAllText}>{t('viewAll')}</Text></TouchableOpacity>
        </View>
        {loadingNearby ? <ActivityIndicator style={styles.loadingIndicator} /> : (
          <FlatList
            horizontal
            data={nearbyHobbies}
            renderItem={renderHobbyCard}
            keyExtractor={item => item._id}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

      {/* Activity Feed Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('activityFeedTitle')}</Text>
          <TouchableOpacity><Text style={styles.viewAllText}>{t('viewAll')}</Text></TouchableOpacity>
        </View>
        {loadingActivityFeed ? <ActivityIndicator style={styles.loadingIndicator} /> : (
          <FlatList
            data={activityFeed}
            renderItem={renderActivityItem}
            keyExtractor={item => item._id}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
};

// --- Styles (no changes needed) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, backgroundColor: '#FFFFFF' },
  greetingText: { fontSize: 28, fontWeight: 'bold' },
  section: { backgroundColor: '#FFFFFF', marginVertical: 10, paddingVertical: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  viewAllText: { fontSize: 16, color: '#6200EE' },
  loadingIndicator: { marginVertical: 20 },
  hobbyCard: { width: 150, borderRadius: 10, padding: 10, marginHorizontal: 5, alignItems: 'center', backgroundColor: '#FAFAFA' },
  hobbyImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  hobbyName: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  creatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  creatorAvatar: { width: 20, height: 20, borderRadius: 10, marginRight: 5 },
  creatorName: { fontSize: 12, color: '#666' },
  hobbyCategory: { fontSize: 12, color: '#666' },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  activityAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  activityContent: { flex: 1 },
  activityText: { fontSize: 16 },
  activityUserName: { fontWeight: 'bold' },
  activityTime: { fontSize: 12, color: '#666', marginTop: 2 },
});


export default HomeScreen;