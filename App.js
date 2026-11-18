import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { EspProvider, useEsp } from './src/context/EspContext';
import { StatusBadge } from './src/components/ui';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ControlScreen from './src/screens/ControlScreen';
import ArmScreen from './src/screens/ArmScreen';
import PosesScreen from './src/screens/PosesScreen';
import PoseDetailScreen from './src/screens/PoseDetailScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import DataScreen from './src/screens/DataScreen';
import AboutScreen from './src/screens/AboutScreen';
import { colors } from './src/theme';

/*
 * Navegação igual ao exercício da aula 3 (EstaLogado ? Drawer : Stack):
 *
 *   EstaLogado ? (
 *     Drawer
 *       ├─ Início  →  Tab
 *       │              ├─ Controle
 *       │              ├─ Braço
 *       │              ├─ Poses  →  Stack (Lista de poses → Detalhe da pose)
 *       │              └─ Histórico
 *       ├─ Configurações
 *       ├─ Meus dados
 *       └─ Sobre
 *   ) : (
 *     Stack
 *       ├─ Login
 *       └─ Cadastro
 *   )
 */

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: '#0b1220', primary: colors.accent, text: colors.text, border: colors.cardBorder },
};

const TAB_ICONS = { Controle: '🕹️', Braço: '🦾', Poses: '📋', Histórico: '🕘' };
const DRAWER_ICONS = { Início: '🏠', Configurações: '⚙️', 'Meus dados': '💾', Sobre: 'ℹ️' };

function HeaderStatus() {
  const { status, settings } = useEsp();
  return (
    <View style={{ marginRight: 12 }}>
      <StatusBadge status={status} demo={settings?.demo} />
    </View>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

/* Stack dentro da aba Poses: lista → detalhe (com botão voltar) */
function PosesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0b1220' } }}>
      <Stack.Screen name="ListaPoses" component={PosesScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="DetalhePose"
        component={PoseDetailScreen}
        options={({ route }) => ({ title: route.params?.pose?.name || 'Pose' })}
      />
    </Stack.Navigator>
  );
}

/* Abas inferiores */
function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // o cabeçalho vem do Drawer
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: '#0b1220', borderTopColor: colors.cardBorder },
        tabBarIcon: ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Controle" component={ControlScreen} />
      <Tab.Screen name="Braço" component={ArmScreen} />
      <Tab.Screen name="Poses" component={PosesStack} />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

/* Menu lateral (Drawer) */
function MainDrawer() {
  const { settings } = useEsp();
  if (!settings) return <Loading />;
  return (
    <Drawer.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#0b1220' },
        headerTintColor: colors.text,
        headerRight: () => <HeaderStatus />,
        drawerStyle: { backgroundColor: '#0b1220' },
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.text,
        drawerActiveBackgroundColor: 'rgba(22,168,156,0.15)',
        drawerIcon: () => <Text style={{ fontSize: 18 }}>{DRAWER_ICONS[route.name]}</Text>,
      })}
    >
      <Drawer.Screen
        name="Início"
        component={HomeTabs}
        options={({ route }) => ({ title: getFocusedRouteNameFromRoute(route) ?? 'Controle', drawerLabel: 'Início' })}
      />
      <Drawer.Screen name="Configurações" component={ConfigScreen} />
      <Drawer.Screen name="Meus dados" component={DataScreen} />
      <Drawer.Screen name="Sobre" component={AboutScreen} />
    </Drawer.Navigator>
  );
}

/* Navegação protegida: só entra no Drawer quem está logado (aula 3) */
function Root() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;

  return user ? (
    <EspProvider user={user.username} key={user.username}>
      <MainDrawer />
    </EspProvider>
  ) : (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0b1220' } }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cadastro" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <Root />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
