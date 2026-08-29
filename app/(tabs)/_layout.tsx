import { Tabs } from 'expo-router';
import { Home, Search, Heart, User, Plus } from 'lucide-react-native';
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/providers/LanguageProvider';
import { useColors } from '@/hooks/useColors';
import WebNavbar from '@/components/WebNavbar';
import { useResponsive } from '@/constants/breakpoints';

// ── Pill indicator tab icon ──────────────────────────────────────────────────
function TabIcon({ icon, label, focused, activeColor }: { icon: React.ReactNode; label: string; focused: boolean; activeColor: string }) {
  return (
    <View style={[tabStyles.wrap, focused && tabStyles.wrapFocused]}>
      {icon}
      {focused && <View style={[tabStyles.activeDot, { backgroundColor: activeColor }]} />}
    </View>
  );
}

// ── Floating add button (centre slot) ────────────────────────────────────────
function AddIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[tabStyles.addOuter, focused && tabStyles.addOuterFocused]}>
      <Plus size={22} color="#FFFFFF" strokeWidth={2.6} />
    </View>
  );
}

export default function TabLayout() {
  const { isDesktop } = useResponsive();
  const { t } = useLanguage();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const activeColor = '#059669';
  const inactiveColor = '#64748B';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isDesktop && <WebNavbar />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: isDesktop
            ? ({ display: 'none' as const } as const)
            : {
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: Math.max(insets.bottom, 12) + 2,
                height: 64,
                paddingTop: 6,
                paddingBottom: 8,
                paddingHorizontal: 8,
                borderRadius: 24,
                backgroundColor: '#FFFFFF',
                borderTopWidth: 0,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.12,
                shadowRadius: 18,
                elevation: 12,
              },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700' as const,
            letterSpacing: -0.1,
            marginTop: 1,
          },
          tabBarItemStyle: {
            borderRadius: 14,
            paddingTop: 2,
            height: 48,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('nav_home') || 'Home',
            tabBarLabel: t('nav_home') || 'Accueil',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={<Home size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 1.9} />}
                label={t('nav_home')}
                focused={focused}
                activeColor={activeColor}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t('nav_search') || 'Search',
            tabBarLabel: t('nav_search') || 'Explorer',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={<Search size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 1.9} />}
                label={t('nav_search')}
                focused={focused}
                activeColor={activeColor}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="add-property"
          options={{
            title: 'Publier',
            tabBarLabel: 'Publier',
            tabBarIcon: ({ focused }) => <AddIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: t('nav_favorites') || 'Favorites',
            tabBarLabel: t('nav_favorites') || 'Favoris',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={
                  <Heart
                    size={20}
                    color={focused ? '#EF4444' : color}
                    fill={focused ? '#EF4444' : 'transparent'}
                    strokeWidth={focused ? 2.5 : 1.9}
                  />
                }
                label={t('nav_favorites')}
                focused={focused}
                activeColor="#EF4444"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav_profile') || 'Profile',
            tabBarLabel: t('nav_profile') || 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={<User size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 1.9} />}
                label={t('nav_profile')}
                focused={focused}
                activeColor={activeColor}
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
    width: 36,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wrapFocused: {
    transform: [{ scale: 1.06 }],
  },
  activeDot: {
    position: 'absolute',
    bottom: -3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Floating add button
  addOuter: {
    width: 44,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  addOuterFocused: {
    backgroundColor: '#047857',
    transform: [{ scale: 1.08 }],
  },
});

