import React from 'react';
import { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react'; // useMemo 추가
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const BACKEND_BASE_URL = 'http://192.168.0.108:3001';

interface UserInfo {
  _id: string;
  phoneNumber: string;
  nickname?: string;
  profilePicture?: string;
  interests?: string[];
  bio?: string;
  joinedHobbies?: string[];
}

interface AuthState {
  isLoading: boolean;
  isLoggedIn: boolean;
  isProfileComplete: boolean;
  userToken: string | null;
  userInfo: UserInfo | null;
  loginSuccess: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  fetchUserInfo: () => Promise<void>;
  completeProfile: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const USER_TOKEN_KEY = 'user_jwt_token';
const USER_INFO_KEY = 'user_profile_info';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(USER_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_INFO_KEY);
      setUserToken(null);
      setUserInfo(null);
      setIsProfileComplete(false);
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
    }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    const token = await SecureStore.getItemAsync(USER_TOKEN_KEY);
    if (!token) {
      setIsProfileComplete(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      if (data.user) {
        setUserInfo(data.user);
        await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(data.user));
        
        if (data.user.nickname && data.user.nickname.trim() !== '') {
          setIsProfileComplete(true);
        } else {
          setIsProfileComplete(false);
        }
      } else {
        await logout();
      }
    } catch (error) {
      console.error('[AuthContext] fetchUserInfo error:', error);
      await logout();
    }
  }, [logout]);

  const completeProfile = () => {
    setIsProfileComplete(true);
  };

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(USER_TOKEN_KEY);
        setUserToken(storedToken);
      } catch (e) {
        console.error('Failed to load token from storage', e);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrapAsync();
  }, []);

  useEffect(() => {
    if (userToken) {
      fetchUserInfo();
    } else {
      setUserInfo(null);
      setIsProfileComplete(false);
    }
  }, [userToken, fetchUserInfo]);

  const loginSuccess = useCallback(async (token: string) => {
    try {
      await SecureStore.setItemAsync(USER_TOKEN_KEY, token);
      setUserToken(token);
    } catch (error) {
      console.error('[AuthContext] Failed to save token on login:', error);
    }
  }, []);

  const getToken = useCallback(async () => {
    return userToken;
  }, [userToken]);
  
  const isLoggedIn = !!userToken;

  // ✨ FIX: useMemo를 사용하여 context value가 불필요하게 재생성되는 것을 방지합니다.
  const authState = useMemo(() => ({
    isLoading,
    isLoggedIn,
    isProfileComplete,
    userToken,
    userInfo,
    loginSuccess,
    logout,
    getToken,
    fetchUserInfo,
    completeProfile,
  }), [isLoading, isLoggedIn, isProfileComplete, userToken, userInfo, loginSuccess, logout, getToken, fetchUserInfo]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};