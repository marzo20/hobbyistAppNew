// src/screens/ExploreScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, Image, Alert, Platform, ScrollView, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIsFocused, useNavigation } from '@react-navigation/native';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

// Hobby 데이터 타입 정의
interface Hobby {
  _id: string;
  name: string;
  category: string;
  description: string;
  members: number;
  imageUrl: string;
  location?: { type: string; coordinates: number[]; }; // [경도, 위도]
}

const ExploreScreen = () => {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHobbies, setFilteredHobbies] = useState<Hobby[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapView, setMapView] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false); // ⭐ 새로 추가: 주변 동호회만 보기 상태

  // 모든 카테고리 목록 (i18n 키 사용)
  const categories = [
    { key: 'all', label: t('allCategories') },
    { key: 'Photography', label: t('categoryPhotography') },
    { key: 'Outdoor', label: t('categoryOutdoor') },
    { key: 'Art', label: t('categoryArt') },
    { key: 'Cooking', label: t('categoryCooking') },
    { key: 'Fitness', label: t('categoryFitness') },
  ];

  // 위치 권한 요청 및 현재 위치 가져오기
  const getLocation = useCallback(async () => {
    setLocationLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError(t('locationPermissionDenied'));
      Alert.alert(t('alertTitle'), t('locationPermissionDenied'));
      setLocationLoading(false);
      setLocationPermissionGranted(false);
      return;
    }
    setLocationPermissionGranted(true);

    try {
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      console.log('[ExploreScreen] User location obtained:', location.coords);
    } catch (error) {
      console.error('[ExploreScreen] Error getting location:', error);
      setLocationError(t('gettingLocationFailed'));
      Alert.alert(t('alertError'), t('gettingLocationFailed'));
    } finally {
      setLocationLoading(false);
    }
  }, [t]);

  // 동호회/클래스 데이터 가져오는 함수
  const fetchHobbies = useCallback(async (locationCoords: Location.LocationObjectCoords | null) => {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      Alert.alert(t('alertError'), t('alertLoginFailedNoToken'));
      setLoading(false);
      return;
    }

    try {
      // 모든 동호회 가져오기
      const allHobbiesResponse = await fetch(`${BACKEND_BASE_URL}/api/hobbies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allHobbiesData = await allHobbiesResponse.json();
      if (allHobbiesResponse.ok) {
        setHobbies(allHobbiesData);
        setFilteredHobbies(allHobbiesData);
        console.log('[ExploreScreen] All hobbies fetched:', allHobbiesData);
      } else {
        console.error('Failed to fetch all hobbies:', allHobbiesData);
        Alert.alert(t('alertError'), t('alertNetworkErrorMessage'));
      }

      // 내 주변 동호회 가져오기 (userLocation이 있을 경우)
      if (locationCoords) {
        console.log('[ExploreScreen] Fetching nearby hobbies with location:', locationCoords.latitude, locationCoords.longitude);
        const nearbyUrl = `${BACKEND_BASE_URL}/api/hobbies/nearby?lat=${locationCoords.latitude}&lon=${locationCoords.longitude}&radius=10000`; // 10km 반경
        const nearbyResponse = await fetch(nearbyUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const nearbyData = await nearbyResponse.json();
        if (nearbyResponse.ok) {
          console.log('[ExploreScreen] Fetched nearby hobbies (from nearby API):', nearbyData);
          // ⭐ nearbyData를 별도의 상태로 저장하거나, hobbies에 통합하여 필터링에 사용할 수 있습니다.
          // 여기서는 hobbies 상태에 포함된 것으로 가정하고, showNearbyOnly 상태에 따라 필터링합니다.
        } else {
          console.error('Failed to fetch nearby hobbies (from nearby API):', nearbyData);
        }
      } else {
        console.log('[ExploreScreen] User location not available, skipping nearby hobbies fetch for nearby API.');
      }

    } catch (error) {
      console.error('Network error fetching hobbies:', error);
      Alert.alert(t('alertNetworkErrorTitle'), t('alertNetworkErrorMessage'));
    } finally {
      setLoading(false);
    }
  }, [getToken, t]);

  // 검색 쿼리, 카테고리, showNearbyOnly 상태가 변경될 때마다 필터링
  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const newFilteredHobbies = hobbies.filter(hobby => {
      const matchesSearch = hobby.name.toLowerCase().includes(lowercasedQuery) ||
                            hobby.category.toLowerCase().includes(lowercasedQuery) ||
                            hobby.description.toLowerCase().includes(lowercasedQuery);
      const matchesCategory = selectedCategory === 'all' || hobby.category === selectedCategory;
      
      // ⭐ 주변 동호회만 보기 필터 적용
      const isNearby = userLocation && hobby.location && 
                       getDistance(userLocation.latitude, userLocation.longitude, hobby.location.coordinates[1], hobby.location.coordinates[0]) <= 10000; // 10km 이내
      
      if (showNearbyOnly) {
        return matchesSearch && matchesCategory && isNearby;
      } else {
        return matchesSearch && matchesCategory;
      }
    });
    setFilteredHobbies(newFilteredHobbies);
    console.log('[ExploreScreen] Filtered hobbies updated:', newFilteredHobbies.length, 'items');
    newFilteredHobbies.forEach(hobby => {
      if (hobby.location) {
        console.log(`[ExploreScreen] Hobby "${hobby.name}" location: [${hobby.location.coordinates[0]}, ${hobby.location.coordinates[1]}]`);
      } else {
        console.log(`[ExploreScreen] Hobby "${hobby.name}" has NO location data.`);
      }
    });
  }, [searchQuery, hobbies, selectedCategory, showNearbyOnly, userLocation]); // ⭐ showNearbyOnly, userLocation 의존성 추가

  // 두 지점 간의 거리 계산 함수 (하버사인 공식 - 대략적인 거리)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d;
  };

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    if (!locationLoading) {
      fetchHobbies(userLocation);
    }
  }, [locationLoading, userLocation, fetchHobbies]);

  const handleHobbyCardPress = (hobbyId: string) => {
    navigation.navigate('HobbyDetail', { hobbyId });
  };

  const renderHobbyItem = ({ item }: { item: Hobby }) => (
    <TouchableOpacity style={styles.hobbyItem} onPress={() => handleHobbyCardPress(item._id)}>
      <Image source={{ uri: item.imageUrl }} style={styles.hobbyItemImage} onError={(e) => console.log('Image Load Error:', e.nativeEvent.error)} />
      <View style={styles.hobbyItemContent}>
        <Text style={styles.hobbyItemName}>{item.name}</Text>
        <Text style={styles.hobbyItemCategory}>{item.category} • {item.members}명</Text>
        <Text style={styles.hobbyItemDescription} numberOfLines={2}>{item.description}</Text>
      </View>
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>{t('join')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>{t('exploreScreenTitle')}</Text>

      <TextInput
        style={styles.searchInput}
        placeholder={t('searchPlaceholder')}
        placeholderTextColor="#AAAAAA"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* 카테고리 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterContainer}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryButton, selectedCategory === cat.key && styles.categoryButtonSelected]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={[styles.categoryButtonText, selectedCategory === cat.key && styles.categoryButtonTextSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 뷰 전환 버튼 및 주변 동호회 필터 버튼 */}
      <View style={styles.toggleButtonRow}> {/* ⭐ 새로운 컨테이너 */}
        <View style={styles.viewToggleButtonContainer}>
          <TouchableOpacity
            style={[styles.viewToggleButton, !mapView && styles.viewToggleButtonSelected]}
            onPress={() => setMapView(false)}
          >
            <Text style={[styles.viewToggleButtonText, !mapView && styles.viewToggleButtonTextSelected]}>{t('listView')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, mapView && styles.viewToggleButtonSelected]}
            onPress={() => setMapView(true)}
          >
            <Text style={[styles.viewToggleButtonText, mapView && styles.viewToggleButtonTextSelected]}>{t('mapView')}</Text>
          </TouchableOpacity>
        </View>

        {/* ⭐ 주변 동호회만 보기 토글 버튼 ⭐ */}
        {userLocation && ( // 위치 정보가 있을 때만 버튼 표시
          <TouchableOpacity
            style={[styles.nearbyToggleButton, showNearbyOnly && styles.nearbyToggleButtonSelected]}
            onPress={() => setShowNearbyOnly(prev => !prev)}
            disabled={locationLoading || locationError !== null}
          >
            <Text style={[styles.nearbyToggleButtonText, showNearbyOnly && styles.nearbyToggleButtonTextSelected]}>
              {showNearbyOnly ? t('nearbyOnly') : t('showAll')} {/* ⭐ 새로운 번역 키 */}
            </Text>
          </TouchableOpacity>
        )}
      </View>


      {loading || locationLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>
            {loading ? t('gettingHobbies') : (locationLoading ? t('gettingLocation') : '')}
          </Text>
        </View>
      ) : mapView ? (
        // 지도 뷰
        userLocation ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
          >
            {filteredHobbies.map(hobby => hobby.location && (
              <Marker
                key={hobby._id}
                coordinate={{
                  latitude: hobby.location.coordinates[1], // 위도
                  longitude: hobby.location.coordinates[0], // 경도
                }}
                title={hobby.name}
                description={hobby.category}
                onPress={() => handleHobbyCardPress(hobby._id)}
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.mapErrorContainer}>
            <Text style={styles.mapErrorText}>{locationError || t('gettingLocationFailed')}</Text>
            <TouchableOpacity onPress={getLocation} style={styles.buttonPrimary}>
              <Text style={styles.buttonPrimaryText}>{t('retryLocation')}</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        // 목록 뷰
        <FlatList
          data={filteredHobbies}
          renderItem={renderHobbyItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('noHobbiesFound')}</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 50,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333333',
  },
  searchInput: {
    height: 45,
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333333',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryFilterContainer: {
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: '#DDDDDD',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
  },
  categoryButtonSelected: {
    backgroundColor: '#6200EE',
  },
  categoryButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
  toggleButtonRow: { // ⭐ 새로운 스타일: 토글 버튼들을 위한 가로 컨테이너
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  viewToggleButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flex: 1, // 공간을 차지하도록
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewToggleButtonSelected: {
    backgroundColor: '#6200EE',
  },
  viewToggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  viewToggleButtonTextSelected: {
    color: '#FFFFFF',
  },
  nearbyToggleButton: { // ⭐ 새로운 스타일: 주변 동호회만 보기 버튼
    backgroundColor: '#DDDDDD',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10, // 뷰 전환 버튼과의 간격
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  nearbyToggleButtonSelected: {
    backgroundColor: '#03DAC6', // 강조 색상 사용
  },
  nearbyToggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  nearbyToggleButtonTextSelected: {
    color: '#FFFFFF',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6200EE',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  hobbyItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  hobbyItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#EEEEEE',
    resizeMode: 'cover',
  },
  hobbyItemContent: {
    flex: 1,
    marginRight: 10,
  },
  hobbyItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  hobbyItemCategory: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5,
  },
  hobbyItemDescription: {
    fontSize: 16,
    color: '#666666',
  },
  joinButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666666',
  },
  map: {
    width: '100%',
    height: '70%',
    minHeight: 300,
  },
  mapErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  mapErrorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonPrimary: { // 재사용을 위해 로컬에 정의 (원래 CommonStyles에 있던 것)
    backgroundColor: '#6200EE',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonPrimaryText: { // 재사용을 위해 로컬에 정의
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ExploreScreen;
