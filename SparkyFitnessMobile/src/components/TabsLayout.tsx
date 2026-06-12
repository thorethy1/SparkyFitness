import React from 'react';
import { Platform } from 'react-native';
import { CommonActions, useFocusEffect, useNavigation, type NavigationAction } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { useCSSVariable } from 'uniwind';
import DashboardScreen from '../screens/DashboardScreen';
import DiaryScreen from '../screens/DiaryScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { TabParamList } from '../types/navigation';
import type { AppleIcon, TabRole } from 'react-native-bottom-tabs';
import { withErrorBoundary } from './ScreenErrorBoundary';
import CustomTabBar from './CustomTabBar';

const NON_ADD_TABS = ['Dashboard', 'Diary', 'Library', 'Settings'] as const;
type NonAddTabName = typeof NON_ADD_TABS[number];
const ADD_TAB_ICON: AppleIcon = { sfSymbol: 'plus' };
const IOS_SEARCH_ROLE_MIN_VERSION = 26;

let lastActiveTab: NonAddTabName = 'Dashboard';
let tabsNavigation: { dispatch: (action: NavigationAction) => void; getState: () => { key?: string } } | null = null;

function rememberActiveTab(routeName: string) {
  if ((NON_ADD_TABS as readonly string[]).includes(routeName)) {
    lastActiveTab = routeName as NonAddTabName;
  }
}

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

export function navigateToLastActiveTab() {
  if (!tabsNavigation) return false;

  tabsNavigation.dispatch({
    ...CommonActions.navigate(lastActiveTab),
    target: tabsNavigation.getState().key,
  });
  return true;
}

const AddRedirectScreen = () => {
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const frame = requestAnimationFrame(() => {
        navigation.navigate(lastActiveTab as never);
      });

      return () => cancelAnimationFrame(frame);
    }, [navigation]),
  );

  return null;
};

// Tab screens — no Go Back (tab bar provides navigation)
const SafeDashboard = withErrorBoundary(DashboardScreen, 'Dashboard');
const SafeDiary = withErrorBoundary(DiaryScreen, 'Diary');
const SafeLibrary = withErrorBoundary(LibraryScreen, 'Library');

// Native iOS Tab Navigator (iOS 26+ Liquid Glass)
const NativeTab = createNativeBottomTabNavigator<TabParamList>();

// Fallback Tab Navigator (Android / iOS < 26)
const FallbackTab = createBottomTabNavigator<TabParamList>();

export function NativeTabsLayout({ onAddPress }: { onAddPress?: () => void }) {
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

  return (
    <NativeTab.Navigator
      initialRouteName="Dashboard"
      tabBarActiveTintColor={activeTintColor}
      tabBarInactiveTintColor={inactiveTintColor}
      screenListeners={({ navigation }) => {
        tabsNavigation = navigation;

        return {
          state: (event) => {
            const state = event.data.state;
            const route = state.routes[state.index ?? 0];
            rememberActiveTab(route.name);
          },
        };
      }}
    >
      <NativeTab.Screen 
        name="Dashboard" 
        component={SafeDashboard} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: () => ({ sfSymbol: 'house' } as unknown as AppleIcon),
        }}
      />
      <NativeTab.Screen 
        name="Diary" 
        component={SafeDiary} 
        options={{
          tabBarLabel: 'Diary',
          tabBarIcon: () => ({ sfSymbol: 'doc.text' } as unknown as AppleIcon),
        }}
      />
      <NativeTab.Screen
        name="Add"
        component={AddRedirectScreen}
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
        component={SafeLibrary} 
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: () => ({ sfSymbol: 'book' } as unknown as AppleIcon),
        }}
      />
      <NativeTab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: () => ({ sfSymbol: 'gearshape' } as unknown as AppleIcon),
        }}
      />
    </NativeTab.Navigator>
  );
}

export function FallbackTabsLayout() {
  // The AddSheet is rendered in App.tsx with proper props
  return (
    <FallbackTab.Navigator
      initialRouteName="Dashboard"
      screenListeners={({ navigation }) => {
        tabsNavigation = navigation;

        return {
          state: (event) => {
            const state = event.data.state;
            const route = state.routes[state.index ?? 0];
            rememberActiveTab(route.name);
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
        component={AddRedirectScreen}
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
export function TabsLayout({ onAddPress }: { onAddPress?: () => void }) {
  if (Platform.OS === 'ios') {
    return <NativeTabsLayout onAddPress={onAddPress} />;
  }
  return <FallbackTabsLayout />;
}
