import { ThemeColors } from '@/constants/colors';

export function useColors() {
  // Always return light theme to keep Home and other main tabs in light mode,
  // while the Dashboard handles its own isolated dark mode.
  return ThemeColors['light'];
}
