import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

type VerifiedBadgeSize = 'sm' | 'md';

interface VerifiedBadgeProps {
  size?: VerifiedBadgeSize;
  testID?: string;
}

const FALLBACK_CALORIES_COLOR = '#8792E3';
const CHECK_WHITE = '#FFFFFF';

const SIZE_MAP: Record<VerifiedBadgeSize, { badge: number; stroke: number }> = {
  sm: { badge: 18, stroke: 2.55 },
  md: { badge: 22, stroke: 2.75 },
};

// Eight-point Instagram-style seal with softened tips and rounded inner notches.
const sealPath =
  'M10.82 2.6 Q12 1.75 13.18 2.6 Q15.27 4.1 16.7 4.34 Q19.25 4.75 19.48 6.18 Q19.9 8.73 20.75 9.91 Q22.25 12 21.4 13.18 Q19.9 15.27 19.66 16.7 Q19.25 19.25 17.82 19.48 Q15.27 19.9 14.09 20.75 Q12 22.25 10.82 21.4 Q8.73 19.9 7.3 19.66 Q4.75 19.25 4.52 17.82 Q4.1 15.27 3.25 14.09 Q1.75 12 2.6 10.82 Q4.1 8.73 4.34 7.3 Q4.75 4.75 6.18 4.52 Q8.73 4.1 9.91 3.25 Z';

const checkPath = 'M7.15 12.25l2.95 3.05 6.75-6.95';

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  testID = 'verified-badge',
}) => {
  const caloriesColor = String(useCSSVariable('--color-calories') || FALLBACK_CALORIES_COLOR);
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
          shadowColor: caloriesColor,
        },
      ]}
    >
      <Svg width={dimensions.badge} height={dimensions.badge} viewBox="0 0 24 24">
        <Path d={sealPath} fill={caloriesColor} />
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
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.24,
    shadowRadius: 1.5,
    elevation: 1,
  },
});

export default VerifiedBadge;
