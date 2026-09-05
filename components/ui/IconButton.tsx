import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export type IconButtonVariant =
  | 'surface'
  | 'primary'
  | 'ghost'
  | 'dark'
  | 'translucent'
  | 'translucentLight'
  | 'destructive';

export type IconButtonSize = 'lg' | 'md' | 'sm' | 'xs';
export type IconButtonShape = 'circle' | 'squircle';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress: (e?: any) => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  badgeCount?: number;
  badgeDot?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
  enableHaptics?: boolean;
  accessibilityLabel?: string;
}

export default function IconButton({
  icon,
  onPress,
  variant = 'surface',
  size = 'md',
  shape = 'circle',
  badgeCount,
  badgeDot = false,
  disabled = false,
  style,
  testID,
  enableHaptics = true,
  accessibilityLabel,
}: IconButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    if (enableHaptics && Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: Platform.OS !== 'web',
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const sizeDimensions = SIZE_MAP[size];
  const borderRadius =
    shape === 'circle' ? sizeDimensions.width / 2 : sizeDimensions.squircleRadius;
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[
          styles.base,
          {
            width: sizeDimensions.width,
            height: sizeDimensions.height,
            borderRadius,
          },
          variantStyle,
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon}

        {/* Badge counter */}
        {typeof badgeCount === 'number' && badgeCount > 0 && (
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}

        {/* Badge Dot */}
        {badgeDot && !badgeCount && <View style={styles.badgeDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const SIZE_MAP = {
  lg: { width: 48, height: 48, squircleRadius: 14 },
  md: { width: 40, height: 40, squircleRadius: 12 },
  sm: { width: 34, height: 34, squircleRadius: 10 },
  xs: { width: 28, height: 28, squircleRadius: 8 },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  disabled: {
    opacity: 0.4,
  },
  badgeCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

const VARIANT_STYLES = StyleSheet.create({
  surface: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  primary: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dark: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  translucent: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  translucentLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  destructive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
});
