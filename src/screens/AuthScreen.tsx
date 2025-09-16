// src/screens/AuthScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001'; // ⭐⭐ 당신의 실제 서버 IP와 포트로 변경하세요! ⭐⭐

const AuthScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { loginSuccess } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // 인증 코드를 백엔드 서버로 보내는 함수
  const sendVerificationCode = async () => {
    if (!phoneNumber.startsWith('+') || phoneNumber.length < 10) {
      Alert.alert(t('alertTitle'), t('alertMessagePhoneFormat'));
      return;
    }

    setLoading(true);
    try {
      console.log(`[클라이언트] 인증 코드 전송 요청: ${phoneNumber}`);
      const response = await fetch(`${BACKEND_BASE_URL}/api/twilio/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[클라이언트] 서버 비정상 응답:', response.status, errorText);
        Alert.alert(t('alertError'), `${t('alertVerificationFailed')}: ${errorText || t('alertUnknownError')}`);
        return;
      }

      const data = await response.json();

      if (data.status === 'pending') {
        setCodeSent(true);
        Alert.alert(t('alertCodeSent'), t('alertCodeSentMessage'));
      } else {
        Alert.alert(t('alertError'), data.error || t('alertVerificationFailed'));
        console.error('[클라이언트] 백엔드 응답 오류 (데이터):', data);
      }
    } catch (err: any) {
      console.error('🚨 [클라이언트] 네트워크 오류:', err);
      Alert.alert(t('alertNetworkErrorTitle'), t('alertNetworkErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  // 인증 코드를 백엔드 서버로 보내 확인하는 함수
  const confirmCode = async () => {
    if (!codeSent) {
      Alert.alert(t('alertTitle'), t('alertPleaseGetCodeFirst'));
      return;
    }
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert(t('alertTitle'), t('alertEnter6DigitCode'));
      return;
    }

    setLoading(true);
    try {
      console.log(`[클라이언트] 인증 코드 확인 요청: ${verificationCode}`);
      const response = await fetch(`${BACKEND_BASE_URL}/api/twilio/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, code: verificationCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[클라이언트] 서버 비정상 응답:', response.status, errorText);
        Alert.alert(t('alertVerificationFailedTitle'), `${t('alertVerificationFailed')}: ${errorText || t('alertUnknownError')}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // ⭐ 백엔드로부터 JWT 토큰을 받아서 저장합니다.
        const receivedToken = data.token; // ⭐ data.token으로 토큰을 받습니다.
        if (receivedToken) {
            await loginSuccess(receivedToken); // AuthContext에 토큰 저장
            Alert.alert(t('alertSuccess'), t('alertPhoneVerifiedSuccess'));
            navigation.replace('MainApp'); // 메인 화면으로 이동
        } else {
            // 토큰이 없으면 로그인 실패로 처리
            Alert.alert(t('alertError'), t('alertLoginFailedNoToken'));
            console.error('[클라이언트] 로그인 성공했으나 토큰이 없음:', data);
        }
      } else {
        Alert.alert(t('alertVerificationFailedTitle'), data.message || t('alertIncorrectCode'));
        console.error('[클라이언트] 백엔드 응답 오류 (데이터):', data);
      }
    } catch (err: any) {
      console.error('🚨 [클라이언트] 네트워크 오류:', err);
      Alert.alert(t('alertNetworkErrorTitle'), t('alertNetworkErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>{t('authTitle')}</Text>
        <TextInput
          placeholder={t('phoneNumberPlaceholder')}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
          editable={!codeSent && !loading}
        />

        {codeSent ? (
          <>
            <TextInput
              placeholder={t('codePlaceholder')}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
              editable={!loading}
            />
            <Button
              title={loading ? t('verifyingButton') : t('verifyCodeButton')}
              onPress={confirmCode}
              disabled={verificationCode.length !== 6 || loading}
            />
          </>
        ) : (
          <Button
            title={loading ? t('sendingButton') : t('sendCodeButton')}
            onPress={sendVerificationCode}
            disabled={!phoneNumber.startsWith('+') || phoneNumber.length < 10 || loading}
          />
        )}
        {loading && (
          <ActivityIndicator size="small" color="#6200EE" style={styles.loadingIndicator} />
        )}
         <Text style={styles.policyText}>
          {t('authPolicy')}
        </Text>
      </View>
    </View>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    width: '85%',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  loadingIndicator: {
    marginTop: 15,
  },
  policyText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
