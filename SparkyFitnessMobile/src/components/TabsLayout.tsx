import React from 'react';
import { Platform, Pressable } from 'react-native';
import { CommonActions, useFocusEffect, useNavigation, type NavigationAction } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useCSSVariable } from 'uniwind';
import DashboardScreen from '../screens/DashboardScreen';
import DiaryScreen from '../screens/DiaryScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { TabParamList } from '../types/navigation';
import type { AppleIcon, TabRole } from 'react-native-bottom-tabs';
import { withErrorBoundary } from './ScreenErrorBoundary';
import CustomTabBar from './CustomTabBar';
import Icon from './Icon';

export const NON_ADD_TABS = ['Dashboard', 'Diary', 'Library', 'Settings'] as const;
export type NonAddTabName = typeof NON_ADD_TABS[number];
const ADD_TAB_ICON: AppleIcon = { sfSymbol: 'plus' };
const IOS_SEARCH_ROLE_MIN_VERSION = 26;
const IOS_NATIVE_HEADER_OPTIONS: NativeStackNavigationOptions = {
  headerShown: true,
  headerLargeTitle: true,
  headerTransparent: false,
  headerBlurEffect: 'systemMaterial',
  headerLargeTitleShadowVisible: false,
};

let tabsNavigation: { dispatch: (action: NavigationAction) => void; getState: () => { key?: string } } | null = null;

type TabTrackingProps = {
  rememberActiveTab: (routeName: string) => void;
  getLastActiveTab: () => NonAddTabName;
};

function getIOSMajorVersion() {
  if (Platform.OS !== 'ios') return null;

  const version = Platform.Version;
  if (typeof version === 'number') return Math.trunc(version);

  const major = Number.parseInt(version, 10);
  return Number.isFinite(major) ? major : null;
}

function supportsSeparateAddTabButton() {
  const majorVersion = getIOSMajorVersion();
  return majorVersion !== null && majorVersion >= IOS_SEARCH_ROLE_MIN_VERSION;
}

function resolveColor(value: string, fallback: string) {
  return value && value !== 'unset' ? value : fallback;
}

export function navigateToLastActiveTab(targetTab: NonAddTabName) {
  if (!tabsNavigation) return false;

  tabsNavigation.dispatch({
    ...CommonActions.navigate(targetTab),
    target: tabsNavigation.getState().key,
  });
  return true;
}

const AddRedirectScreen = ({ getLastActiveTab }: { getLastActiveTab: () => NonAddTabName }) => {
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const frame = requestAnimationFrame(() => {
        navigation.navigate(getLastActiveTab() as never);
      });

      return () => cancelAnimationFrame(frame);
    }, [getLastActiveTab, navigation]),
  );

  return null;
};

// Tab screens — no Go Back (tab bar provides navigation)
const SafeDashboard = withErrorBoundary(DashboardScreen, 'Dashboard');
const SafeDiary = withErrorBoundary(DiaryScreen, 'Diary');
const SafeLibrary = withErrorBoundary(LibraryScreen, 'Library');
const SafeSettings = withErrorBoundary(SettingsScreen, 'Settings');

// Native iOS Tab Navigator (iOS 26+ Liquid Glass)
const NativeTab = createNativeBottomTabNavigator<TabParamList>();

// Fallback Tab Navigator (Android / iOS < 26)
const FallbackTab = createBottomTabNavigator<TabParamList>();

type DashboardStackParamList = { DashboardRoot: undefined };
type DiaryStackParamList = { DiaryRoot: undefined };
type LibraryStackParamList = { LibraryRoot: undefined };
type SettingsStackParamList = { SettingsRoot: undefined };

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamList>();
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function DashboardSettingsHeaderButton() {
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      onPress={() => navigation.getParent()?.navigate('Settings' as never)}
      className="p-2 -mr-2"
    >
      <Icon name="settings" size={22} color="#007AFF" />
    </Pressable>
  );
}

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={IOS_NATIVE_HEADER_OPTIONS}>
      <DashboardStack.Screen
        name="DashboardRoot"
        component={SafeDashboard as React.ComponentType}
        options={{
          title: 'Dashboard',
          headerRight: () => <DashboardSettingsHeaderButton />,
        }}
      />
    </DashboardStack.Navigator>
  );
}

function DiaryStackScreen() {
  return (
    <DiaryStack.Navigator screenOptions={IOS_NATIVE_HEADER_OPTIONS}>
      <DiaryStack.Screen name="DiaryRoot" component={SafeDiary as React.ComponentType} options={{ title: 'Diary' }} />
    </DiaryStack.Navigator>
  );
}

