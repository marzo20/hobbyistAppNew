import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Switch, ActivityIndicator, TouchableOpacity, Platform, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

// Interfaces based on your models
interface UserInfo {
  _id: string;
  nickname?: string;
  profilePicture?: string;
}

interface Hobby {
  _id: string;
  name: string;
  category: string;
  description: string;
  members: number;
  imageUrl: string;
  location?: { type: string; coordinates: number[]; }; // [longitude, latitude]
  creator: UserInfo;
}

// Helper function for distance calculation
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

const ExploreScreen = () => {
  const navigation = useNavigation();
  const { getToken } = useAuth();
  
  const [hobbies, setHobbies] = useState<Hobby[]>([]); // Full list from the server
  const [loading, setLoading] = useState(true);
  
  // States for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  
  // This would be fetched from the device's location service
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>({ latitude: 34.0522, longitude: -118.2437 }); // Example: LA

  // Fetch all hobbies from the server when the component mounts
  useEffect(() => {
    const fetchAllHobbies = async () => {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/hobbies`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if(response.ok) {
          setHobbies(data);
        }
      } catch (error) {
        console.error("Failed to fetch hobbies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllHobbies();
  }, [getToken]);

  const filteredHobbies = useMemo(() => {
    console.log('[ExploreScreen] Filtering logic is re-running...');

    return hobbies.filter(hobby => {
      const lowercasedQuery = searchQuery.toLowerCase();

      const matchesSearch = hobby.name.toLowerCase().includes(lowercasedQuery) ||
                            hobby.category.toLowerCase().includes(lowercasedQuery) ||
                            hobby.description.toLowerCase().includes(lowercasedQuery);
      
      const matchesCategory = selectedCategory === 'all' || hobby.category === selectedCategory;
      
      if (showNearbyOnly) {
        if (!userLocation || !hobby.location?.coordinates) {
          return false;
        }
        
        const distance = getDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          hobby.location.coordinates[1],
          hobby.location.coordinates[0]
        );
        return matchesSearch && matchesCategory && distance <= 10000;
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, hobbies, selectedCategory, showNearbyOnly, userLocation]);

  const renderHobbyItem = ({ item }: { item: Hobby }) => (
    // ✨ FIX: Specify the parent tab ('HomeTab') for navigation
    <TouchableOpacity 
      style={styles.hobbyCard} 
      onPress={() => navigation.navigate('HomeTab', { screen: 'HobbyDetail', params: { hobbyId: item._id } })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.hobbyImage} />
      <View style={styles.hobbyInfo}>
        <Text style={styles.hobbyName}>{item.name}</Text>
        <Text style={styles.hobbyCategory}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Hobbies</Text>
      </View>
      <View style={styles.controlsContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, category, etc."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Show Nearby (10km)</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={showNearbyOnly ? "#6200EE" : "#f4f3f4"}
            onValueChange={setShowNearbyOnly}
            value={showNearbyOnly}
          />
        </View>
      </View>
      
      <FlatList
        data={filteredHobbies}
        keyExtractor={item => item._id}
        renderItem={renderHobbyItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No hobbies found matching your criteria.</Text>}
      />
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  controlsContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
  },
  hobbyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  hobbyImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  hobbyInfo: {
    flex: 1,
  },
  hobbyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hobbyCategory: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

export default ExploreScreen;