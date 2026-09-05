import React, { useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Typography from '@/constants/typography';
import { IconSizes } from '@/constants/icons';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'whatsapp'
  | 'destructive'
  | 'accent'
  | 'dark';

export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle | TextStyle[];
  testID?: string;
  enableHaptics?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
  labelStyle,
  testID,
  enableHaptics = true,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || isLoading) return;
    if (enableHaptics && Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || isLoading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (disabled || isLoading) return;
    onPress();
  };

  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  const getIndicatorColor = () => {
    switch (variant) {
      case 'secondary':
      case 'outline':
      case 'ghost':
        return '#059669';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <Animated.View
      style={[
        fullWidth && { width: '100%' },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
        activeOpacity={0.88}
        style={[
          styles.base,
          sizeStyle.container,
          variantStyle.container,
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={getIndicatorColor()} />
        ) : (
          <View style={styles.contentRow}>
            {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
            <Text
              style={[
                sizeStyle.label,
                variantStyle.label,
                labelStyle,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconWrapper: {
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const SIZE_STYLES = {
  lg: StyleSheet.create({
    container: {
      height: 52,
      paddingHorizontal: 20,
      borderRadius: 14,
    },
    label: {
      ...Typography.button,
      fontSize: 15,
    },
  }),
  md: StyleSheet.create({
    container: {
      height: 46,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    label: {
      ...Typography.button,
      fontSize: 14,
    },
  }),
  sm: StyleSheet.create({
    container: {
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    label: {
      ...Typography.buttonSm,
      fontSize: 12.5,
    },
  }),
  xs: StyleSheet.create({
    container: {
      height: 30,
      paddingHorizontal: 9,
      borderRadius: 8,
    },
    label: {
      ...Typography.buttonSm,
      fontSize: 11,
      fontWeight: '700',
    },
  }),
};

const VARIANT_STYLES = {
  primary: StyleSheet.create({
    container: {
      backgroundColor: '#059669',
      borderColor: '#059669',
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      elevation: 3,
    },
    label: {
      color: '#FFFFFF',
    },
  }),
  secondary: StyleSheet.create({
    container: {
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
      borderColor: 'rgba(5, 150, 105, 0.25)',
    },
    label: {
      color: '#059669',
    },
  }),
  outline: StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    label: {
      color: '#334155',
    },
  }),
  ghost: StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    label: {
      color: '#059669',
    },
  }),
  whatsapp: StyleSheet.create({
    container: {
      backgroundColor: '#25D366',
      borderColor: '#25D366',
      shadowColor: '#25D366',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 2,
    },
    label: {
      color: '#FFFFFF',
    },
  }),
  destructive: StyleSheet.create({
    container: {
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
    },
    label: {
      color: '#FFFFFF',
    },
  }),
  accent: StyleSheet.create({
    container: {
      backgroundColor: '#D97706',
      borderColor: '#D97706',
    },
    label: {
      color: '#FFFFFF',
    },
  }),
  dark: StyleSheet.create({
    container: {
      backgroundColor: '#0F172A',
      borderColor: '#0F172A',
    },
    label: {
      color: '#FFFFFF',
    },
  }),
};
