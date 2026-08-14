import { router } from 'expo-router';
import {
  BarChart3,
  Bell,
  Brain,
  Building2,
  ChevronRight,
  Clock,
  Eye,
  Globe,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  MessageSquare,
  Shield,
  MapPin,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Plus,
  Zap,
  Star,
  Send,
} from 'lucide-react-native';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { dashboardDark, dashboardLight } from '@/constants/colors';
import type { DashboardTheme } from '@/constants/colors';
import { useResponsive } from '@/constants/breakpoints';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';
import PerformanceDistributionChart, {
  DEFAULT_PERFORMANCE_DATA,
} from '@/components/charts/PerformanceDistributionChart';
import RecentTransactionsList from '@/components/dashboard/RecentTransactionsList';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DashTab = 'overview' | 'listings' | 'analytics' | 'ai' | 'pending' | 'favorites' | 'settings';

interface PropertyRow {
  id: string;
  title: string;
  location: string;
  views: number;
  favs: number;
  convRate: string;
  status: 'active' | 'pending' | 'sold';
  price: string;
  trend: number;
}

interface ActivityItem {
  id: string;
  type: 'view' | 'favorite' | 'price' | 'inquiry';
  property: string;
  time: string;
  avatar: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const REVENUE_BARS = [
  { month: 'J', value: 4200 },
  { month: 'F', value: 5800 },
  { month: 'M', value: 4900 },
  { month: 'A', value: 7200 },
  { month: 'M', value: 6800 },
  { month: 'J', value: 8900 },
  { month: 'J', value: 12400 },
];

const TOP_PROPERTIES: PropertyRow[] = [
  { id: '1', title: 'Villa Cocody Riviera', location: 'Cocody', views: 1247, favs: 89, convRate: '7.1%', status: 'active', price: '85M', trend: 12 },
  { id: '2', title: 'Appartement Plateau', location: 'Plateau', views: 934, favs: 67, convRate: '6.2%', status: 'active', price: '35M', trend: 8 },
  { id: '3', title: 'Duplex Marcory', location: 'Marcory', views: 821, favs: 54, convRate: '5.8%', status: 'pending', price: '45M', trend: -3 },
  { id: '4', title: 'Studio Yopougon', location: 'Yopougon', views: 612, favs: 41, convRate: '4.3%', status: 'active', price: '12M', trend: 5 },
  { id: '5', title: 'Terrain Bingerville', location: 'Bingerville', views: 445, favs: 28, convRate: '3.1%', status: 'sold', price: '120M', trend: 0 },
];

const ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'inquiry', property: 'Villa Cocody Riviera', time: '2 min ago', avatar: 'AK' },
  { id: '2', type: 'favorite', property: 'Appartement Plateau', time: '15 min ago', avatar: 'MF' },
  { id: '3', type: 'view', property: 'Duplex Marcory', time: '1 hr ago', avatar: 'SC' },
  { id: '4', type: 'price', property: 'Studio Yopougon', time: '3 hr ago', avatar: 'BK' },
  { id: '5', type: 'view', property: 'Terrain Bingerville', time: '5 hr ago', avatar: 'LT' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animated Dark/Light Toggle Pill
// ─────────────────────────────────────────────────────────────────────────────

function ThemeTogglePill({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  const slideAnim = useRef(new Animated.Value(isDark ? 0 : 1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isDark ? 0 : 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, [isDark]);

  const thumbX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 45],
  });

  const darkBg = 'rgba(124, 92, 252, 0.18)';
  const lightBg = 'rgba(245, 158, 11, 0.18)';
  const darkBorder = 'rgba(139, 92, 246, 0.50)';
  const lightBorder = 'rgba(245, 158, 11, 0.50)';

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.85}
      style={[
        ds.themeTogglePill,
        {
          backgroundColor: isDark ? darkBg : lightBg,
          borderColor: isDark ? darkBorder : lightBorder,
          width: 85,
          justifyContent: 'space-between',
          paddingHorizontal: 8,
        },
      ]}
    >
      {/* Track icons and labels */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 10 }}>
        {isDark ? (
          <>
            <Moon size={12} color="#A78BFA" strokeWidth={2.2} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#A78BFA' }}>Dark</Text>
          </>
        ) : (
          <>
            <Sun size={12} color="#F59E0B" strokeWidth={2.2} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B' }}>Light</Text>
          </>
        )}
      </View>

      <Animated.View
        style={[
          ds.themeThumb,
          {
            transform: [{ translateX: thumbX }, { scale: glowAnim }],
            backgroundColor: isDark ? '#8B5CF6' : '#F59E0B',
            shadowColor: isDark ? '#8B5CF6' : '#F59E0B',
          },
        ]}
      />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini spark bars
// ─────────────────────────────────────────────────────────────────────────────

