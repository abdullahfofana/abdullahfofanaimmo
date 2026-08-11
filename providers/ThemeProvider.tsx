import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Platform } from 'react-native';

const THEME_KEY = '@app_theme_mode';

type ThemeMode = 'light' | 'dark' | 'system';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const { ThemeColors } = require('@/constants/colors');
      const currentTheme = activeTheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
      document.body.style.backgroundColor = currentTheme.background;
    }
  }, [activeTheme]);

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setThemeMode(stored as ThemeMode);
      }
    } catch (error) {
      console.log('Theme loading error (using default):', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setTheme = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      console.log('Theme saved successfully:', mode);
    } catch (error) {
      console.log('Theme save error (mode applied anyway):', error);
    }
  }, []);

  const activeTheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme ?? 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  return {
    themeMode,
    activeTheme,
    setTheme,
    isLoaded
  };
});
