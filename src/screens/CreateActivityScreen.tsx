import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

const CreateActivityScreen = () => {
  const { t } = useTranslation();
  const { userInfo, getToken } = useAuth();
  const navigation = useNavigation();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('alertTitle'), '갤러리 접근 권한이 필요합니다.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    } else {
      Alert.alert(t('alertTitle'), t('imageSelectionCancelled'));
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !imageUrl) {
      Alert.alert(t('alertTitle'), t('noContentOrImage'));
      return;
    }

    setLoading(true);
    const token = await getToken();
    if (!token) {
      Alert.alert(t('alertError'), t('alertLoginFailedNoToken'));
      setLoading(false);
      return;
    }

    let finalImageUrl: string | undefined = undefined;

    try {
      if (imageUrl) {
        const formData = new FormData();
        const fileName = imageUrl.split('/').pop();
        const fileType = `image/${fileName?.split('.').pop()}`;

        formData.append('image', {
          uri: Platform.OS === 'android' ? imageUrl : imageUrl.replace('file://', ''),
          name: fileName || 'activity.jpg',
          type: fileType,
        } as any);

        const uploadResponse = await fetch(`${BACKEND_BASE_URL}/api/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('Image upload failed:', uploadResponse.status, errorData);
          Alert.alert(t('alertError'), errorData.message || t('imageUploadFailed'));
          setLoading(false);
          return;
        }
        const uploadResult = await uploadResponse.json();
        finalImageUrl = uploadResult.imageUrl;
      }

      const postResponse = await fetch(`${BACKEND_BASE_URL}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: userInfo?._id,
          userName: userInfo?.nickname || userInfo?.phoneNumber,
          avatarUrl: userInfo?.profilePicture,
          content: content.trim(),
          imageUrl: finalImageUrl,
        }),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        console.error('Failed to create post:', postResponse.status, errorData);
        Alert.alert(t('alertError'), errorData.message || t('postFailed'));
        return;
      }

      Alert.alert(t('alertSuccess'), t('postSuccess'));
      setContent('');
      setImageUrl(null);
      navigation.navigate('MainApp', { screen: 'HomeMain' });

    } catch (error: any) {
      console.error('Network error creating post or uploading image:', error);
      Alert.alert(t('alertNetworkErrorTitle'), t('alertNetworkErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>{t('createPostTitle')}</Text>

      <TouchableOpacity
        style={styles.imagePickerContainer}
        onPress={pickImage}
        disabled={loading}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Text style={styles.noImageText}>{t('selectImageButton')}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.textInputMultiline}
        placeholder={t('postContentPlaceholder')}
        placeholderTextColor="#AAAAAA"
        multiline
        value={content}
        onChangeText={setContent}
        maxLength={250}
        editable={!loading}
      />

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={handlePost}
        disabled={loading || (!content.trim() && !imageUrl)}
      >
        <Text style={styles.buttonPrimaryText}>
          {loading ? t('posting') : t('postButton')}
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator size="large" color="#6200EE" style={styles.loadingIndicator} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    paddingTop: 50,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333333',
    marginBottom: 20,
  },
  textInputMultiline: {
    width: '100%',
    height: 120,
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333333',
    textAlignVertical: 'top',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  imagePickerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#333333',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  noImageText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonPrimary: {
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
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginTop: 20,
  },
});

export default CreateActivityScreen;
