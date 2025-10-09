import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

const CreateProfileScreen = () => {
  const { getToken, completeProfile } = useAuth();

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!nickname.trim()) {
      Alert.alert('Nickname Required', 'Please enter a nickname to continue.');
      return;
    }

    setIsSaving(true);
    const token = await getToken();

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          bio: bio.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile.');
      }
      
      Alert.alert('Welcome!', 'Your profile has been created.');

      // 프로필이 완성되었음을 AuthContext에 알립니다.
      // 이 함수가 호출되면 App.tsx의 네비게이터가 자동으로 메인 앱 화면으로 전환합니다.
      completeProfile(); 

    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="person-circle-outline" size={80} color="#6200EE" style={{ marginBottom: 20 }} />
      <Text style={styles.title}>Create Your Profile</Text>
      <Text style={styles.subtitle}>Let others know who you are!</Text>
      
      <Text style={styles.label}>Nickname *</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="Your public display name"
      />

      <Text style={styles.label}>Bio (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        placeholder="A short description about yourself and your hobbies"
        multiline
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Get Started</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { 
        flexGrow: 1, 
        justifyContent: 'center', 
        padding: 20, 
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 10,
        color: '#333',
    },
    subtitle: { 
        fontSize: 16, 
        color: '#666', 
        textAlign: 'center', 
        marginBottom: 40,
    },
    label: { 
        fontSize: 16, 
        fontWeight: '600', 
        marginBottom: 8, 
        color: '#333333',
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#DDDDDD', 
        borderRadius: 8, 
        paddingHorizontal: 15, 
        paddingVertical: 12, 
        fontSize: 16, 
        marginBottom: 20,
        backgroundColor: '#F5F5F5',
    },
    textArea: { 
        height: 100, 
        textAlignVertical: 'top',
    },
    saveButton: { 
        backgroundColor: '#6200EE', 
        padding: 15, 
        borderRadius: 8, 
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: { 
        color: '#FFFFFF', 
        fontSize: 16, 
        fontWeight: 'bold',
    },
});

export default CreateProfileScreen;