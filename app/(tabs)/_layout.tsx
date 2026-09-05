import { Tabs } from 'expo-router';
import { Home, MapPin, Heart, User, Plus, Search } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Platform, View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/providers/LanguageProvider';
import { useColors } from '@/hooks/useColors';
import WebNavbar from '@/components/WebNavbar';
import { useResponsive } from '@/constants/breakpoints';

// ── Capsule Active Icon Component (Reference Image Inspired) ──────────────────
function DockTabIcon({
  icon,
  focused,
  isSpecial,
}: {
  icon: (color: string, strokeWidth: number) => React.ReactNode;
  focused: boolean;
  isSpecial?: boolean;
}) {
  const activeBg = '#059669';
  const activeIconColor = '#FFFFFF';
  const inactiveIconColor = '#8DA494';

  return (
    <View style={[dockStyles.tabItemWrap, focused && dockStyles.tabItemWrapFocused]}>
      {focused ? (
        <View style={[dockStyles.activeCircle, isSpecial && dockStyles.specialActiveCircle]}>
          {icon(activeIconColor, 2.5)}
        </View>
      ) : (
        <View style={dockStyles.inactiveWrap}>
          {icon(inactiveIconColor, 2.0)}
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { isDesktop } = useResponsive();
  const { t } = useLanguage();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isDesktop && <WebNavbar />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: isDesktop
            ? ({ display: 'none' as const } as const)
            : {
                position: 'absolute',
                left: 20,
                right: 20,
                bottom: Math.max(insets.bottom, 12) + 4,
                height: 62,
                borderRadius: 34,
                backgroundColor: 'rgba(20, 30, 25, 0.94)',
                borderTopWidth: 0,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                shadowColor: '#0A120E',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.32,
                shadowRadius: 22,
                elevation: 16,
                paddingHorizontal: 8,
                paddingVertical: 6,
                alignItems: 'center',
                justifyContent: 'space-around',
              },
          tabBarItemStyle: {
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('nav_home') || 'Accueil',
            tabBarIcon: ({ focused }) => (
              <DockTabIcon
                focused={focused}
                icon={(color, stroke) => <Home size={21} color={color} strokeWidth={stroke} />}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t('nav_search') || 'Explorer',
            tabBarIcon: ({ focused }) => (
              <DockTabIcon
                focused={focused}
                icon={(color, stroke) => <MapPin size={21} color={color} strokeWidth={stroke} />}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="add-property"
          options={{
            title: 'Publier',
            tabBarIcon: ({ focused }) => (
              <DockTabIcon
                focused={focused}
                isSpecial={true}
                icon={(color, stroke) => <Plus size={22} color={color} strokeWidth={2.6} />}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: t('nav_favorites') || 'Favoris',
            tabBarIcon: ({ focused }) => (
              <DockTabIcon
                focused={focused}
                icon={(color, stroke) => (
                  <Heart
                    size={20}
                    color={focused ? '#FFFFFF' : color}
                    fill={focused ? '#FFFFFF' : 'transparent'}
                    strokeWidth={stroke}
                  />
                )}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav_profile') || 'Profil',
            tabBarIcon: ({ focused }) => (
              <DockTabIcon
                focused={focused}
                icon={(color, stroke) => <User size={21} color={color} strokeWidth={stroke} />}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const dockStyles = StyleSheet.create({
  tabItemWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemWrapFocused: {
    transform: [{ scale: 1.05 }],
  },
  activeCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  specialActiveCircle: {
    backgroundColor: '#10B981',
  },
  inactiveWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
});


