// src/App.tsx

import React from 'react';
import './i18n/i18n'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext'; // AuthProvider와 useAuth 훅 임포트

// 화면 컴포넌트 임포트
import SplashScreen from './screens/SplashScreen'; // SplashScreen 유지
import AuthScreen from './screens/AuthScreen';
import MainTabNavigator from './navigation/MainTabNavigator'; // 메인 탭 내비게이터

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    // AuthProvider로 전체 앱을 감싸서 인증 상태를 전역적으로 제공
    <AuthProvider>
      <AppContent /> {/* 실제 앱 콘텐츠를 렌더링할 내부 컴포넌트 */}
    </AuthProvider>
  );
};

// AuthProvider의 자식 컴포넌트로서 useAuth 훅 사용
const AppContent = () => {
  const { isLoading, isLoggedIn } = useAuth(); // AuthContext에서 상태 가져오기

  // isLoading 상태에 따라 다른 화면을 렌더링
  if (isLoading) {
    // 초기 인증 상태 로딩 중에는 SplashScreen을 보여줍니다.
    // SplashScreen 자체는 네이티브 스플래시 화면을 숨기고 초기 로딩을 기다리는 역할을 합니다.
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {/* isLoggedIn 상태에 따라 다른 내비게이션 스택을 조건부 렌더링 */}
      {isLoggedIn ? (
        // 로그인된 상태: 메인 앱 (탭 내비게이터)으로 이동
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
          {/* MainTabNavigator 내의 각 탭은 자체 스택을 가질 수 있습니다 */}
        </Stack.Navigator>
      ) : (
        // 로그인되지 않은 상태: 인증 화면 스택으로 이동
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          {/* AuthScreen 외에 회원가입 단계가 있다면 여기에 추가될 수 있습니다. */}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default App;
