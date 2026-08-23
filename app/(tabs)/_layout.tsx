import { Tabs } from 'expo-router';
import { Home, Search, Heart, User, Plus } from 'lucide-react-native';
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

import Colors from '@/constants/colors';
import { useLanguage } from '@/providers/LanguageProvider';
import { useColors } from '@/hooks/useColors';
import WebNavbar from '@/components/WebNavbar';

// ── Pill indicator tab icon ──────────────────────────────────────────────────
function TabIcon({ icon, label, focused }: { icon: React.ReactNode; label: string; focused: boolean }) {
  return (
    <View style={[tabStyles.wrap, focused && tabStyles.wrapFocused]}>
      {icon}
    </View>
  );
}

// ── Floating add button (centre slot) ────────────────────────────────────────
function AddIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[tabStyles.addOuter, focused && tabStyles.addOuterFocused]}>
      <Plus size={20} color="#fff" strokeWidth={2.5} />
    </View>
  );
}

import { useResponsive } from '@/constants/breakpoints';

export default function TabLayout() {
  const { isDesktop } = useResponsive();
  const { t } = useLanguage();
  const colors = useColors();

  return (
    <View style={{ flex: 1 }}>
      {isDesktop && <WebNavbar />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight || colors.textSecondary,
          tabBarStyle: isDesktop
            ? ({ display: 'none' as const } as const)
            : {
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 18,
                height: 68,
                paddingTop: 6,
                paddingBottom: 12,
                paddingHorizontal: 6,
                borderRadius: 22,
                backgroundColor: colors.surface,
                borderTopWidth: 0,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: 'rgba(18,28,20,0.18)',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 1,
                shadowRadius: 20,
                elevation: 12,
              },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600' as const,
            letterSpacing: 0.2,
            marginTop: 2,
          },
          tabBarItemStyle: {
            borderRadius: 12,
            paddingTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('nav_home'),
            tabBarLabel: t('nav_home'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={<Home size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />}
                label={t('nav_home')}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t('nav_search'),
            tabBarLabel: t('nav_search'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={<Search size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />}
                label={t('nav_search')}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="add-property"
          options={{
            title: 'Add',
            tabBarLabel: 'Add',
            tabBarIcon: ({ focused }) => <AddIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: t('nav_favorites'),
            tabBarLabel: t('nav_favorites'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={
                  <Heart
                    size={20}
                    color={color}
                    fill={focused ? Colors.primary : 'transparent'}
                    strokeWidth={focused ? 2.5 : 1.8}
                  />
                }
                label={t('nav_favorites')}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav_profile'),
            tabBarLabel: t('nav_profile'),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={<User size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />}
                label={t('nav_profile')}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  // Regular icon pill
  wrap: {
    width: 38,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  wrapFocused: {
    backgroundColor: Colors.surfaceGreen,
  },

  // Floating add button
  addOuter: {
    width: 42,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  addOuterFocused: {
    backgroundColor: Colors.primary,
  },
});
