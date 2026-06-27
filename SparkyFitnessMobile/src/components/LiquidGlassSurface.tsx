import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
  type GlassViewProps,
} from 'expo-glass-effect';

let glassAvailable: boolean | undefined;

function canUseLiquidGlass(): boolean {
  if (Platform.OS !== 'ios') return false;
  if (glassAvailable === undefined) {
    try {
      glassAvailable = isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
    } catch {
      glassAvailable = false;
    }
  }
  return glassAvailable;
}

type LiquidGlassSurfaceProps = ViewProps & {
  tintColor?: string;
  colorScheme?: GlassViewProps['colorScheme'];
  glassEffectStyle?: GlassViewProps['glassEffectStyle'];
};

const LiquidGlassSurface: React.FC<LiquidGlassSurfaceProps> = ({
  tintColor,
  colorScheme = 'auto',
  glassEffectStyle = 'regular',
  ...props
}) => {
  if (!canUseLiquidGlass()) {
    return <View {...props} />;
  }

  return (
    <GlassView
      {...props}
      colorScheme={colorScheme}
      glassEffectStyle={glassEffectStyle}
      tintColor={tintColor}
    />
  );
};

export default LiquidGlassSurface;
