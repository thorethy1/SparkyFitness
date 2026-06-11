import React from 'react';
import { Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import DashboardScreen from '../screens/DashboardScreen';
import DiaryScreen from '../screens/DiaryScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { TabParamList } from '../types/navigation';
import type { AppleIcon } from 'react-native-bottom-tabs';
import { withErrorBoundary } from './ScreenErrorBoundary';
import CustomTabBar from './CustomTabBar';
import Icon from './Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

// Tab screens — no Go Back (tab bar provides navigation)
const SafeDashboard = withErrorBoundary(DashboardScreen, 'Dashboard');
const SafeDiary = withErrorBoundary(DiaryScreen, 'Diary');
const SafeLibrary = withErrorBoundary(LibraryScreen, 'Library');

// Native iOS Tab Navigator (iOS 26+ Liquid Glass) — NO Add tab, button is overlay
const NativeTab = createNativeBottomTabNavigator<TabParamList>();

// Fallback Tab Navigator (Android / iOS < 26)
const FallbackTab = createBottomTabNavigator<TabParamList>();

export function NativeTabsLayout({ onAddPress }: { onAddPress?: () => void }) {
  const insets = useSafeAreaInsets();
  const [accentPrimary] = useCSSVariable(['--color-accent-primary']) as [string];
  const useLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

  return (
    <View style={StyleSheet.absoluteFill}>
      <NativeTab.Navigator
        initialRouteName="Dashboard"
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

      {/* Floating Add Button Overlay — positioned above the tab bar, between Diary and Library */}
      <View
        style={[
          styles.addButtonContainer,
          { bottom: insets.bottom + 28 },
        ]}
        pointerEvents="box-none"
      >
        {useLiquidGlass ? (
          <GlassView
            glassEffectStyle="regular"
            style={styles.addButtonGlass}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add"
              onPress={onAddPress}
              activeOpacity={0.8}
              style={[styles.addButton, { backgroundColor: accentPrimary }]}
            >
              <Icon name="add" size={28} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
          </GlassView>
        ) : (
          <BlurView intensity={80} tint="dark" style={styles.addButtonGlass}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add"
              onPress={onAddPress}
              activeOpacity={0.8}
              style={[styles.addButton, { backgroundColor: accentPrimary }]}
            >
              <Icon name="add" size={28} color="#FFFFFF" weight="bold" />
            </TouchableOpacity>
          </BlurView>
        )}
      </View>
    </View>
  );
}

export function FallbackTabsLayout() {
  return (
    <FallbackTab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <FallbackTab.Screen name="Dashboard" component={SafeDashboard} />
      <FallbackTab.Screen name="Diary" component={SafeDiary} />
      <FallbackTab.Screen
        name="Add"
        component={EmptyScreen}
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

const EmptyScreen = () => null;

const styles = StyleSheet.create({
  addButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonGlass: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
