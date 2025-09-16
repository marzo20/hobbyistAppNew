import {React, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Platform, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001'; // Your actual IP

const CreateHobbyScreen = () => {
  const { t } = useTranslation();
  const { getToken, fetchUserInfo } = useAuth();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Access to the gallery is required to choose an image.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreateHobby = async () => {
    if (!name.trim() || !category.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill out all fields.');
      return;
    }

    setLoading(true);
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    let uploadedImageUrl = '';

    try {
      // Step 1: Upload image if one was selected
      if (imageUri) {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'hobby.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri: imageUri, name: filename, type } as any);

        const uploadResponse = await fetch(`${BACKEND_BASE_URL}/api/upload/image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message || 'Image upload failed');
        }
        uploadedImageUrl = uploadResult.imageUrl;
      }

      // Step 2: Create the hobby with the uploaded image URL
      const hobbyData = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        imageUrl: uploadedImageUrl,
      };

      const response = await fetch(`${BACKEND_BASE_URL}/api/hobbies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(hobbyData),
      });

      const newHobby = await response.json();
      if (!response.ok) {
        throw new Error(newHobby.message || 'Failed to create hobby.');
      }

      Alert.alert('Success!', 'Your new hobby has been created.');
      await fetchUserInfo(); // Refresh user data as they've now joined a new hobby
      
      // Navigate to the new hobby's detail screen
      navigation.navigate('HobbyDetail', { hobbyId: newHobby._id });

    } catch (error: any) {
      console.error('Error creating hobby:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('createHobbyTitle')}</Text>
      </View>
      <View style={styles.form}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <>
              <Ionicons name="camera" size={32} color="#666" />
              <Text style={styles.imagePickerText}>{t('addCoverImage')}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>{t('hobbyNameLabel')}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Weekend Hiking Club" />

        <Text style={styles.label}>{t('categoryLabel')}</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g., Outdoors" />

        <Text style={styles.label}>{t('descriptionLabel')}</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Describe what your hobby is about." />

        <TouchableOpacity style={styles.createButton} onPress={handleCreateHobby} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.createButtonText}>{t('createHobbyButton')}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 30, paddingBottom: 20, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  form: { padding: 20 },
  imagePicker: { height: 180, width: '100%', backgroundColor: '#EAEAEA', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  imagePreview: { width: '100%', height: '100%', borderRadius: 10 },
  imagePickerText: { marginTop: 10, color: '#666' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333333' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 20 },
  textArea: { height: 120, textAlignVertical: 'top' },
  createButton: { backgroundColor: '#6200EE', padding: 15, borderRadius: 8, alignItems: 'center' },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default CreateHobbyScreen;