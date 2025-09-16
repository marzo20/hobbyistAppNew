// src/screens/SplashScreen.tsx

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreenExpo from 'expo-splash-screen';
// useNavigation 훅은 더 이상 SplashScreen 자체에서 내비게이션을 직접 처리하지 않으므로 제거합니다.
// import { useNavigation } from '@react-navigation/native'; // ⭐ 이 줄 제거
// useAuth 훅도 AppContent에서 사용하므로 여기서는 필요 없습니다.
// import { useAuth } from '../context/AuthContext'; // ⭐ 이 줄 제거

// 네이티브 스플래시 화면을 숨기기 전까지 유지
SplashScreenExpo.preventAutoHideAsync();

const SplashScreen = () => {
  // useNavigation과 useAuth 훅 사용 코드 제거
  // const navigation = useNavigation();
  // const { isLoading, isLoggedIn } = useAuth();

  // 앱 초기화 로직 (여기서는 주로 네이티브 스플래시 숨기기)
  const hideSplashScreen = useCallback(async () => {
    try {
      // 필요한 추가적인 초기화 작업 (예: 데이터 프리로드)
      // await new Promise(resolve => setTimeout(resolve, 2000)); // 최소 2초간 Splash 유지 (선택 사항)

      // 네이티브 스플래시 화면을 숨김
      await SplashScreenExpo.hideAsync();
    } catch (e) {
      console.warn('Splash screen initialization error:', e);
      await SplashScreenExpo.hideAsync(); // 에러가 발생해도 스플래시는 숨겨야 함
    }
  }, []);

  // 컴포넌트가 마운트되면 스플래시 화면 숨기기 로직 실행
  // AppContent에서 isLoading이 false가 되면 이 SplashScreen 컴포넌트 자체가 언마운트되면서
  // 조건부 렌더링될 AuthStack 또는 MainAppStack이 나타나므로, 여기서 직접 내비게이션할 필요가 없어집니다.
  useEffect(() => {
    hideSplashScreen();
  }, [hideSplashScreen]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Hobbyist</Text>
      <ActivityIndicator size="large" color="#0000ff" />
      {/* 로딩 메시지나 애니메이션 */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // 스플래시 배경색
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
});

export default SplashScreen;
