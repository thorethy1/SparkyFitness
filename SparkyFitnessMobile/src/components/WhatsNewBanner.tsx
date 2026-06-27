import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import Icon from './Icon';
import { navigationRef } from './ActiveWorkoutBar';
import LiquidGlassSurface from './LiquidGlassSurface';
import { useActiveWorkoutStore } from '../stores/activeWorkoutStore';
import {
  WHATS_NEW_CONTENT_VERSION,
  getLastSeenWhatsNewVersion,
  markWhatsNewVersionSeen,
  subscribeToWhatsNewBannerReset,
} from '../services/whatsNewBanner';

// CustomTabBar's floating Add button rises 20pt above the tab bar's top edge
// (`-mt-5`). When no workout is active, this banner is the direct sibling
// above the tab bar, so it must reserve a 20pt dead strip below its content
// or the FAB will overlap the row.
const FAB_CLEARANCE = 20;
const GLASS_HORIZONTAL_MARGIN = 20;
const GLASS_VERTICAL_GAP = 6;

function withAlpha(color: string, alpha: number): string {
  const trimmed = color.trim();
  if (trimmed === 'transparent') return trimmed;
  const hslMatch = trimmed.match(/^hsl\((.+)\)$/);
  if (hslMatch) return `hsla(${hslMatch[1]}, ${alpha})`;
  const hslaMatch = trimmed.match(/^hsla\((.+),\s*[\d.]+\)$/);
  if (hslaMatch) return `hsla(${hslaMatch[1]}, ${alpha})`;
  const hexMatch = trimmed.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const value = hexMatch[1];
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return trimmed;
}

type Phase = 'evaluating' | 'eligible' | 'dismissed' | 'ineligible';

type WhatsNewBannerProps = {
  reserveAddButtonClearance?: boolean;
  presentation?: 'legacy' | 'glass';
};

export type WhatsNewBannerState = {
  visible: boolean;
  dismiss: () => void;
  open: () => void;
};

export function useWhatsNewBannerState(): WhatsNewBannerState {
  const workoutActive = useActiveWorkoutStore(s => s.sessionId !== null);
  const [phase, setPhase] = useState<Phase>('evaluating');
  const [resetTick, setResetTick] = useState(0);
  const contentVersion = String(WHATS_NEW_CONTENT_VERSION);

  useEffect(
    () => subscribeToWhatsNewBannerReset(() => setResetTick(t => t + 1)),
    [],
  );

  useEffect(() => {
    setPhase('evaluating');
    let cancelled = false;
    void (async () => {
      const lastSeen = await getLastSeenWhatsNewVersion();
      if (cancelled) return;
      if (lastSeen === contentVersion) {
        setPhase('ineligible');
        return;
      }
      if (lastSeen?.includes('.')) {
        void markWhatsNewVersionSeen(contentVersion);
        setPhase('ineligible');
        return;
      }
      setPhase('eligible');
    })();
    return () => {
      cancelled = true;
    };
  }, [contentVersion, resetTick]);

  const visible = phase === 'eligible' && !workoutActive;
  useEffect(() => {
    if (visible) {
      void markWhatsNewVersionSeen(contentVersion);
    }
  }, [visible, contentVersion]);

  const dismiss = () => setPhase('dismissed');
  const open = () => {
    setPhase('dismissed');
    if (navigationRef.isReady()) {
      navigationRef.navigate('WhatsNew');
    }
  };

  return { visible, dismiss, open };
}

export const WhatsNewBannerContent: React.FC<
  WhatsNewBannerProps & { state: WhatsNewBannerState }
> = ({ reserveAddButtonClearance = false, presentation = 'legacy', state }) => {
  const [accentPrimary, textMuted, chrome, chromeBorder] = useCSSVariable([
    '--color-accent-primary',
    '--color-text-muted',
    '--color-chrome',
    '--color-chrome-border',
  ]) as [string, string, string, string];

  if (!state.visible) return null;

  if (presentation === 'legacy') {
    return (
      <View
        className="bg-chrome border-t border-chrome-border"
        style={{ paddingBottom: reserveAddButtonClearance ? FAB_CLEARANCE : 0 }}
      >
        <Pressable
          onPress={state.open}
          accessibilityRole="button"
          accessibilityLabel="See what's new in this update"
          className="flex-row items-center px-4 py-3"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-primary/15">
            <Icon name="whats-new" size={20} color={accentPrimary} weight="bold" />
          </View>
          <View className="flex-1 px-3">
            <Text className="text-sm font-semibold text-text-primary">
              What&apos;s new
            </Text>
            <Text numberOfLines={1} className="text-xs text-text-secondary">
              See what&apos;s improved in this update
            </Text>
          </View>
          <Pressable
            onPress={state.dismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            className="p-2"
          >
            <Icon name="close" size={20} color={textMuted} weight="bold" />
          </Pressable>
        </Pressable>
      </View>
    );
  }

  return (
    <LiquidGlassSurface
      style={{
        marginHorizontal: GLASS_HORIZONTAL_MARGIN,
        marginBottom: GLASS_VERTICAL_GAP,
        paddingBottom: reserveAddButtonClearance ? FAB_CLEARANCE : 0,
        borderRadius: 999,
        backgroundColor: withAlpha(chrome, Platform.OS === 'ios' ? 0.76 : 0.9),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: withAlpha(chromeBorder, 0.82),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: Platform.OS === 'ios' ? 0.14 : 0.1,
        shadowRadius: 18,
        elevation: 8,
        overflow: 'hidden',
      }}
      colorScheme="auto"
      glassEffectStyle="regular"
      tintColor={withAlpha(chrome, Platform.OS === 'ios' ? 0.28 : 0.9)}
    >
      <Pressable
        onPress={state.open}
        accessibilityRole="button"
        accessibilityLabel="See what's new in this update"
        className="flex-row items-center px-3 py-2"
      >
        <View className="h-8 w-8 items-center justify-center rounded-full bg-accent-primary/15">
          <Icon
            name="whats-new"
            size={18}
            color={accentPrimary}
            weight="bold"
          />
        </View>
        <View className="flex-1 px-2.5">
          <Text className="text-sm font-semibold text-text-primary">
            What&apos;s new
          </Text>
          <Text numberOfLines={1} className="text-xs text-text-secondary">
            See what&apos;s improved in this update
          </Text>
        </View>
        <Pressable
          onPress={state.dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="p-1.5"
        >
          <Icon name="close" size={18} color={textMuted} weight="bold" />
        </Pressable>
      </Pressable>
    </LiquidGlassSurface>
  );
};

const WhatsNewBanner: React.FC<WhatsNewBannerProps> = props => {
  const state = useWhatsNewBannerState();
  return <WhatsNewBannerContent {...props} state={state} />;
};

export default WhatsNewBanner;
