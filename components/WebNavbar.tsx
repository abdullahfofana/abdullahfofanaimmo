/**
 * WebNavbar — Premium Pro Navigation Bar for Web.
 * 
 * Features:
 *  • World-class Pro design with glassmorphism (backdrop-filter blur)
 *  • Brand identity with luxury Ivory Coast / Emerald accent badge
 *  • Navigation: Home, Buy, Rent, Search, Favorites (with live badge), Admin/Dashboard
 *  • Interactive Language Switcher (EN / FR)
 *  • Smart Auth status (Login / Sign Up or User Avatar + Name)
 *  • High-conversion '+ Add Property' CTA button with gradient & glow
 *  • Full responsive support across desktop, tablet, and mobile web
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { router, useSegments, useLocalSearchParams } from 'expo-router';
import {
  Home,
  Search,
  Heart,
  Plus,
  Globe,
  Building2,
  Key,
  Shield,
  LogIn,
  Sparkles,
  Bell,
  Moon,
  Sun,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';

interface NavLinkItem {
  key: string;
  labelKey?: string;
  fallbackLabel: string;
  route: string;
  segment: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  badgeCount?: number;
  highlightBadge?: string;
}

export default function WebNavbar() {
  const { t, language, toggleLanguage } = useLanguage();
  const { activeTheme, setTheme } = useTheme();
  const colors = useColors();
  const segments = useSegments();
  const params = useLocalSearchParams<{ status?: string }>();
  const { favorites } = useFavorites();
  const { user, session } = useAuth();
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [showNotifications, setShowNotifications] = useState(false);
  const NOTIFICATIONS = [
    { id: '1', icon: '🏠', title: 'New property in Cocody', time: '2m ago', unread: true },
    { id: '2', icon: '💬', title: 'Agent replied to your inquiry', time: '1h ago', unread: true },
    { id: '3', icon: '📈', title: 'Price drop: Villa Riviera -5%', time: '3h ago', unread: false },
    { id: '4', icon: '✅', title: 'Your property listing was approved', time: '1d ago', unread: false },
  ];
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Only render on Web
  if (Platform.OS !== 'web') return null;

  const isWide = windowWidth >= 1100;
  const isMedium = windowWidth >= 740;
  const activeSegment = segments[segments.length - 1] ?? '';

  const navLinks: NavLinkItem[] = [
    {
      key: 'home',
      labelKey: 'nav_home',
      fallbackLabel: 'Home',
      route: '/(tabs)/home',
      segment: 'home',
      icon: Home,
    },
    {
      key: 'buy',
      labelKey: 'nav_buy',
      fallbackLabel: 'Buy',
      route: '/(tabs)/search?status=sale',
      segment: 'buy',
      icon: Building2,
    },
    {
      key: 'rent',
      labelKey: 'nav_rent',
      fallbackLabel: 'Rent',
      route: '/(tabs)/search?status=rent',
      segment: 'rent',
      icon: Key,
    },
    {
      key: 'search',
      labelKey: 'nav_search',
      fallbackLabel: 'Explore',
      route: '/(tabs)/search',
      segment: 'search',
      icon: Search,
    },
    {
      key: 'favorites',
      labelKey: 'nav_favorites',
      fallbackLabel: 'Favorites',
      route: '/(tabs)/favorites',
      segment: 'favorites',
      icon: Heart,
      badgeCount: favorites.length > 0 ? favorites.length : undefined,
    },
  ];

  const handleNav = (route: string) => {
    router.push(route as any);
  };

  const handleNavLink = (item: NavLinkItem) => {
    if (item.key === 'buy') {
      router.push({ pathname: '/(tabs)/search', params: { status: 'sale' } });
    } else if (item.key === 'rent') {
      router.push({ pathname: '/(tabs)/search', params: { status: 'rent' } });
    } else if (item.key === 'search') {
      router.push({ pathname: '/(tabs)/search', params: { status: 'all' } });
    } else {
      router.push(item.route as any);
    }
  };

  const handleAddProperty = () => {
    handleNav('/(tabs)/add-property');
  };

  return (
    <View style={styles.webHeaderWrapper}>
      <View style={styles.navbarContainer}>
        <View style={styles.innerContent}>
          {/* ── BRAND LOGO ───────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.brandContainer}
            onPress={() => handleNav('/(tabs)/home')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#064e3b', '#047857', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Building2 size={20} color="#FFFFFF" strokeWidth={2.4} />
              <View style={styles.sparkleDot}>
                <Sparkles size={8} color="#FBBF24" />
              </View>
            </LinearGradient>

            <View style={styles.brandTextGroup}>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandTitleImmo}>Immo</Text>
                <Text style={styles.brandTitleCI}>CI</Text>
              </View>
              <Text style={styles.brandTagline}>Immobilier Côte d&apos;Ivoire</Text>
            </View>
          </TouchableOpacity>

          {/* ── NAVIGATION LINKS (Center) ───────────────────────────── */}
          {isMedium && (
            <View style={styles.navLinksRow}>
              {navLinks.map((item) => {
                let isActive = false;
                if (item.key === 'home') {
                  isActive = activeSegment === 'home' || !activeSegment || activeSegment === '(tabs)';
                } else if (item.key === 'buy') {
                  isActive = activeSegment === 'search' && params?.status === 'sale';
                } else if (item.key === 'rent') {
                  isActive = activeSegment === 'search' && params?.status === 'rent';
                } else if (item.key === 'search') {
                  isActive = activeSegment === 'search' && params?.status !== 'sale' && params?.status !== 'rent';
                } else {
                  isActive = activeSegment === item.segment;
                }

                const Icon = item.icon;
                const label = item.labelKey ? t(item.labelKey) || item.fallbackLabel : item.fallbackLabel;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.navLinkItem,
                      isActive && styles.navLinkItemActive,
                    ]}
                    onPress={() => handleNavLink(item)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      size={17}
                      color={isActive ? '#059669' : '#64748B'}
                      strokeWidth={isActive ? 2.4 : 1.8}
                    />
                    <Text
                      style={[
                        styles.navLinkLabel,
                        isActive && styles.navLinkLabelActive,
                      ]}
                    >
                      {label}
                    </Text>

                    {/* Live Counter Badge */}
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <View style={styles.counterBadge}>
                        <Text style={styles.counterBadgeText}>{item.badgeCount}</Text>
                      </View>
                    )}

                    {/* Highlight Pill Badge */}
                    {item.highlightBadge && (
                      <View style={styles.highlightPill}>
                        <Text style={styles.highlightPillText}>{item.highlightBadge}</Text>
                      </View>
                    )}

                    {/* Bottom Active Indicator Bar */}
                    {isActive && <View style={styles.activeBar} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── RIGHT ACTION BUTTONS ─────────────────────────────────── */}
          <View style={styles.rightActionsRow}>
            {/* Notification Bell */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={[styles.languagePill, { paddingHorizontal: 10 }]}
                onPress={() => setShowNotifications(!showNotifications)}
                activeOpacity={0.75}
              >
                <Bell size={16} color="#475569" strokeWidth={2} />
                {unreadCount > 0 && (
                  <View style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Dropdown */}
              {showNotifications && (
                <View style={{
                  position: 'absolute' as any,
                  top: 48,
                  right: 0,
                  width: 320,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(226,232,240,0.9)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.12,
                  shadowRadius: 24,
                  zIndex: 9999,
                  overflow: 'hidden',
                } as any}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.6)' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>Notifications</Text>
                    <TouchableOpacity onPress={() => setShowNotifications(false)}>
                      <Text style={{ fontSize: 12, color: '#059669', fontWeight: '600' }}>Mark all read</Text>
                    </TouchableOpacity>
                  </View>
                  {NOTIFICATIONS.map(n => (
                    <TouchableOpacity key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: n.unread ? 'rgba(5,150,105,0.04)' : 'transparent', borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.4)' }} activeOpacity={0.7}>
                      <Text style={{ fontSize: 22 }}>{n.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: n.unread ? '700' : '500', color: '#0F172A' }}>{n.title}</Text>
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{n.time}</Text>
                      </View>
                      {n.unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' }} />}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={{ padding: 14, alignItems: 'center' }} onPress={() => setShowNotifications(false)}>
                    <Text style={{ fontSize: 13, color: '#059669', fontWeight: '600' }}>View all notifications</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>



            {/* Language Switcher Pill */}
            <TouchableOpacity
              style={styles.languagePill}
              onPress={toggleLanguage}
              activeOpacity={0.75}
              accessibilityLabel="Switch Language"
            >
              <Globe size={14} color="#059669" strokeWidth={2.2} />
              <View style={styles.langPillOptions}>
                <Text
                  style={[
                    styles.langText,
                    language === 'en' ? styles.langTextActive : styles.langTextInactive,
                  ]}
                >
                  EN
                </Text>
                <Text style={styles.langDivider}>|</Text>
                <Text
                  style={[
                    styles.langText,
                    language === 'fr' ? styles.langTextActive : styles.langTextInactive,
                  ]}
                >
                  FR
                </Text>
              </View>
            </TouchableOpacity>

            {/* Auth / User Section */}
            {user || session ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {user?.role === 'admin' && (
                  <TouchableOpacity
                    style={styles.adminBadgeBtn}
                    onPress={() => handleNav('/admin')}
                    activeOpacity={0.8}
                  >
                    <Shield size={13} color="#D97706" strokeWidth={2.4} />
                    <Text style={styles.adminBadgeBtnText}>Admin</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.userProfileBtn}
                  onPress={() => handleNav('/(tabs)/profile')}
                  activeOpacity={0.8}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                  {isWide && (
                    <View style={styles.userInfoCol}>
                      <Text style={styles.userNameText} numberOfLines={1}>
                        {user?.name || 'My Account'}
                      </Text>
                      <Text style={styles.userRoleText}>
                        {user?.role || 'Member'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.authButtonsGroup}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => handleNav('/auth')}
                  activeOpacity={0.75}
                >
                  <LogIn size={15} color="#334155" strokeWidth={2} />
                  <Text style={styles.loginBtnText}>{t('nav_login') || 'Login'}</Text>
                </TouchableOpacity>

                {isWide && (
                  <TouchableOpacity
                    style={styles.signupBtn}
                    onPress={() => handleNav('/auth')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.signupBtnText}>{t('nav_signup') || 'Sign Up'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* + Add Property CTA (High Impact Emerald Button) */}
            <TouchableOpacity
              style={styles.addPropertyCta}
              onPress={handleAddProperty}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={2.8} />
                <Text style={styles.ctaButtonText}>
                  {isMedium ? (t('nav_add_property') || '+ Add Property') : '+ Add'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webHeaderWrapper: {
    width: '100%',
    zIndex: 9999,
    ...(Platform.OS === 'web'
      ? {
          position: 'sticky' as any,
          top: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
        }
      : {
          backgroundColor: '#FFFFFF',
        }),
  },
  navbarContainer: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    height: 72,
    justifyContent: 'center',
  },
  innerContent: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Brand ──────────────────────────────────────────────────
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer' as any,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sparkleDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  brandTitleImmo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  brandTitleCI: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.6,
  },
  proTag: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  proTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  brandTagline: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: -2,
    letterSpacing: 0.1,
  },

  // ── Navigation Links ───────────────────────────────────────
  navLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(241, 245, 249, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  navLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    position: 'relative',
    cursor: 'pointer' as any,
  },
  navLinkItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  navLinkLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: -0.2,
  },
  navLinkLabelActive: {
    color: '#059669',
    fontWeight: '700',
  },
  counterBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  highlightPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  highlightPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  activeBar: {
    position: 'absolute',
    bottom: -1,
    left: '25%',
    right: '25%',
    height: 2.5,
    backgroundColor: '#059669',
    borderRadius: 2,
  },

  // ── Right Action Buttons ───────────────────────────────────
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.8)',
    cursor: 'pointer' as any,
  },
  langPillOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  langTextActive: {
    color: '#059669',
  },
  langTextInactive: {
    color: '#94A3B8',
  },
  langDivider: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '400',
  },

  // Auth Buttons
  authButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.9)',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer' as any,
  },
  loginBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  signupBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    cursor: 'pointer' as any,
  },
  signupBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Admin Badge Button
  adminBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    cursor: 'pointer' as any,
  },
  adminBadgeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.2,
  },

  // User Profile Button (Logged in)
  userProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    cursor: 'pointer' as any,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userInfoCol: {
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 100,
  },
  userRoleText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Primary Add Property CTA
  addPropertyCta: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
    cursor: 'pointer' as any,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
});