function LibraryStackScreen() {
  return (
    <LibraryStack.Navigator screenOptions={IOS_NATIVE_HEADER_OPTIONS}>
      <LibraryStack.Screen name="LibraryRoot" component={SafeLibrary as React.ComponentType} options={{ title: 'Library' }} />
    </LibraryStack.Navigator>
  );
}

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={IOS_NATIVE_HEADER_OPTIONS}>
      <SettingsStack.Screen name="SettingsRoot" component={SafeSettings as React.ComponentType} options={{ title: 'Settings' }} />
    </SettingsStack.Navigator>
  );
}

export function NativeTabsLayout({
  onAddPress,
  rememberActiveTab,
  getLastActiveTab,
}: { onAddPress?: () => void } & TabTrackingProps) {
  const [primary, tabActive, tabInactive] = useCSSVariable([
    '--color-accent-primary',
    '--color-tab-active',
    '--color-tab-inactive',
  ]) as [string, string, string];
  const addTabRole: TabRole | undefined = supportsSeparateAddTabButton()
    ? 'search'
    : undefined;
  const activeTintColor = resolveColor(tabActive, resolveColor(primary, '#0A84FF'));
  const inactiveTintColor = resolveColor(tabInactive, '#8E8E93');
  const AddScreen = React.useCallback(
    () => <AddRedirectScreen getLastActiveTab={getLastActiveTab} />,
    [getLastActiveTab],
  );

  return (
    <NativeTab.Navigator
      initialRouteName="Dashboard"
      tabBarActiveTintColor={activeTintColor}
      tabBarInactiveTintColor={inactiveTintColor}
      screenListeners={({ navigation }) => {
        tabsNavigation = navigation;

        return {
          state: (event) => {
            const state = event.data?.state;
            if (!state?.routes) return;
            const route = state.routes[state.index ?? 0];
            if (route) rememberActiveTab(route.name);
          },
        };
      }}
    >
      <NativeTab.Screen 
        name="Dashboard" 
        component={DashboardStackScreen} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: () => ({ sfSymbol: 'house' } as unknown as AppleIcon),
        }}
      />
      <NativeTab.Screen 
        name="Diary" 
        component={DiaryStackScreen} 
        options={{
          tabBarLabel: 'Diary',
          tabBarIcon: () => ({ sfSymbol: 'doc.text' } as unknown as AppleIcon),
        }}
      />
      <NativeTab.Screen
        name="Add"
        component={AddScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: () => ADD_TAB_ICON,
          role: addTabRole,
          preventsDefault: true,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            onAddPress?.();
          },
        }}
      />
      <NativeTab.Screen 
        name="Library" 
        component={LibraryStackScreen} 
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: () => ({ sfSymbol: 'book' } as unknown as AppleIcon),
        }}
      />
      <NativeTab.Screen 
        name="Settings" 
        component={SettingsStackScreen} 
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: () => ({ sfSymbol: 'gearshape' } as unknown as AppleIcon),
        }}
      />
    </NativeTab.Navigator>
  );
}

export function FallbackTabsLayout({ rememberActiveTab, getLastActiveTab }: TabTrackingProps) {
  const AddScreen = React.useCallback(
    () => <AddRedirectScreen getLastActiveTab={getLastActiveTab} />,
    [getLastActiveTab],
  );

  // The AddSheet is rendered in App.tsx with proper props
  return (
    <FallbackTab.Navigator
      initialRouteName="Dashboard"
      screenListeners={({ navigation }) => {
        tabsNavigation = navigation;

        return {
          state: (event) => {
            const state = event.data?.state;
            if (!state?.routes) return;
            const route = state.routes[state.index ?? 0];
            if (route) rememberActiveTab(route.name);
          },
        };
      }}
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <FallbackTab.Screen name="Dashboard" component={SafeDashboard} />
      <FallbackTab.Screen name="Diary" component={SafeDiary} />
      <FallbackTab.Screen
        name="Add"
        component={AddScreen}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            // FAB handled in CustomTabBar
          },
        }}
      />
      <FallbackTab.Screen name="Library" component={SafeLibrary} />
      <FallbackTab.Screen name="Settings" component={SettingsScreen} />
    </FallbackTab.Navigator>
  );
}

// Main export - uses native tabs on iOS, fallback on Android
export function TabsLayout({
  onAddPress,
  rememberActiveTab,
  getLastActiveTab,
}: { onAddPress?: () => void } & TabTrackingProps) {
  if (Platform.OS === 'ios') {
    return (
      <NativeTabsLayout
        onAddPress={onAddPress}
        rememberActiveTab={rememberActiveTab}
        getLastActiveTab={getLastActiveTab}
      />
    );
  }
  return (
    <FallbackTabsLayout
      rememberActiveTab={rememberActiveTab}
      getLastActiveTab={getLastActiveTab}
    />
  );
}
