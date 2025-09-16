//  ⭐ MainAppScreen.tsx (임시로 생성)
//  src/screens/MainAppScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../context/AuthContext'; // useAuth 훅 임포트

const MainAppScreen = () => {
  const { user, logout } = useAuth(); // 인증 정보와 로그아웃 함수 가져오기

  return (
    <View style={styles.container}>
      <Text style={styles.title}>메인 앱 화면</Text>
      {user && <Text>환영합니다, {user.name || user.email || user.sub}!</Text>}
      <Text>로그인 성공!</Text>
      <Button title="로그아웃" onPress={logout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default MainAppScreen;