function SparkBars({ data, accentColor, height = 28 }: { data: number[]; accentColor: string; height?: number }) {
  const max = Math.max(...data);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((v, i) => {
        const isLast = i === data.length - 1;
        const h = Math.max(4, (v / max) * height);
        return (
          <View
            key={i}
            style={{
              width: 5,
              height: h,
              borderRadius: 2,
              backgroundColor: accentColor,
              opacity: isLast ? 1 : 0.15 + (i / data.length) * 0.55,
            }}
          />
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bar chart — revenue section
// ─────────────────────────────────────────────────────────────────────────────

function RevenueChart({ theme }: { theme: DashboardTheme }) {
  const max = Math.max(...REVENUE_BARS.map(d => d.value));
  const CHART_H = 120;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        {/* Y labels */}
        <View style={{ height: CHART_H, justifyContent: 'space-between', paddingBottom: 0 }}>
          {['12k', '8k', '4k', '0'].map(l => (
            <Text key={l} style={{ fontSize: 10, color: theme.textMuted, textAlign: 'right', width: 26 } as any}>{l}</Text>
          ))}
        </View>

        {/* Bars + grid */}
        <View style={{ flex: 1, height: CHART_H, position: 'relative' }}>
          {/* Grid lines */}
          {[0, 1 / 3, 2 / 3, 1].map((t, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top: t * (CHART_H - 16),
                height: 1,
                backgroundColor: theme.chartGrid,
              }}
            />
          ))}
          {/* Bars */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 4 }}>
            {REVENUE_BARS.map((item, i) => {
              const barH = Math.max(6, (item.value / max) * (CHART_H - 24));
              const isActive = i === REVENUE_BARS.length - 1;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  {isActive ? (
                    <LinearGradient
                      colors={['#52B788', '#2D6A4F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{ width: '100%', maxWidth: 36, height: barH, borderRadius: 6, minWidth: 12 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: '100%', maxWidth: 36, height: barH,
                        borderRadius: 6, minWidth: 12,
                        backgroundColor: theme.border,
                        opacity: 0.7,
                      }}
                    />
                  )}
                  <Text style={{ fontSize: 10, color: isActive ? theme.purpleLight : theme.textMuted, marginTop: 6, fontWeight: isActive ? '700' : '400' } as any}>
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Number Counter
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedValue({ value, color }: { value: string; color: string }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 50, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={{
        fontSize: 38,
        fontWeight: '800',
        letterSpacing: -2,
        color,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      } as any}
    >
      {value}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar — glassmorphism in dark mode
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ activeTab, onTabChange, theme, t, isDark, onToggleTheme }: {
  activeTab: DashTab;
  onTabChange: (tab: DashTab) => void;
  theme: DashboardTheme;
  t: (key: any) => string;
  isDark?: boolean;
  onToggleTheme?: () => void;
}) {
  const items: { key: DashTab; icon: React.ReactNode; label: string; badge?: string }[] = [
    { key: 'overview', icon: <LayoutDashboard size={16} />, label: t('dash_nav_overview') },
    { key: 'listings', icon: <Building2 size={16} />, label: t('dash_nav_listings'), badge: '24' },
    { key: 'analytics', icon: <BarChart3 size={16} />, label: t('dash_nav_analytics') },
    { key: 'ai', icon: <Brain size={16} />, label: t('dash_nav_ai_assistant') },
    { key: 'pending', icon: <Clock size={16} />, label: t('dash_nav_pending'), badge: '3' },
    { key: 'favorites', icon: <Heart size={16} />, label: t('dash_nav_favorites') },
  ];

  return (
    <View style={[
      ds.sidebar,
      {
        backgroundColor: isDark ? '#0A0C0F' : theme.sidebarBg,
        borderRightColor: isDark ? 'rgba(255,255,255,0.06)' : theme.sidebarBorder,
      },
      isDark && Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } as any : {},
    ]}>
      {/* Brand */}
      <TouchableOpacity style={ds.brandRow} onPress={() => router.push('/(tabs)/home')} activeOpacity={0.7}>
        <LinearGradient colors={theme.gradient.purplePrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ds.brandIcon}>
          <Home size={13} color="#fff" strokeWidth={2.5} />
        </LinearGradient>
        <View>
          <Text style={[ds.brandName, { color: theme.text }]}>ImmoCI</Text>
          <Text style={{ fontSize: 9, color: theme.textMuted, fontWeight: '500', letterSpacing: 0.8 } as any}>PRO DASHBOARD</Text>
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: theme.borderLight, marginHorizontal: 10, marginBottom: 16 }} />

      {/* Nav */}
      <View style={{ flex: 1 }}>
        <Text style={[ds.navSection, { color: theme.textMuted }]}>NAVIGATION</Text>
        <View style={{ gap: 2, marginTop: 8 }}>
          {items.map(item => {
            const active = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  ds.navRow,
                  active && {
                    backgroundColor: isDark ? 'rgba(45,106,79,0.18)' : theme.sidebarActive,
                  },
                ]}
                onPress={() => onTabChange(item.key)}
                activeOpacity={0.65}
              >
                {active && (
                  <LinearGradient
                    colors={theme.gradient.purplePrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={ds.navBar}
                  />
                )}
                <View style={{ opacity: active ? 1 : 0.5 }}>
                  {React.cloneElement(item.icon as any, {
                    color: active ? theme.purpleLight : theme.textSecondary,
                    strokeWidth: active ? 2.2 : 1.7,
                  })}
                </View>
                <Text style={[ds.navLabel, { color: active ? theme.text : theme.textSecondary, fontWeight: active ? '600' : '400' } as any]}>
                  {item.label}
                </Text>
                {item.badge && (
                  <View style={[ds.navBadge, { backgroundColor: active ? theme.purpleMuted : theme.surfaceAlt }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: active ? theme.purpleLight : theme.textMuted } as any}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <View style={[ds.sidebarFooter, { borderTopColor: theme.borderLight }]}>
        {/* Animated Theme Toggle in Sidebar */}
        {onToggleTheme && (
          <View style={[ds.navRow, {
            backgroundColor: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(245,158,11,0.08)',
            marginBottom: 6,
            justifyContent: 'space-between',
          }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              {isDark
                ? <Moon size={14} color="#A78BFA" strokeWidth={2.2} />
                : <Sun size={14} color="#F59E0B" strokeWidth={2.2} />
              }
              <Text style={[ds.navLabel, { color: isDark ? '#52B788' : '#D97706', fontWeight: '500' } as any]}>
                {isDark ? t('dash_theme_dark') : t('dash_theme_light')}
              </Text>
            </View>
            <ThemeTogglePill isDark={isDark ?? true} onToggle={onToggleTheme} />
          </View>
        )}

        <TouchableOpacity style={ds.navRow} onPress={() => onTabChange('settings')} activeOpacity={0.65}>
          <Settings size={15} color={theme.textMuted} strokeWidth={1.7} />
          <Text style={[ds.navLabel, { color: theme.textMuted }]}>{t('dash_nav_settings')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ds.navRow} onPress={() => router.push('/(tabs)/home')} activeOpacity={0.65}>
          <ArrowUpRight size={15} color={theme.textMuted} strokeWidth={1.7} />
          <Text style={[ds.navLabel, { color: theme.textMuted }]}>{t('dash_nav_back_site')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pro Metric Card — 3 distinct visual treatments
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  label, value, unit, change, sparkData, accentColor, theme, variant,
}: {
  label: string; value: string; unit?: string; change: number;
  sparkData: number[]; accentColor: string; theme: DashboardTheme;
  variant: 'hero' | 'medium' | 'compact';
}) {
  const up = change >= 0;

  if (variant === 'hero') {
    return (
      <LinearGradient
        colors={theme.gradient.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[ds.heroCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: theme.textMuted } as any}>
              {label}
            </Text>
          </View>
          <View style={[ds.changePill, { backgroundColor: up ? theme.greenBg : theme.redBg }]}>
            {up ? <ArrowUp size={12} color={theme.green} strokeWidth={2.5} /> : <ArrowDown size={12} color={theme.red} strokeWidth={2.5} />}
            <Text style={{ fontSize: 12, fontWeight: '700', color: up ? theme.green : theme.red } as any}>
              {up ? '+' : ''}{change}%
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <AnimatedValue value={value} color={theme.text} />
          {unit && <Text style={{ fontSize: 16, color: theme.textSecondary, fontWeight: '500' } as any}>{unit}</Text>}
        </View>

        <View style={{ height: 1, backgroundColor: theme.borderLight, marginVertical: 18 }} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 } as any}>vs last month</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {up ? <TrendingUp size={14} color={theme.green} strokeWidth={2.5} /> : <TrendingDown size={14} color={theme.red} strokeWidth={2.5} />}
              <Text style={{ fontSize: 13, fontWeight: '700', color: up ? theme.green : theme.red } as any}>
                {up ? '+' : ''}{change}% growth
              </Text>
            </View>
          </View>
          <SparkBars data={sparkData} accentColor={accentColor} height={40} />
        </View>

        {/* Bottom accent bar */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, backgroundColor: accentColor, opacity: 0.8 }} />
      </LinearGradient>
    );
  }

  if (variant === 'medium') {
    return (
      <View style={[ds.mediumCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderLight }]}>
        {/* Accent top bar */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: accentColor, opacity: 0.8 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' } as any}>{label}</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: -1.2, color: theme.text, marginTop: 8 } as any}>
              {value}
            </Text>
          </View>
          <SparkBars data={sparkData} accentColor={accentColor} height={36} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
          <View style={[ds.changePill, { backgroundColor: up ? theme.greenBg : theme.redBg }]}>
            {up ? <TrendingUp size={11} color={theme.green} strokeWidth={2.5} /> : <TrendingDown size={11} color={theme.red} strokeWidth={2.5} />}
            <Text style={{ fontSize: 11, fontWeight: '700', color: up ? theme.green : theme.red } as any}>
              {up ? '+' : ''}{change}%
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '500' } as any}>this month</Text>
        </View>
      </View>
    );
  }

  // compact
  return (
    <View style={[ds.compactCard, { borderColor: theme.borderLight, backgroundColor: theme.surface }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 } as any}>{label}</Text>
        <View style={[ds.changePill, { backgroundColor: up ? theme.greenBg : theme.redBg, paddingHorizontal: 6 }]}>
          {up ? <ArrowUp size={9} color={theme.green} strokeWidth={2.5} /> : <ArrowDown size={9} color={theme.red} strokeWidth={2.5} />}
          <Text style={{ fontSize: 10, fontWeight: '800', color: up ? theme.green : theme.red } as any}>
            {up ? '+' : ''}{change}%
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text, marginTop: 8, letterSpacing: -0.8 } as any}>{value}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Property list — card-style rows
// ─────────────────────────────────────────────────────────────────────────────

function PropertyList({ properties, theme, t }: { properties: PropertyRow[]; theme: DashboardTheme; t: (key: any) => string }) {
  const STATUS = {
    active:  { label: t('dash_status_active'),  dot: theme.green,  bg: theme.greenBg,  text: theme.green },
    pending: { label: t('dash_status_pending'), dot: theme.amber,  bg: theme.amberBg,  text: theme.amber },
    sold:    { label: t('dash_status_sold'),    dot: theme.red,    bg: theme.redBg,    text: theme.red   },
  };

  return (
    <View style={[ds.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={ds.panelHeader}>
        <Text style={[ds.panelTitle, { color: theme.text }]}>{t('dash_top_properties')}</Text>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }} activeOpacity={0.7}>
          <Text style={{ fontSize: 13, color: theme.purple, fontWeight: '500' } as any}>{t('dash_view_all')}</Text>
          <ChevronRight size={14} color={theme.purple} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Column headers */}
      <View style={[ds.colRow, { borderBottomColor: theme.borderLight, paddingBottom: 10, marginBottom: 2, borderBottomWidth: 1 }]}>
        <Text style={[ds.colHead, { color: theme.textMuted, flex: 2 }]}>PROPERTY</Text>
        <Text style={[ds.colHead, { color: theme.textMuted, flex: 0.9, textAlign: 'right' as any }]}>VIEWS</Text>
        <Text style={[ds.colHead, { color: theme.textMuted, flex: 0.9, textAlign: 'right' as any }]}>TREND</Text>
        <Text style={[ds.colHead, { color: theme.textMuted, flex: 1, textAlign: 'center' as any }]}>STATUS</Text>
      </View>

      {properties.map((p, i) => {
        const st = STATUS[p.status];
        const trendUp = p.trend >= 0 && p.status !== 'sold';
        return (
          <TouchableOpacity
            key={p.id}
            style={[
              ds.colRow,
              {
                paddingVertical: 13,
                borderBottomWidth: i < properties.length - 1 ? 1 : 0,
                borderBottomColor: theme.borderLight,
              },
            ]}
            activeOpacity={0.55}
          >
            {/* Property name + location */}
            <View style={{ flex: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text } as any} numberOfLines={1}>{p.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }}>
                <MapPin size={9} color={theme.textMuted} strokeWidth={2} />
                <Text style={{ fontSize: 11, color: theme.textMuted } as any}>{p.location}</Text>
                <Text style={{ fontSize: 11, color: theme.gold, fontWeight: '700', marginLeft: 4 } as any}>{p.price} F</Text>
              </View>
            </View>

            {/* Views */}
            <Text style={{ flex: 0.9, fontSize: 13, color: theme.textSecondary, textAlign: 'right', fontWeight: '600' } as any}>
              {p.views.toLocaleString()}
            </Text>

            {/* Trend */}
            <View style={{ flex: 0.9, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
              {p.status === 'sold' ? (
                <Text style={{ fontSize: 12, color: theme.textMuted } as any}>—</Text>
              ) : (
                <>
                  {trendUp
                    ? <TrendingUp size={12} color={theme.green} strokeWidth={2} />
                    : <TrendingDown size={12} color={theme.red} strokeWidth={2} />
                  }
                  <Text style={{ fontSize: 12, fontWeight: '700', color: trendUp ? theme.green : theme.red } as any}>
                    {trendUp ? '+' : ''}{p.trend}%
                  </Text>
                </>
              )}
            </View>

            {/* Status badge */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={[ds.statusBadge, { backgroundColor: st.bg }]}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: st.dot }} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: st.text } as any}>{st.label}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Panel
// ─────────────────────────────────────────────────────────────────────────────

function ActivityPanel({ activities, theme, t }: { activities: ActivityItem[]; theme: DashboardTheme; t: (key: any) => string }) {
  const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    view:     { label: t('dash_activity_new_view'),     color: theme.blue,   icon: <Eye size={11} color={theme.blue} /> },
    favorite: { label: t('dash_activity_new_fav'),      color: theme.red,    icon: <Heart size={11} color={theme.red} /> },
    price:    { label: t('dash_activity_price_change'), color: theme.amber,  icon: <TrendingUp size={11} color={theme.amber} /> },
    inquiry:  { label: t('dash_activity_new_inquiry'),  color: theme.purple, icon: <MessageSquare size={11} color={theme.purple} /> },
  };

  return (
    <View style={[ds.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={ds.panelHeader}>
        <Text style={[ds.panelTitle, { color: theme.text }]}>{t('dash_activity_title')}</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ fontSize: 13, color: theme.purple, fontWeight: '500' } as any}>{t('dash_view_all')}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ gap: 0 }}>
        {activities.map((a, i) => {
          const cfg = typeConfig[a.type] || typeConfig.view;
          const isLast = i === activities.length - 1;
          return (
            <View key={a.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 11, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: theme.borderLight }}>
              {/* Avatar */}
              <View style={[ds.personAvatar, { backgroundColor: theme.purpleMuted, borderColor: theme.borderLight }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.purpleLight } as any}>{a.avatar}</Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1, paddingTop: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' as any }}>
                  <View style={[ds.typeTag, { backgroundColor: cfg.color + '18' }]}>
                    {cfg.icon}
                    <Text style={{ fontSize: 10, fontWeight: '600', color: cfg.color, letterSpacing: 0.2 } as any}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 3 } as any} numberOfLines={1}>
                  {a.property}
                </Text>
              </View>

              <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 } as any}>{a.time}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Assistant Panel
// ─────────────────────────────────────────────────────────────────────────────

function AIPanel({ theme, t }: { theme: DashboardTheme; t: (key: any) => string }) {
  return (
    <View style={[ds.aiPanel, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderLight }]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <LinearGradient
          colors={theme.gradient.purplePrimary}
          style={ds.aiAvatar}
        >
          <Sparkles size={13} color="#fff" strokeWidth={2} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text } as any}>{t('dash_ai_title')}</Text>
          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 } as any}>{t('dash_ai_subtitle')}</Text>
        </View>
        <View style={[ds.liveChip, { borderColor: theme.green + '55', backgroundColor: theme.greenBg }]}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.green }} />
          <Text style={{ fontSize: 9, fontWeight: '700', color: theme.green, letterSpacing: 0.5 } as any}>LIVE</Text>
        </View>
      </View>

      {/* Chat bubbles */}
      <View style={{ gap: 8 }}>
        <View style={[ds.bubble, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <TrendingUp size={12} color={theme.green} strokeWidth={2} />
          <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 18 } as any}>{t('dash_ai_insight_1')}</Text>
        </View>
        <View style={[ds.bubble, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <Star size={12} color={theme.gold} strokeWidth={2} />
          <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 18 } as any}>{t('dash_ai_insight_2')}</Text>
        </View>
        <View style={[ds.bubble, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <Zap size={12} color={theme.purpleLight} strokeWidth={2} />
          <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, lineHeight: 18 } as any}>{t('dash_ai_insight_3')}</Text>
        </View>
      </View>

      {/* Ask input */}
      <TouchableOpacity style={[ds.askBar, { borderColor: theme.border, backgroundColor: theme.surface }]} activeOpacity={0.75}>
        <Brain size={13} color={theme.textMuted} strokeWidth={2} />
        <Text style={{ flex: 1, fontSize: 12, color: theme.textMuted } as any}>{t('dash_ai_ask')}</Text>
        <LinearGradient colors={theme.gradient.purplePrimary} style={ds.sendBtn}>
          <Send size={10} color="#fff" strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage, toggleLanguage } = useLanguage();
  const { isDesktop, isMobile } = useResponsive();
  const { activeTheme, setTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d'>('30d');

  const theme = isDark ? dashboardDark : dashboardLight;

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = theme.bg;
    }
  }, [theme.bg]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('dash_greeting_morning');
    if (h < 18) return t('dash_greeting_afternoon');
    return t('dash_greeting_evening');
  }, [t, language]);

  const METRICS = useMemo(() => [
    { label: t('dash_kpi_revenue'), value: '12.4M', unit: 'FCFA', change: 23.5, spark: [30, 45, 38, 52, 48, 65, 82], color: theme.purpleLight },
    { label: t('dash_kpi_listings'), value: '24', change: 12, spark: [15, 18, 20, 19, 22, 21, 24], color: theme.green },
    { label: t('dash_kpi_views'), value: '3,842', change: -2.1, spark: [280, 310, 295, 340, 320, 300, 285], color: theme.blue },
    { label: t('dash_kpi_conversion'), value: '4.8%', change: 0.7, spark: [3.2, 3.5, 3.8, 4.1, 3.9, 4.5, 4.8], color: theme.amber },
  ], [t, language, theme]);

  const PERIODS = useMemo(() => [
    { key: 'today' as const, label: t('dash_period_today') },
    { key: '7d'    as const, label: t('dash_period_7d') },
    { key: '30d'   as const, label: t('dash_period_30d') },
    { key: '90d'   as const, label: t('dash_period_90d') },
  ], [t, language]);

  // ── Mobile bottom nav
  const mobileNav = () => {
    const TABS: { key: DashTab; Icon: any }[] = [
      { key: 'overview', Icon: LayoutDashboard },
      { key: 'listings', Icon: Building2 },
      { key: 'ai', Icon: Brain },
      { key: 'analytics', Icon: BarChart3 },
      { key: 'settings', Icon: Settings },
    ];
    return (
      <View style={[ds.mobileBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom || 8 }]}>
        {TABS.map(({ key, Icon }) => {
          const on = activeTab === key;
          return (
            <TouchableOpacity key={key} style={ds.mobileTab} onPress={() => setActiveTab(key)} activeOpacity={0.65}>
              {on && (
                <LinearGradient
                  colors={theme.gradient.purplePrimary}
                  style={ds.mobileTabPill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              )}
              <Icon size={21} color={on ? theme.purpleLight : theme.textMuted} strokeWidth={on ? 2.2 : 1.6} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ── Header bar
  const header = () => (
    <View style={[ds.headerBar, { borderBottomColor: theme.borderLight, backgroundColor: theme.bg }]}>
      {!isDesktop && (
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')} activeOpacity={0.7} style={{ marginRight: 4 }}>
          <LinearGradient colors={theme.gradient.purplePrimary} style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Home size={13} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={{ flex: 1 }}>
        <View style={[ds.searchWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.borderLight, borderWidth: 1 }]}>
          <Search size={14} color={theme.textMuted} strokeWidth={2} />
          <TextInput
            style={[ds.searchInput, { color: theme.text }]}
            placeholder={t('dash_search_placeholder')}
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Language */}
        <TouchableOpacity style={[ds.chipBtn, { borderColor: theme.borderLight, backgroundColor: theme.surfaceAlt }]} onPress={toggleLanguage} activeOpacity={0.7}>
          <Globe size={13} color={theme.textSecondary} strokeWidth={2} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary } as any}>{language.toUpperCase()}</Text>
        </TouchableOpacity>

        {/* Animated Dark/Light Toggle in Header */}
        <ThemeTogglePill isDark={isDark} onToggle={toggleTheme} />

        {/* Bell */}
        <TouchableOpacity style={[ds.iconBtn, { backgroundColor: theme.surfaceAlt }]} activeOpacity={0.7}>
          <Bell size={15} color={theme.textSecondary} strokeWidth={2} />
          <View style={[ds.dot, { backgroundColor: theme.red }]} />
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity style={ds.avatarBtn} onPress={() => setActiveTab('settings')} activeOpacity={0.8}>
          <LinearGradient colors={theme.gradient.purplePrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ds.avatarInner}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' } as any}>JK</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Hero gradient section
  const heroSection = () => (
    <LinearGradient
      colors={theme.gradient.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[ds.heroSection, {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.borderLight,
        paddingHorizontal: 20,
        marginBottom: 4,
      }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: theme.textMuted, textTransform: 'uppercase' } as any}>
          {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.8, color: theme.text, marginTop: 4 } as any}>
          {greeting}, Jean 👋
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6EE7A8' }} />
          <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '500' } as any}>
            {language === 'fr' ? 'Tableau de bord actif · Données en temps réel' : 'Dashboard active · Live data'}
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 } as any}>
          {language === 'en' ? 'Here\'s what\'s happening with your portfolio today.' : 'Voici ce qui se passe avec votre portefeuille aujourd\'hui.'}
        </Text>
      </View>

      <TouchableOpacity
        style={[ds.ctaBtn]}
        onPress={() => router.push('/add-property')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={theme.gradient.purplePrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 }}
        >
          <Plus size={15} color="#fff" strokeWidth={2.5} />
          {isDesktop && <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' } as any}>{language === 'en' ? 'New listing' : 'Nouveau bien'}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );

  // ── Overview
  const overview = () => (
    <View style={ds.content}>
      {heroSection()}

      {/* Period tabs */}
      <View style={[ds.periodRow, { borderBottomColor: theme.borderLight, borderBottomWidth: 1 }]}>
        {PERIODS.map(p => {
          const sel = period === p.key;
          return (
            <TouchableOpacity key={p.key} style={ds.periodTab} onPress={() => setPeriod(p.key)} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, fontWeight: sel ? '700' : '400', color: sel ? theme.text : theme.textMuted } as any}>{p.label}</Text>
              {sel && <View style={[ds.periodLine, { backgroundColor: theme.purpleLight }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Metrics grid */}
      {isDesktop ? (
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ flex: 1.2 }}>
            <MetricCard variant="hero" label={METRICS[0].label} value={METRICS[0].value} unit={METRICS[0].unit}
              change={METRICS[0].change} sparkData={METRICS[0].spark} accentColor={METRICS[0].color} theme={theme} />
          </View>
          <View style={{ flex: 1, gap: 10 }}>
            <MetricCard variant="medium" label={METRICS[1].label} value={METRICS[1].value}
              change={METRICS[1].change} sparkData={METRICS[1].spark} accentColor={METRICS[1].color} theme={theme} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <MetricCard variant="compact" label={METRICS[2].label} value={METRICS[2].value}
                  change={METRICS[2].change} sparkData={METRICS[2].spark} accentColor={METRICS[2].color} theme={theme} />
              </View>
              <View style={{ flex: 1 }}>
                <MetricCard variant="compact" label={METRICS[3].label} value={METRICS[3].value}
                  change={METRICS[3].change} sparkData={METRICS[3].spark} accentColor={METRICS[3].color} theme={theme} />
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <MetricCard variant="hero" label={METRICS[0].label} value={METRICS[0].value} unit={METRICS[0].unit}
            change={METRICS[0].change} sparkData={METRICS[0].spark} accentColor={METRICS[0].color} theme={theme} />
          {METRICS.slice(1).map((m, i) => (
            <MetricCard key={i} variant="medium" label={m.label} value={m.value}
              change={m.change} sparkData={m.spark} accentColor={m.color} theme={theme} />
          ))}
        </View>
      )}

      {/* Charts Row */}
      <View style={[isDesktop ? ds.row : ds.col, { gap: 16 }]}>
        {/* Performance Distribution — donut */}
        <View style={{ flex: isDesktop ? 1 : undefined }}>
          <PerformanceDistributionChart
            title="Performance Distribution"
            subtitle="Q2 2026"
            themeMode={isDark ? 'dark' : 'light'}
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          />
        </View>

        {/* Property Type Breakdown — inline horizontal bars */}
        <View style={[ds.panel, {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          flex: isDesktop ? 1 : undefined,
          gap: 0,
        }]}>
          <View style={[ds.panelHeader, { marginBottom: 18 }]}>
            <View>
              <Text style={[ds.panelTitle, { color: theme.text }]}>
                {language === 'fr' ? 'Répartition par type' : 'Property Breakdown'}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 } as any}>
                {language === 'fr' ? 'Par type de bien · Q2 2026' : 'By property type · Q2 2026'}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.purpleMuted }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.purpleLight } as any}>24 {language === 'fr' ? 'biens' : 'listings'}</Text>
            </View>
          </View>

          {/* Horizontal bar rows */}
          {[
            { label: language === 'fr' ? 'Appartement' : 'Apartment', count: 10, pct: 42, color: theme.purpleLight },
            { label: language === 'fr' ? 'Villa' : 'Villa',          count: 7,  pct: 29, color: theme.blue },
            { label: language === 'fr' ? 'Maison' : 'House',         count: 4,  pct: 17, color: theme.amber },
            { label: language === 'fr' ? 'Terrain' : 'Land',         count: 2,  pct: 8,  color: theme.red },
            { label: language === 'fr' ? 'Commercial' : 'Commercial', count: 1,  pct: 4,  color: theme.textMuted },
          ].map((row, i) => (
            <View key={i} style={{ marginBottom: i < 4 ? 14 : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color }} />
                  <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '500' } as any}>{row.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12, color: theme.textMuted } as any}>{row.count}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, minWidth: 36, textAlign: 'right' } as any}>{row.pct}%</Text>
                </View>
              </View>
              {/* Track */}
              <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.borderLight }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: row.color, width: `${row.pct}%` as any, opacity: 0.85 }} />
              </View>
            </View>
          ))}

          {/* Divider + summary */}
          <View style={{ height: 1, backgroundColor: theme.borderLight, marginTop: 18, marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[
              { label: language === 'fr' ? 'À vendre' : 'For Sale', val: '16', color: theme.purpleLight },
              { label: language === 'fr' ? 'À louer' : 'For Rent',  val: '8',  color: theme.blue },
              { label: language === 'fr' ? 'Vendus' : 'Sold',       val: '3',  color: theme.green },
            ].map((s, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: s.color, letterSpacing: -0.5 } as any}>{s.val}</Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 } as any}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Revenue Chart Row */}
      <View style={[ds.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={ds.panelHeader}>
          <View>
            <Text style={[ds.panelTitle, { color: theme.text }]}>{t('dash_chart_title')}</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 } as any}>
              July 2026 · <Text style={{ color: theme.purpleLight, fontWeight: '700' } as any}>12.4M FCFA</Text>
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: theme.purpleLight }} />
            <Text style={{ fontSize: 11, color: theme.textMuted } as any}>FCFA</Text>
          </View>
        </View>
        <View style={{ marginTop: 16 }}>
          <RevenueChart theme={theme} />
        </View>
      </View>

      {/* AI & Activity Row */}
      <View style={[isDesktop ? ds.row : ds.col, { gap: 16 }]}>
        <View style={{ flex: isDesktop ? 1.2 : undefined }}>
          <AIPanel theme={theme} t={t} />
        </View>
        <View style={{ flex: isDesktop ? 1 : undefined }}>
          <ActivityPanel activities={ACTIVITIES} theme={theme} t={t} />
        </View>
      </View>

      {/* Table */}
      <View style={{ width: '100%' }}>
        <PropertyList properties={TOP_PROPERTIES} theme={theme} t={t} />
      </View>

      {/* Recent Transactions */}
      <View style={{ width: '100%' }}>
        <RecentTransactionsList theme={theme} />
      </View>
    </View>
  );

  // ── Settings
  const settings = () => (
    <View style={ds.content}>
      <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.6, color: theme.text, marginBottom: 4 } as any}>{t('dash_nav_settings')}</Text>
      <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 28 } as any}>{language === 'en' ? 'Manage preferences & account' : 'Gérer préférences & compte'}</Text>

      {/* Theme preview card */}
      <View style={[ds.panel, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 20 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[ds.settingIconWrap, { backgroundColor: theme.goldBg }]}>
              {isDark ? <Moon size={16} color={theme.gold} /> : <Sun size={16} color={theme.gold} />}
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text } as any}>{isDark ? t('dash_theme_dark') : t('dash_theme_light')}</Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 } as any}>{isDark ? (language === 'en' ? 'Switch to light mode' : 'Passer au mode clair') : (language === 'en' ? 'Switch to dark mode' : 'Passer au mode sombre')}</Text>
            </View>
          </View>
          <ThemeTogglePill isDark={isDark} onToggle={toggleTheme} />
        </View>
      </View>

      {[
        {
          icon: <Globe size={16} color={theme.purple} />,
          bg: theme.purpleMuted,
          title: 'Language / Langue',
          sub: language === 'en' ? 'English' : 'Français',
          right: (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {(['en', 'fr'] as const).map(l => (
                <TouchableOpacity key={l} style={[ds.langBtn, { backgroundColor: language === l ? theme.purple : 'transparent', borderColor: language === l ? theme.purple : theme.borderLight }]} onPress={() => setLanguage(l)}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: language === l ? '#fff' : theme.textMuted } as any}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ),
        },
        {
          icon: <Shield size={16} color={theme.amber} />,
          bg: theme.amberBg,
          title: t('dashboard_admin_panel'),
          sub: language === 'en' ? 'Manage users, content, settings' : 'Gérer utilisateurs, contenu',
          onPress: () => router.push('/admin'),
          right: <ChevronRight size={16} color={theme.textMuted} />,
        },
        {
          icon: <LogOut size={16} color={theme.red} />,
          bg: theme.redBg,
          title: t('profile_logout'),
          sub: language === 'en' ? 'Sign out of your account' : 'Se déconnecter du compte',
          titleColor: theme.red,
        },
      ].map((row, i) => (
        <TouchableOpacity
          key={i}
          style={[ds.settingRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={(row as any).onPress}
          activeOpacity={(row as any).onPress ? 0.7 : 1}
        >
          <View style={[ds.settingIconWrap, { backgroundColor: row.bg }]}>{row.icon}</View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: (row as any).titleColor ?? theme.text } as any}>{row.title}</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 } as any}>{row.sub}</Text>
          </View>
          {row.right}
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Analytics View
  const analyticsView = () => (
    <View style={ds.content}>
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', letterSpacing: -0.6, color: theme.text } as any}>
          {t('dash_nav_analytics')}
        </Text>
        <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 } as any}>
          {language === 'en'
            ? 'Detailed performance metrics, distribution tiers & growth intelligence'
            : 'Métriques de performance détaillées, distribution & intelligence de croissance'}
        </Text>
      </View>

      {/* KPI Grid */}
      <View style={[isDesktop ? ds.row : ds.col, { gap: 12, flexWrap: 'wrap' as any, marginBottom: 20 }]}>
        {[
          { label: language === 'fr' ? 'Score Portfolio' : 'Portfolio Score', value: '94.2%', change: '+3.8%', positive: true, color: theme.purpleLight, icon: '📊' },
          { label: language === 'fr' ? 'Top Performers' : 'High Performers', value: '40.0%', change: '+2.1%', positive: true, color: theme.green, icon: '🏆' },
          { label: language === 'fr' ? 'Délai Moyen' : 'Avg Deal Velocity', value: '18 Days', change: '-4 days', positive: true, color: theme.blue, icon: '⚡' },
          { label: language === 'fr' ? 'Objectif Q2' : 'Quarterly Target', value: '88.5%', change: 'On Track', positive: true, color: theme.amber, icon: '🎯' },
        ].map((kpi, i) => (
          <View key={i} style={[ds.panel, { backgroundColor: theme.surface, borderColor: theme.border, flex: isDesktop ? 1 : undefined, minWidth: isDesktop ? 0 : '48%' as any, padding: 16, gap: 0 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' as any }}>{kpi.label}</Text>
                <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -0.8, marginTop: 6 } as any}>{kpi.value}</Text>
              </View>
              <Text style={{ fontSize: 22 }}>{kpi.icon}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: kpi.positive ? theme.greenBg : theme.redBg }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: kpi.positive ? theme.green : theme.red } as any}>{kpi.change}</Text>
              </View>
              <Text style={{ fontSize: 11, color: theme.textMuted } as any}>{language === 'fr' ? 'vs T1 2026' : 'vs Q1 2026'}</Text>
            </View>
            <View style={{ height: 3, borderRadius: 2, backgroundColor: kpi.color, marginTop: 14, opacity: 0.7 }} />
          </View>
        ))}
      </View>

      {/* Charts */}
      <View style={[isDesktop ? ds.row : ds.col, { gap: 16, marginBottom: 20 }]}>
        <View style={{ flex: isDesktop ? 1.1 : undefined }}>
          <PerformanceDistributionChart
            title="Performance Distribution"
            subtitle="Q2 2026"
            themeMode={isDark ? 'dark' : 'light'}
            size={isDesktop ? 280 : undefined}
          />
        </View>

        <View style={[ds.panel, { backgroundColor: theme.surface, borderColor: theme.border, flex: isDesktop ? 1.2 : undefined }]}>
          <View style={ds.panelHeader}>
            <View>
              <Text style={[ds.panelTitle, { color: theme.text }]}>
                {language === 'en' ? 'Revenue Growth & Distribution' : 'Croissance & Distribution Revenus'}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 } as any}>
                2026 YTD · <Text style={{ color: theme.purpleLight, fontWeight: '700' } as any}>48.2M FCFA Total</Text>
              </Text>
            </View>
          </View>
          <View style={{ marginVertical: 12 }}>
            <RevenueChart theme={theme} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.borderLight }}>
            <View>
              <Text style={{ fontSize: 11, color: theme.textMuted } as any}>Top Category</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text } as any}>Villas (45%)</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: theme.textMuted } as any}>Growth Rate</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' } as any}>+24.5% MoM</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: theme.textMuted } as any}>Active Deals</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#3B82F6' } as any}>148 Units</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <PropertyList properties={TOP_PROPERTIES} theme={theme} t={t} />
      </View>

      <View style={{ marginBottom: 20 }}>
        <RecentTransactionsList theme={theme} />
      </View>
    </View>
  );

  // ── Placeholder
  const placeholder = (title: string, Icon: any) => (
    <View style={ds.content}>
      <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.6, color: theme.text } as any}>{title}</Text>
      <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 6, marginBottom: 32 } as any}>{t('dash_subtitle')}</Text>
      <View style={[ds.panel, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', paddingVertical: 60 }]}>
        <View style={[ds.placeholderIcon, { backgroundColor: theme.purpleMuted }]}>
          <Icon size={32} color={theme.purpleLight} strokeWidth={1.5} />
        </View>
        <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 14, textAlign: 'center', maxWidth: 280 } as any}>
          {language === 'en' ? 'Coming soon — this section is under development.' : 'Bientôt disponible — cette section est en cours de développement.'}
        </Text>
      </View>
    </View>
  );

  const content = () => {
    switch (activeTab) {
      case 'overview':  return overview();
      case 'settings':  return settings();
      case 'analytics': return analyticsView();
      case 'listings':  return placeholder(t('dash_nav_listings'), Building2);
      case 'ai':        return placeholder(t('dash_nav_ai_assistant'), Brain);
      case 'pending':   return placeholder(t('dash_nav_pending'), Clock);
      case 'favorites': return placeholder(t('dash_nav_favorites'), Heart);
      default:          return overview();
    }
  };

  return (
    <View style={[ds.root, { backgroundColor: theme.bg }]}>
      {isDesktop && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={theme}
          t={t}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
      )}
      <View style={[ds.main, { backgroundColor: theme.bg }]}>
        {header()}
        <ScrollView
          style={{ flex: 1, backgroundColor: theme.bg }}
          contentContainerStyle={{ paddingBottom: isMobile ? 80 : 48, backgroundColor: theme.bg }}
          showsVerticalScrollIndicator={false}
        >
          {content()}
        </ScrollView>
      </View>
      {!isDesktop && mobileNav()}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StyleSheet
