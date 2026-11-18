import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { EspProvider, useEsp } from './src/context/EspContext';
import { StatusBadge } from './src/components/ui';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ControlScreen from './src/screens/ControlScreen';
import ArmScreen from './src/screens/ArmScreen';
import PosesScreen from './src/screens/PosesScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: '#0b1220', primary: colors.accent, text: colors.text, border: colors.cardBorder },
};

const TAB_ICONS = { Controle: '🕹️', Braço: '🦾', Poses: '📋', Histórico: '🕘', Config: '⚙️' };

function HeaderStatus() {
  const { status, settings } = useEsp();
  return (
    <View style={{ marginRight: 12 }}>
      <StatusBadge status={status} demo={settings?.demo} />
    </View>
  );
}

function MainTabs() {
  const { settings } = useEsp();
  if (!settings) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerRight: () => <HeaderStatus />,
        headerStyle: { backgroundColor: '#0b1220' },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: '#0b1220', borderTopColor: colors.cardBorder },
        tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Controle" component={ControlScreen} />
      <Tab.Screen name="Braço" component={ArmScreen} />
      <Tab.Screen name="Poses" component={PosesScreen} />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
      <Tab.Screen name="Config" component={ConfigScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }
  if (user) {
    return (
      <EspProvider user={user.username} key={user.username}>
        <MainTabs />
      </EspProvider>
    );
  }
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0b1220' } }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cadastro" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <Root />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
