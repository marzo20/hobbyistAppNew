// src/navigation/MainTabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
// ⭐ View, Text 컴포넌트 임포트 추가
import { View, Text } from 'react-native'; 

// 탭 화면 컴포넌트 임포트 (현재 존재한다고 가정한 기본 화면들만)
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HobbyDetailScreen from '../screens/HobbyDetailScreen';

// ⭐ 현재 존재하지 않는 화면 임포트 제거 또는 주석 처리
import EditProfileScreen from '../screens/EditProfileScreen';
import CreateSelectionScreen from '../screens/CreateSelectionScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import CreateHobbyScreen from '../screens/CreateHobbyScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';


const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const CreateStack = createNativeStackNavigator();


// Home 탭 안에 들어갈 스택 내비게이터 정의
const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="HobbyDetail" component={HobbyDetailScreen} />
      {/* ChatRoomScreen 임포트가 없으므로 주석 처리 */}
      <HomeStack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </HomeStack.Navigator>
  );
};

// Explore 탭 안에 들어갈 스택 내비게이터 정의
const ExploreStackScreen = () => {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStack.Screen name="HobbyDetail" component={HobbyDetailScreen} />
      {/* ChatRoomScreen 임포트가 없으므로 주석 처리 */}
      <ExploreStack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </ExploreStack.Navigator>
  );
};

const CreateStackScreen = () => {
  return (
    <CreateStack.Navigator screenOptions={{ headerShown: false }}>
      <CreateStack.Screen name="CreateSelection" component={CreateSelectionScreen} />
      <CreateStack.Screen name="CreateActivity" component={CreateActivityScreen} />
      <CreateStack.Screen name="CreateHobby" component={CreateHobbyScreen} />
    </CreateStack.Navigator>
  );
};

// Profile 탭 안에 들어갈 스택 내비게이터 정의
const ProfileStackScreen = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      {/* EditProfileScreen 임포트가 없으므로 주석 처리  */}
       <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} /> 
    </ProfileStack.Navigator>
  );
};


const MainTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          shadowColor: '#333333',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          let IconComponent: any = Ionicons;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ExploreTab') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'CreateTab') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'NotificationsTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <IconComponent name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{ tabBarLabel: t('homeTab') }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStackScreen}
        options={{ tabBarLabel: t('exploreTab') }}
      />
        <Tab.Screen
        name="CreateTab"
        component={CreateStackScreen}
        options={{ tabBarLabel: t('createTab') }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ tabBarLabel: t('notificationsTab') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{ tabBarLabel: t('profileTab') }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
