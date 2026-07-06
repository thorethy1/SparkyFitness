import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

type VerifiedBadgeSize = 'sm' | 'md';

interface VerifiedBadgeProps {
  size?: VerifiedBadgeSize;
  testID?: string;
}

const CHECK_WHITE = '#FFFFFF';
const FALLBACK_SPARKY_BLUE = '#1F6FE5';

const SIZE_MAP: Record<VerifiedBadgeSize, { badge: number; checkStroke: number }> = {
  sm: { badge: 18, checkStroke: 2.35 },
  md: { badge: 22, checkStroke: 2.55 },
};

const VERIFIED_SEAL_PATH =
  'M12 1.9L14.03 3.47L16.57 3.18L17.65 5.5L20.02 6.46L19.86 9.02L21.55 10.94L20.08 13.03L20.52 15.55L18.25 16.74L17.42 19.16L14.86 19.14L12.97 20.86L10.73 19.62L8.27 20.31L6.78 18.23L4.29 17.67L3.83 15.16L1.78 13.64L2.74 11.27L1.9 8.86L4.03 7.45L4.62 4.97L7.13 4.54L8.76 2.57L11.1 3.58L12 1.9Z';

const CHECKMARK_PATH = 'M7.35 12.25L10.35 15.05L16.85 8.85';

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  testID = 'verified-badge',
}) => {
  const sparkyBlue = String(useCSSVariable('--color-cat-blue') || FALLBACK_SPARKY_BLUE);
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
      <Svg
        width={dimensions.badge}
        height={dimensions.badge}
        viewBox="0 0 24 24"
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Path d={VERIFIED_SEAL_PATH} fill={sparkyBlue} />
        <Path
          d={VERIFIED_SEAL_PATH}
          fill="none"
          stroke={CHECK_WHITE}
          strokeOpacity={0.26}
          strokeWidth={0.95}
          strokeLinejoin="round"
        />
        <Path
          d={CHECKMARK_PATH}
          fill="none"
          stroke={CHECK_WHITE}
          strokeWidth={dimensions.checkStroke}
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default VerifiedBadge;
