import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/providers/ThemeProvider';

/**
 * Returns the correct color token set for the current theme (dark or light).
 * Reactive — re-renders automatically when the user switches theme.
 */
export function useColors() {
  const { activeTheme } = useTheme();
  return ThemeColors[activeTheme];
}
