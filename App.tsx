import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import RoadmapScreen from './screens/RoadmapScreen';
import BacklogScreen from './screens/BacklogScreen';
import ExamHubScreen from './screens/ExamHubScreen';
import ProfileScreen from './screens/ProfileScreen';
import SubjectDetailScreen from './screens/SubjectDetailScreen';
import AIChatScreen from './screens/AIChatScreen';
import AboutScreen from './screens/AboutScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import OfflineDataScreen from './screens/OfflineDataScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import RateUsScreen from './screens/RateUsScreen';
import AuthScreen from './screens/AuthScreen';
import { AuthProvider, useAuth } from './context/AuthContext';

import { COLORS, SHADOWS } from './lib/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'RoadmapTab') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'BacklogTab') iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          else if (route.name === 'ExamTab') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          ...SHADOWS.md,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="RoadmapTab" component={RoadmapScreen} options={{ tabBarLabel: 'Roadmap' }} />
      <Tab.Screen name="BacklogTab" component={BacklogScreen} options={{ tabBarLabel: 'Backlogs' }} />
      <Tab.Screen name="ExamTab" component={ExamHubScreen} options={{ tabBarLabel: 'Exams' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

type AppState = 'splash' | 'onboarding' | 'main';

function AppNavigator() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const { loading: authLoading, sessionMode } = useAuth();

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...FontAwesome.font,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const seen = await AsyncStorage.getItem('onboarding_seen');
      setHasSeenOnboarding(seen === 'true');
    } catch {}
  };

  const handleSplashFinish = () => {
    setAppState(hasSeenOnboarding ? 'main' : 'onboarding');
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_seen', 'true');
      setHasSeenOnboarding(true);
    } catch {}
    setAppState('main');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (appState === 'splash') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onFinish={handleSplashFinish} />
      </SafeAreaProvider>
    );
  }

  if (appState === 'onboarding') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  if (authLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Preparing session...</Text>
      </View>
    );
  }

  if (!sessionMode) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="AIChat" component={AIChatScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="About" component={AboutScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="OfflineData" component={OfflineDataScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="RateUs" component={RateUsScreen} options={{ animation: 'slide_from_right' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
