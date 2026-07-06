import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from './Icon';

type VerifiedBadgeSize = 'sm' | 'md';

interface VerifiedBadgeProps {
  size?: VerifiedBadgeSize;
  testID?: string;
}

const VERIFIED_BLUE = '#0095F6';
const CHECK_WHITE = '#FFFFFF';

const SIZE_MAP: Record<VerifiedBadgeSize, { badge: number; seal: number; icon: number; border: number }> = {
  sm: { badge: 18, seal: 15, icon: 10, border: 1 },
  md: { badge: 22, seal: 18, icon: 12, border: 1.25 },
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  testID = 'verified-badge',
}) => {
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
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.burst,
          styles.burstSquare,
          {
            width: dimensions.seal,
            height: dimensions.seal,
            borderRadius: dimensions.seal * 0.26,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.burst,
          styles.burstDiamond,
          {
            width: dimensions.seal,
            height: dimensions.seal,
            borderRadius: dimensions.seal * 0.26,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.seal,
          {
            width: dimensions.seal,
            height: dimensions.seal,
            borderRadius: dimensions.seal / 2,
            borderWidth: dimensions.border,
          },
        ]}
      />
      <Icon name="checkmark" size={dimensions.icon} color={CHECK_WHITE} weight="bold" />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  burst: {
    position: 'absolute',
    backgroundColor: VERIFIED_BLUE,
  },
  burstSquare: {
    transform: [{ rotate: '0deg' }],
  },
  burstDiamond: {
    transform: [{ rotate: '45deg' }],
  },
  seal: {
    position: 'absolute',
    backgroundColor: VERIFIED_BLUE,
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
});

export default VerifiedBadge;
