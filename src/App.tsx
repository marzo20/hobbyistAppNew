import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainTabNavigator from './navigation/MainTabNavigator';
import AuthScreen from './screens/AuthScreen';
import CreateProfileScreen from './screens/CreateProfileScreen';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isLoggedIn, isProfileComplete, isLoading } = useAuth();

  // 앱 로딩 중 스플래시 화면 등 표시
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        isProfileComplete ? (
          // 로그인 + 프로필 완성 = 메인 앱
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          // 로그인 + 프로필 미완성 = 프로필 생성 강제
          <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        )
      ) : (
        // 로그인 안됨 = 인증
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;