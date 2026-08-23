import { Dimensions, useWindowDimensions } from 'react-native';

export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export function useResponsive() {
  const { width } = useWindowDimensions();

  return {
    isMobile: width < Breakpoints.tablet,
    isTablet: width >= Breakpoints.tablet && width < Breakpoints.desktop,
    isDesktop: width >= Breakpoints.desktop,
    isWide: width >= Breakpoints.wide,
    width,
  };
}

export function getResponsiveValue<T>(
  mobile: T,
  tablet: T,
  desktop: T,
  wide?: T
): T {
  const { width } = Dimensions.get('window');

  if (wide !== undefined && width >= Breakpoints.wide) return wide;
  if (width >= Breakpoints.desktop) return desktop;
  if (width >= Breakpoints.tablet) return tablet;
  return mobile;
}

export function getColumns(width: number): number {
  if (width >= Breakpoints.wide) return 4;
  if (width >= Breakpoints.desktop) return 3;
  if (width >= Breakpoints.tablet) return 2;
  return 1;
}

export function getMaxContentWidth(width: number): number {
  if (width >= Breakpoints.wide) return 1440;
  if (width >= Breakpoints.desktop) return 1200;
  return width;
}
