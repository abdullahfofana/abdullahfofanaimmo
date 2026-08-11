import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Globe,
  Bell,
  Moon,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';

import Spacing from '@/constants/spacing';
import Typography from '@/constants/typography';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/colors';

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  colors: typeof ThemeColors.light;
}

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightElement,
  colors,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>{icon}</View>
        <View style={styles.textContainer}>
          <Text style={[styles.settingsItemTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingsItemSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingsItemRight}>
        {rightElement}
        {showChevron && onPress && (
          <ChevronRight size={20} color={colors.textLight} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const { themeMode, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const colors = useColors();

  const toggleDarkMode = async (value: boolean) => {
    await setTheme(value ? 'dark' : 'light');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: t('settings_title'),
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings_general')}
          </Text>
          <View style={[styles.settingsContainer, { backgroundColor: colors.surface }]}>
            <SettingsItem
              icon={<Globe size={22} color={colors.primary} />}
              title={t('settings_language')}
              subtitle={language === 'fr' ? 'Français' : 'English'}
              onPress={() => {
                setLanguage(language === 'en' ? 'fr' : 'en');
              }}
              colors={colors}
            />
            <SettingsItem
              icon={<Bell size={22} color={colors.primary} />}
              title={t('settings_notifications')}
              subtitle={
                notificationsEnabled
                  ? t('settings_enabled')
                  : t('settings_disabled')
              }
              showChevron={false}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.borderLight, true: colors.primary }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.borderLight}
                />
              }
              colors={colors}
            />
            <SettingsItem
              icon={<Moon size={22} color={colors.primary} />}
              title={t('settings_dark_mode')}
              subtitle={
                themeMode === 'dark'
                  ? t('settings_enabled')
                  : t('settings_disabled')
              }
              showChevron={false}
              rightElement={
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: colors.borderLight, true: colors.primary }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.borderLight}
                />
              }
              colors={colors}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: Platform.OS === 'web' ? Spacing.sm : 0,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    fontSize: 14,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  settingsContainer: {
    borderRadius: 16,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)', // Cannot use static Colors.shadow here if implementing dynamic colors fully, but ok for now
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  settingsItemTitle: {
    ...Typography.body,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    ...Typography.bodySmall,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
