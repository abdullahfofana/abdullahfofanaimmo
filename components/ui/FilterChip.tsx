import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Typography from '@/constants/typography';

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
  enableHaptics?: boolean;
}

export default function FilterChip({
  label,
  selected,
  onPress,
  icon,
  count,
  disabled = false,
  style,
  testID,
  enableHaptics = true,
}: FilterChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    if (enableHaptics && Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    Animated.spring(scaleAnim, {
      toValue: 0.94,
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
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.85}
        style={[
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <Text
          style={[
            styles.label,
            selected ? styles.labelSelected : styles.labelUnselected,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {typeof count === 'number' && count > 0 && (
          <View
            style={[
              styles.countBadge,
              selected ? styles.countBadgeSelected : styles.countBadgeUnselected,
            ]}
          >
            <Text
              style={[
                styles.countText,
                selected ? styles.countTextSelected : styles.countTextUnselected,
              ]}
            >
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  disabled: {
    opacity: 0.45,
  },
  iconWrapper: {
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.buttonSm,
    fontSize: 12.5,
    fontWeight: '600',
  },
  labelUnselected: {
    color: '#475569',
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeUnselected: {
    backgroundColor: '#F1F5F9',
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  countTextUnselected: {
    color: '#64748B',
  },
  countTextSelected: {
    color: '#FFFFFF',
  },
});
