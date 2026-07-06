import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type VerifiedBadgeSize = 'sm' | 'md';

interface VerifiedBadgeProps {
  size?: VerifiedBadgeSize;
  testID?: string;
}

const SPARKY_VERIFIED_BLUE = '#4F83F1';
const SPARKY_VERIFIED_BLUE_DARK = '#3168D8';
const CHECK_WHITE = '#FFFFFF';

const SIZE_MAP: Record<VerifiedBadgeSize, { badge: number; stroke: number }> = {
  sm: { badge: 18, stroke: 2.45 },
  md: { badge: 22, stroke: 2.65 },
};

const sealPath =
  'M12 1.65l1.9 1.55 2.44-.28 1 2.24 2.28.9-.28 2.44L20.9 12l-1.56 1.9.28 2.44-2.28 1-1 2.24-2.44-.28L12 22.35 10.1 20.8l-2.44.28-1-2.24-2.28-.9.28-2.44L3.1 12l1.56-1.9-.28-2.44 2.28-1 1-2.24 2.44.28L12 1.65z';

const checkPath = 'M7.05 12.3l3.05 3.15 6.85-7.05';

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  testID = 'verified-badge',
}) => {
  const dimensions = SIZE_MAP[size];

  return (
    <View
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="Verified food"
      style={[
        styles.badge,
        {
          width: dimensions.badge,
          height: dimensions.badge,
        },
      ]}
    >
      <Svg width={dimensions.badge} height={dimensions.badge} viewBox="0 0 24 24">
        <Path
          d={sealPath}
          fill={SPARKY_VERIFIED_BLUE}
          stroke={SPARKY_VERIFIED_BLUE_DARK}
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
        <Path
          d={checkPath}
          fill="none"
          stroke={CHECK_WHITE}
          strokeWidth={dimensions.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: SPARKY_VERIFIED_BLUE_DARK,
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.22,
    shadowRadius: 1.5,
    elevation: 1,
  },
});

export default VerifiedBadge;
