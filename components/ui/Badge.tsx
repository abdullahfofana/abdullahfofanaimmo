import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import Typography from '@/constants/typography';

export type BadgeVariant =
  | 'sale'
  | 'rent'
  | 'acd'
  | 'featured'
  | 'verified'
  | 'neutral'
  | 'destructive'
  | 'outline';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  icon?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export default function Badge({
  label,
  icon,
  variant = 'neutral',
  size = 'md',
  style,
  textStyle,
}: BadgeProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <View style={[styles.base, sizeStyle.container, variantStyle.container, style]}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={[sizeStyle.label, variantStyle.label, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    alignSelf: 'flex-start',
  },
  iconWrapper: {
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const SIZE_STYLES = {
  sm: StyleSheet.create({
    container: {
      paddingHorizontal: 6,
      paddingVertical: 2.5,
      borderRadius: 5,
    },
    label: {
      ...Typography.eyebrow,
      fontSize: 9.5,
      lineHeight: 12,
    },
  }),
  md: StyleSheet.create({
    container: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
    },
    label: {
      ...Typography.eyebrow,
      fontSize: 10,
      lineHeight: 14,
    },
  }),
};

const VARIANT_STYLES = {
  sale: StyleSheet.create({
    container: {
      backgroundColor: '#059669',
      borderColor: '#059669',
    },
    label: {
      color: '#FFFFFF',
    },
  }),
  rent: StyleSheet.create({
    container: {
      backgroundColor: '#0284C7',
      borderColor: '#0284C7',
    },
    label: {
      color: '#FFFFFF',
    },
  }),
  acd: StyleSheet.create({
    container: {
      backgroundColor: 'rgba(15, 23, 42, 0.78)',
      borderColor: 'rgba(16, 185, 129, 0.5)',
    },
    label: {
      color: '#10B981',
      fontWeight: '800',
    },
  }),
  featured: StyleSheet.create({
    container: {
      backgroundColor: '#D97706',
      borderColor: '#D97706',
    },
    label: {
      color: '#FFFFFF',
    },
  }),
  verified: StyleSheet.create({
    container: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
    },
    label: {
      color: '#059669',
    },
  }),
  neutral: StyleSheet.create({
    container: {
      backgroundColor: '#F1F5F9',
      borderColor: '#E2E8F0',
    },
    label: {
      color: '#475569',
    },
  }),
  destructive: StyleSheet.create({
    container: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
    },
    label: {
      color: '#EF4444',
    },
  }),
  outline: StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      borderColor: '#CBD5E1',
    },
    label: {
      color: '#334155',
    },
  }),
};
