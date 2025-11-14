import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/Home/HomeScreen';
import MyEventsScreen from '../screens/MyEvents/MyEventsScreen';
import CreateSessionScreen from '../screens/CreateSession/CreateSessionScreen';
import SessionDetailScreen from '../screens/SessionDetail/SessionDetailScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import RateUserScreen from '../screens/RateUser/RateUserScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  MyEvents: undefined;
  Create: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  SessionDetail: { sessionId: number };
  Chat: { sessionId: number };
  RateUser: { sessionId: number; userId: string; userName: string };
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Seanslar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={28} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="MyEvents"
        component={MyEventsScreen}
        options={{
          title: 'Etkinliklerim',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-check" size={28} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Create"
        component={CreateSessionScreen}
        options={{
          title: 'Oluştur',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" size={32} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={28} color={color} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

function RootNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{
          headerShown: false,
          title: 'Ana Ekran'
        }}
      />
      <RootStack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: 'Seans Detayı' }}
      />
      <RootStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Sohbet' }}
      />
      <RootStack.Screen
        name="RateUser"
        component={RateUserScreen}
        options={{ title: 'Kullanıcıyı Değerlendir' }}
      />
    </RootStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <NavigationContainer>
      {user ? <RootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
