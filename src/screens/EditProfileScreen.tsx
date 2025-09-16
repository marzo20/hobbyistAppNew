import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Platform, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

const EditProfileScreen = () => {
  const { t } = useTranslation();
  // ✨ FIX: useAuth에서 loginSuccess 대신 fetchUserInfo를 가져옵니다.
  const { userInfo, getToken, fetchUserInfo } = useAuth();
  const navigation = useNavigation();

  const [nickname, setNickname] = useState(userInfo?.nickname || '');
  const [bio, setBio] = useState(userInfo?.bio || '');
  const [interests, setInterests] = useState(userInfo?.interests?.join(', ') || '');
  // ✨ REFACTOR: 이미지가 없을 경우를 대비해 null로 초기화합니다.
  const [profilePicture, setProfilePicture] = useState(userInfo?.profilePicture || null);

  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
      // ✨ DEBUG: Add this log to check if the function is called
    console.log("--- 'Choose Image' button pressed! ---"); 
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // ✨ DEBUG: Log the permission status
    console.log("--- Media Library Permission Status:", status, "---");
    if (status !== 'granted') {
      Alert.alert(t('alertTitle'), '갤러리 접근 권한이 필요합니다.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      Alert.alert(t('alertError'), t('alertLoginFailedNoToken'));
      setLoading(false);
      return;
    }

    let finalProfilePictureUrl = profilePicture;

    try {
      // Step 1: Upload image if a new one was selected (URI starts with 'file://')
      if (profilePicture && profilePicture.startsWith('file://')) {
        const formData = new FormData();
        const localUri = profilePicture;
        const filename = localUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('image', { uri: localUri, name: filename, type } as any);

        const uploadResponse = await fetch(`${BACKEND_BASE_URL}/api/upload/image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          // ✨ REFACTOR: 에러를 throw하여 catch 블록에서 한번에 처리합니다.
          throw new Error(uploadResult.message || t('imageUploadFailed'));
        }
        finalProfilePictureUrl = uploadResult.imageUrl;
      }

      // Step 2: Update user profile with new data
      const updatedData = {
        nickname: nickname.trim(),
        bio: bio.trim(),
        interests: interests.split(',').map(s => s.trim()).filter(Boolean),
        profilePicture: finalProfilePictureUrl,
      };

      const response = await fetch(`${BACKEND_BASE_URL}/api/users/me`, {
        // ✨ FIX: 백엔드 API와 일치하도록 PUT 대신 PATCH를 사용합니다.
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // ✨ REFACTOR: 에러를 throw하여 catch 블록에서 한번에 처리합니다.
        throw new Error(errorData.message || t('profileUpdateFailed'));
      }

      // ✨ FIX: loginSuccess()가 아닌 fetchUserInfo()를 호출하여 앱의 전역 상태를 새로고침합니다.
      await fetchUserInfo(); 
      
      Alert.alert(t('alertSuccess'), t('profileUpdatedSuccess'));
      navigation.goBack();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(t('alertError'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>{t('editProfileScreenTitle')}</Text>

      <TouchableOpacity onPress={pickImage} disabled={loading} style={styles.profileImageContainer}>
        <Image 
          // ✨ REFACTOR: 이미지가 null일 경우 로컬 기본 이미지를 보여줍니다.
          source={profilePicture ? { uri: profilePicture } : require('../../assets/adaptive-icon.png')} 
          style={styles.profileImage} 
        />
        <Text style={styles.chooseImageText}>{t('chooseImage')}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{t('profileNickname')}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={t('nicknamePlaceholder')}
        value={nickname}
        onChangeText={setNickname}
        editable={!loading}
      />

      <Text style={styles.label}>{t('profileBio')}</Text>
      <TextInput
        style={styles.textInputMultiline}
        placeholder={t('bioPlaceholder')}
        multiline
        value={bio}
        onChangeText={setBio}
        editable={!loading}
      />

      <Text style={styles.label}>{t('myInterests')}</Text>
      <TextInput
        style={styles.textInputMultiline}
        placeholder={t('interestsPlaceholder')}
        multiline
        value={interests}
        onChangeText={setInterests}
        editable={!loading}
      />
      <Text style={styles.hintText}>{t('interestsHint')}</Text>

      <TouchableOpacity
        style={[styles.buttonPrimary, loading && { backgroundColor: '#AAAAAA' }]} // 로딩 시 버튼 비활성화 스타일
        onPress={handleSaveChanges}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonPrimaryText}>{t('saveChangesButton')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// Styles are the same as you provided
const styles = StyleSheet.create({
    container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    paddingTop: 50,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#EEEEEE',
    borderWidth: 3,
    borderColor: '#6200EE',
    marginBottom: 10,
  },
  chooseImageText: {
    color: '#6200EE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    marginTop: 10,
  },
  textInput: {
    width: '100%',
    height: 50,
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333333',
    marginBottom: 10,
  },
  textInputMultiline: {
    width: '100%',
    height: 100,
    borderColor: '#DDDDDD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333333',
    textAlignVertical: 'top',
  },
  hintText: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: '#888888',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  buttonPrimary: {
    width: '100%',
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
    marginTop: 10,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;