// ─────────────────────────────────────────────────────────────────────────────

const SHADOW_ELEVATED = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08)' },
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
});

const ds = StyleSheet.create({
  root:    { flex: 1, flexDirection: 'row', width: '100%', minHeight: '100%' },
  main:    { flex: 1, width: '100%' },
  content: { paddingHorizontal: 24, paddingTop: 20, gap: 20, paddingBottom: 24 },

  // ── Sidebar
  sidebar:    { width: 220, borderRightWidth: 1, paddingTop: 28, paddingHorizontal: 10, justifyContent: 'flex-start', minHeight: '100%' as any },
  brandRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, marginBottom: 16 },
  brandIcon:  { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  brandName:  { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 } as any,
  navSection: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8, paddingHorizontal: 10, marginBottom: 4 } as any,
  navRow:     { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10, position: 'relative' as any },
  navBar:     { position: 'absolute', left: 0, top: '15%', width: 3, height: '70%', borderRadius: 2 } as any,
  navLabel:   { fontSize: 13, letterSpacing: -0.1, flex: 1 },
  navBadge:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 } as any,
  sidebarFooter: { borderTopWidth: 1, paddingTop: 12, gap: 2, marginBottom: 20 },

  // ── Header
  headerBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 11, borderBottomWidth: 1, gap: 10 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, paddingVertical: Platform.OS === 'web' ? 8 : 7, borderRadius: 10, maxWidth: 360 },
  searchInput: { flex: 1, fontSize: 13, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) } as any,
  chipBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, borderWidth: 1 },
  iconBtn:     { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' as any },
  dot:         { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4 } as any,
  avatarBtn:   { width: 34, height: 34, borderRadius: 17, overflow: 'hidden' as any },
  avatarInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Theme Toggle Pill
  themeTogglePill: {
    width: 60,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    position: 'relative' as any,
    overflow: 'hidden' as any,
  },
  themeThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    top: 3,
    left: 0,
  },

  // ── Hero section
  heroSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 0, borderRadius: 16, gap: 12 },
  ctaBtn:      {},

  // ── Period
  periodRow:  { flexDirection: 'row', gap: 0 },
  periodTab:  { paddingHorizontal: 12, paddingVertical: 10, position: 'relative' as any },
  periodLine: { position: 'absolute', bottom: -1, left: 12, right: 12, height: 2, borderRadius: 1 } as any,

  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },

  // ── Metric cards
  heroCard: {
    padding: 22,
    borderRadius: 16,
    overflow: 'hidden' as any,
    position: 'relative' as any,
    ...SHADOW_ELEVATED,
  },
  mediumCard:  { padding: 18, borderRadius: 14, borderWidth: 1, position: 'relative' as any, overflow: 'hidden' as any },
  compactCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  changePill:  { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  // ── Panel
  panel:       { borderRadius: 14, borderWidth: 1, padding: 20 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  panelTitle:  { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 } as any,

  // ── Property list
  colRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colHead:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' } as any,
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  // ── Activity
  personAvatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  typeTag:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },

  // ── AI
  aiPanel:  { borderRadius: 14, borderWidth: 1, padding: 18 },
  aiAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  bubble:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  askBar:   { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  sendBtn:  { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  // ── Mobile nav
  mobileBar:    { flexDirection: 'row', borderTopWidth: 1, paddingTop: 6 },
  mobileTab:    { flex: 1, alignItems: 'center', paddingVertical: 8, position: 'relative' as any },
  mobileTabPill: { position: 'absolute', top: 0, width: 28, height: 3, borderRadius: 2 } as any,

  // ── Settings
  settingRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 13, borderWidth: 1, marginBottom: 10 },
  settingIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  langBtn:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },

  // ── Placeholder
  placeholderIcon: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
