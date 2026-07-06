import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import Icon from './Icon';

type VerifiedBadgeSize = 'sm' | 'md';

interface VerifiedBadgeProps {
  size?: VerifiedBadgeSize;
  testID?: string;
}

const SIZE_MAP: Record<VerifiedBadgeSize, { badge: number; icon: number; border: number }> = {
  sm: { badge: 18, icon: 11, border: 1.25 },
  md: { badge: 22, icon: 13, border: 1.5 },
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  testID = 'verified-badge',
}) => {
  const iconSuccess = String(useCSSVariable('--color-icon-success'));
  const dimensions = SIZE_MAP[size];

  return (
    <View
      accessibilityLabel="Verified food"
      accessibilityRole="image"
      testID={testID}
      style={[
        styles.badge,
        {
          width: dimensions.badge,
          height: dimensions.badge,
          borderRadius: dimensions.badge / 2,
          borderWidth: dimensions.border,
          borderColor: iconSuccess,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.absoluteFill,
          styles.fill,
          { backgroundColor: iconSuccess },
        ]}
      />
      <Icon name="checkmark" size={dimensions.icon} color={iconSuccess} weight="bold" />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  fill: {
    opacity: 0.12,
  },
});

export default VerifiedBadge;
